from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from friend_link_handler import LinkResponseInfo, Err

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
            
            # 计算响应时间（毫秒）
            ping = int((time.time() - start_time) * 1000)
            
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