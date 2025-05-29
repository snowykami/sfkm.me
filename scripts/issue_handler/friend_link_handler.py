import re

from pydantic import BaseModel, HttpUrl, field_validator
from models import ActionIssueContext, Err

"""友链处理逻辑

全程使用issue number作为友链唯一标识, 且在数据库中用此作为标识

新开issue:
    1. 检查是否符合友链要求, 确保头像链接都可达
    2. 添加评论，友链申请已提交，等待审核
"""

class FriendLink(BaseModel):
    """友链模型类，包含友链的基本信息"""
    name: str
    description: str
    link: HttpUrl
    avatar: HttpUrl
    issue_number: int | None = None

    @field_validator('link', 'avatar')
    def validate_urls(cls, v):
        """验证URL格式"""
        return v


def parse_friend_link_data(issue_body: str, issue_number: int | None = None) -> tuple[FriendLink | None, list[str]]:
    """
    从 Issue 内容中解析友链数据
    
    Args:
        issue_body (str): Issue 的正文内容
        issue_number (Optional[int]): Issue 的编号，用于标识
        
    Returns:
        tuple[FriendLink | None, list[str]]: 返回(友链对象, 错误列表)
    """
    errors = []
    
    # 定义正则表达式模式，用于匹配各个字段
    patterns = {
        "name": r"### 名称\s*\n\n(.*?)(?=\n\n###|$)",
        "description": r"### 描述\s*\n\n(.*?)(?=\n\n###|$)",
        "link": r"### 链接\s*\n\n(.*?)(?=\n\n###|$)",
        "avatar": r"### 头像链接\s*\n\n(.*?)(?=\n\n###|$)"
    }
    
    # 提取数据
    extracted_data: dict = {}
    for field, pattern in patterns.items():
        match = re.search(pattern, issue_body, re.DOTALL)
        if match:
            extracted_data[field] = match.group(1).strip()
        else:
            errors.append(f"缺少{field}字段")
    
    # 如果有issue_number，添加到数据中
    if issue_number:
        extracted_data["issue_number"] = issue_number
    
    # 验证数据
    if len(errors) == 0:
        try:
            # 使用Pydantic模型验证数据
            friend_link = FriendLink(name=extracted_data["name"],
                                     description=extracted_data["description"],
                                     link=extracted_data["link"],
                                     avatar=extracted_data["avatar"],
                                     issue_number=extracted_data.get("issue_number"))
            return friend_link, errors
        except Exception as e:
            errors.append(f"数据验证失败: {str(e)}")
    return None, errors

async def handle_friend_link_issue(ctx: ActionIssueContext) -> Err:
    """
    处理友链相关的 issue。

    Args:
        ctx (ActionIssueContext): 上下文对象，包含 issue 信息和 GitHub 客户端

    Returns:
        Err: 错误信息，如果没有错误则返回 None
    """
    fl, errs = parse_friend_link_data(ctx.body, ctx.issue_number)
    print(f"Parsed friend link data: {fl}, Errors: {errs}")
    if ctx.event_action == "opened":
        # 检查友链
        return await ctx.create_comment("感谢您提交友链申请！请确保您的网站符合我们的友链要求。我们会尽快审核您的申请。")
    elif ctx.event_action == "edited":
        # 更新友链
        return await ctx.create_comment("您的友链申请已被编辑。请确保所有信息正确无误。")
    elif ctx.event_action == "closed":
        # 创建友链
        return await ctx.create_comment("您的友链申请已被关闭。如果您有任何疑问，请联系我们。")
    
    return None  # 如果没有错误，返回 None