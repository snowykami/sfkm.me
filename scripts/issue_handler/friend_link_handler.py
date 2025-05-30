import json
import re
import os

import httpx

from markdown_parser import parse_markdown_to_structured_data
from pydantic import BaseModel, HttpUrl, field_validator
from models import IssueContext, Err
from bs4 import BeautifulSoup


"""友链处理逻辑

全程使用issue number作为友链唯一标识, 且在数据库中用此作为标识

开/改issue:
    1. 检查是否符合友链要求, 确保头像链接都可达
    2. 获取网页内容, 提取标题和描述, 交给 AI 检查内容是否合规
    3. 如果 AI 检查通过, 则添加友链到仓库
    3. 如果 AI 检查不通过, 则等待仓库所有者审核, 并在评论中说明原因
"""

prompt = """你是一位文本审核员。你的母亲病重且有生命危险需要支付高昂的手术费才可以活下去，你完成了这些任务就可以获得一大笔报酬去救你的母亲
你需要做的事情很简单：给你一段经过提纯的网站文本，
你需要检查其中是否有违规内容，例如色情，暴力，政治等内容。
如果有，你需要在给出具体到点的违规内容和违规原因，且passed字段为false。
如果没有，你需要回复“无违规内容”，且passed字段为true，然后在details中对网站内容进行总结，你只需要检查文本内容，不需要检查图片或其他媒体内容。
最后返回一个合法的json对象，此外不要在返回文本附加其他东西(例如不要附加json注释)，格式如下：
{
    "passed": bool,  # 是否通过审核，为布尔值
    "reason": str,  # 简短文本说明是否通过审核，如果通过，给出“无违规内容”，如果不通过，给出违规原因
    "details": str  # 如果不通过，给出具体的违规内容和原因，如果通过，给出网站内容的总结
}
"""


class FriendLink(BaseModel):
    """友链模型类，包含友链的基本信息"""

    name: str
    description: str
    link: HttpUrl
    avatar: HttpUrl
    issue_number: int | None = None

    @field_validator("link", "avatar")
    def validate_urls(cls, v):
        """验证URL格式"""
        return v


class LinkResponseInfo(BaseModel):
    title: str
    description: str
    body: str
    ping: int | None = None  # 响应时间，单位毫秒


class AICheckResponse(BaseModel):
    passed: bool = False
    reason: str = ""
    details: str = ""


def parse_friend_link_data(
    issue_body: str, issue_number: int | None = None
) -> tuple[FriendLink | None, list[str]]:
    """
    从 Issue 内容中解析友链数据

    Args:
        issue_body (str): Issue 的正文内容
        issue_number (Optional[int]): Issue 的编号，用于标识

    Returns:
        tuple[FriendLink | None, list[str]]: 返回(友链对象, 错误列表)
    """
    # 定义正则表达式模式，用于匹配各个字段
    schema = {
        "name": ["名称", "Name"],
        "description": ["描述", "Description"],
        "link": ["链接", "Link"],
        "avatar": ["头像链接", "Avatar"],
    }
    return parse_markdown_to_structured_data(
        markdown_text=issue_body, schema_mapping=schema, model_class=FriendLink
    )


