import asyncio
import os
from models import ActionIssueContext, GitHubClient
from friend_link_handler import handle_friend_link_issue

async def main():
    ctx = ActionIssueContext(
        issue_number=int(os.getenv("GITHUB_EVENT_ISSUE_NUMBER", "0")),
        repository_name=os.getenv("GITHUB_REPOSITORY", ""),
        event_action=os.getenv("GITHUB_EVENT_ACTION", ""),
        client=GitHubClient(os.getenv("GITHUB_TOKEN", ""))
        title=os.getenv("GITHUB_EVENT_ISSUE_TITLE", ""),
        body=os.getenv("GITHUB_EVENT_ISSUE_BODY", "")
    )
    await handle_friend_link_issue(ctx)

if __name__ == "__main__":
    asyncio.run(main())