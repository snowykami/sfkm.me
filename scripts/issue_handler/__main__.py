import asyncio
import os
from models import ActionIssueContext, GitHubClient

async def main():
    ctx = ActionIssueContext(
        issue_number=int(os.getenv("GITHUB_EVENT_ISSUE_NUMBER", "0")),
        repository_name=os.getenv("GITHUB_REPOSITORY", ""),
        event_action=os.getenv("GITHUB_EVENT_ACTION", ""),
        client=GitHubClient(os.getenv("GITHUB_TOKEN", ""))
    )
    print(ctx)

if __name__ == "__main__":
    asyncio.run(main())