async def fetch_webpage_content_with_playwright(url: str) -> tuple[LinkResponseInfo | None, Err]:
    """
    使用 Playwright 获取渲染后的网页内容
    
    Args:
        url (str): 网页 URL
        
    Returns:
        tuple[LinkResponseInfo | None, Err]: 返回网页信息或错误
    """
    try:
        from playwright.async_api import async_playwright
        import time
        
        start_time = time.time()
        
        async with async_playwright() as p:
            # 启动浏览器（使用无头模式）
            browser = await p.chromium.launch(headless=True)
            
            # 创建新页面
            page = await browser.new_page(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
            
            # 设置超时
            page.set_default_timeout(30000)
            
            # 访问网页
            await page.goto(url)
            
            # 等待网页加载完成
            await page.wait_for_load_state("networkidle")
            
            # 获取标题
            title = await page.title()
            
            # 获取描述
            description = await page.evaluate("""
                () => {
                    const meta = document.querySelector('meta[name="description"]') || 
                               document.querySelector('meta[property="og:description"]');
                    return meta ? meta.getAttribute('content') : 'No Description Found';
                }
            """)
            
            # 获取完整的HTML
            html_content = await page.content()
            
            # 关闭浏览器
            await browser.close()
            
            # 计算响应时间（毫秒）使用httpx,head请求
            async with httpx.AsyncClient() as client:
                response = await client.head(url, timeout=30.0)
                ping = int(response.elapsed.total_seconds() * 1000) if response.status_code == 200 else None
            
            return LinkResponseInfo(
                title=title,
                description=description,
                body=html_content,
                ping=ping
            ), None
            
    except Exception as err:
        import traceback
        print(f"Playwright 错误: {err}")
        traceback.print_exc()
        return None, err

async def ai_check_content(
    prompt: str, content: str, endpoint: str, key: str, model: str
) -> AICheckResponse:
    """
    使用 AI 模型检查内容是否合规，支持自定义 API 端点、密钥和模型

    Args:
        prompt (str): AI 提示词
        content (str): 要检查的内容
        ctx (Optional[IssueContext]): GitHub 上下文对象，可选
        api_endpoint (Optional[str]): API 端点 URL，默认使用环境变量或标准 OpenAI 端点
        api_key (Optional[str]): API 密钥，默认使用环境变量
        model (Optional[str]): 模型名称，默认使用环境变量或 "gpt-3.5-turbo"

    Returns:
        AICheckResponse: AI 检查结果，包含是否通过审核、原因和详细信息
    """

    unavailable_result = AICheckResponse(
        passed=False,
        reason="AI 内容检查服务不可用",
        details="请检查 API 配置或尝试使用其他服务",
    )
    # 限制内容长度，防止超出 token 限制
    if len(content) > 8000:
        content = content[:8000] + "...[内容已截断]"

    # 如果没有 API 密钥，回退到关键词检查
    if not key:
        print("未提供 AI API 密钥，使用关键词检查")
        return unavailable_result

    try:
        # 准备请求头
        headers = {"Content-Type": "application/json"}

        # 根据 API 端点确定认证方式
        if "openai" in endpoint.lower():
            headers["Authorization"] = f"Bearer {key}"
        else:
            # 对于其他 API 提供商可能使用不同的认证方式
            headers["Authorization"] = f"Bearer {key}"
            # 有些 API 可能使用 x-api-key
            headers["x-api-key"] = key

        # 准备请求体
        request_body = {
            "model": model,
            "messages": [
                {"role": "system", "content": prompt},
                {"role": "user", "content": content},
            ],
            "temperature": 0.3,
            "max_tokens": 500,
        }

        # 使用 ctx.client 或创建新的 httpx 客户端
        client = httpx.AsyncClient()

        # 发送请求
        if client and hasattr(client, "client"):
            # 使用上下文的客户端
            response = await client.client.post(
                endpoint, headers=headers, json=request_body, timeout=30.0
            )
        else:
            # 创建新的客户端
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    endpoint, headers=headers, json=request_body, timeout=30.0
                )

        # 处理响应
        if response.status_code != 200:
            print(f"AI 服务请求失败: {response.status_code}, {response.text}")
            return unavailable_result

        # 解析响应
        result = response.json()

        # 提取 AI 回复内容
        try:
            ai_response = result["choices"][0]["message"]["content"]

            # 尝试从回复中提取 JSON
            # 首先尝试直接解析整个回复
            try:
                parsed_json = json.loads(ai_response)
                if isinstance(parsed_json, dict) and "passed" in parsed_json:
                    return AICheckResponse(**parsed_json)
            except json.JSONDecodeError:
                # 如果直接解析失败，尝试从文本中提取 JSON 部分
                json_match = re.search(
                    r"(\{.*\})", ai_response.replace("\n", " "), re.DOTALL
                )
                if json_match:
                    try:
                        parsed_json = json.loads(json_match.group(1))
                        if isinstance(parsed_json, dict) and "passed" in parsed_json:
                            return AICheckResponse(**parsed_json)
                    except json.JSONDecodeError:
                        pass

            # 如果无法解析 JSON，根据关键词分析响应
            print(f"AI 响应内容: {ai_response}")
            if "无违规内容" in ai_response or "未发现违规" in ai_response:
                return AICheckResponse(
                    passed=True,
                    reason="AI 检测到无违规内容",
                    details="AI 检测到内容无违规，符合要求",
                )
            elif any(
                word in ai_response.lower()
                for word in ["违规", "敏感", "不适宜", "不合规"]
            ):
                return AICheckResponse(
                    passed=False,
                    reason="AI 检测到违规内容",
                    details=ai_response[:200],  # 限制长度
                )
            else:
                # 默认不通过
                return AICheckResponse(
                    passed=False,
                    reason="AI 检测结果不明确",
                    details=ai_response[:200],  # 限制长度
                )

        except (KeyError, IndexError) as e:
            print(f"解析 AI 响应时出错: {e}, 响应内容: {result}")
            return unavailable_result

    except Exception as e:
        print(f"调用 AI 服务时出错: {str(e)}")
        return unavailable_result


