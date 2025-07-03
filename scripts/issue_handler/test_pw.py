import asyncio
from friend_link_handler import fetch_webpage_content_with_playwright


async def main():
    url = "https://bot.liteyuki.org/"
    content = await fetch_webpage_content_with_playwright(url)
    print(content)

if __name__ == "__main__":
    asyncio.run(main())