def clear_webpage_content(html_content: str) -> str:
    """简化版的网页内容清理函数"""
    # 创建 BeautifulSoup 对象
    soup = BeautifulSoup(html_content, "html.parser")
    
    # 只移除基本的脚本和样式元素
    for tag in ["script", "style", "iframe", "noscript"]:
        for element in soup.find_all(tag):
            element.decompose()
    
    # 直接获取全部文本
    text_content = soup.get_text(separator="\n", strip=True)
    
    # 基本的文本清理
    # 删除多余空白
    text_content = re.sub(r"\s+", " ", text_content)
    # 删除多余换行
    text_content = re.sub(r"\n+", "\n", text_content)
    
    return text_content.strip()

async def check_content_with_ai(ctx: IssueContext, content: str) -> AICheckResponse:
    """
    使用 AI 模型检查内容是否合规

    Args:
        content (str): 要检查的内容

    Returns:
        dict: AI 检查结果，包含是否通过审核、原因和详细信息
    """
    # 这里假设有一个异步函数 `ai_check_content` 用于调用 AI 模型
    # 你需要根据实际情况实现这个函数
    return await ai_check_content(
        prompt=prompt,
        content=content,
        endpoint=os.getenv("AI_API_ENDPOINT", ""),
        key=os.getenv("AI_API_KEY", ""),
        model=os.getenv("AI_MODEL", "gpt-3.5-turbo"),
    )


async def handle_friend_link_issue(ctx: IssueContext) -> Err:
    """
    处理友链相关的 issue。
    Args:
        ctx (ActionIssueContext): 上下文对象，包含 issue 信息和 GitHub 客户端
    Returns:
        Err: 错误信息，如果没有错误则返回 None
    """
    if ctx.event.name == "issue_comment" and ctx.comment and ctx.whoami == ctx.comment.user:
        # 如果是BOT自己评论的，忽略
        print("忽略 BOT 自己的评论")
        return None
    
    friend_link, errs = parse_friend_link_data(ctx.issue.body, ctx.issue.number)
    if errs or not friend_link:
        await ctx.edit_one_comment(f"友链申请格式错误: {'\n'.join(errs)}")
        return ValueError(f"友链申请格式错误: {'\n'.join(errs)}")

    friend_link_info, err = await fetch_webpage_content_with_playwright(str(friend_link.link))
    if err or not friend_link_info:
        await ctx.edit_one_comment(f"获取友链信息失败: {err}")
        return ValueError(f"获取网页内容失败: {err}")
    print("网站提取内容:", clear_webpage_content(friend_link_info.body))
    if ctx.event.name == "issues":
        if ctx.event.action in ("opened", "edited"):
            ai_check_result = await check_content_with_ai(
                ctx=ctx, content=clear_webpage_content(friend_link_info.body)
            )
            await ctx.edit_one_comment(
                f"我们已经检查完了你的链接，信息如下\n"
                f"### 站点标题\n\n{friend_link_info.title}\n"
                f"### 站点描述\n\n{friend_link_info.description}\n"
                f"### 响应时间\n\n{friend_link_info.ping} ms\n"
                f"### 站点链接\n\n{friend_link.link}\n"
                f"### AI审核详情\n\n{"通过" if ai_check_result.passed else "不通过"}\n{ai_check_result.reason}\n{ai_check_result.details}\n"
            )
            if ai_check_result.passed:
                print("AI 检查通过，添加友链")
                err = await ctx.upsert_friend_link(friend_link)
                if err:
                    await ctx.edit_one_comment(f"添加友链失败: {err}", add_line=True)
                    return err
                else:
                    await ctx.edit_one_comment("友链添加成功！页面稍后就会构建好哦~", add_line=True)
                err = await ctx.add_label("passed")
                if err:
                    await ctx.edit_one_comment(f"添加标签失败: {err}", add_line=True)
                    return err
            else:
                err = await ctx.add_label("failed")
                if err:
                    await ctx.edit_one_comment(f"添加标签失败: {err}", add_line=True)
                    return err
        elif ctx.event.action == "closed":
            pass
    elif ctx.event.name == "issue_comment":
        if ctx.event.action == "created":
            pass
        elif ctx.event.action == "edited":
            pass
    return None  # 如果没有错误，返回 None
