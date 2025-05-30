import asyncio
import os
from models import IssueContext, GitHubClient
from friend_link_handler import handle_friend_link_issue


async def main():
    event_name = os.getenv("GITHUB_EVENT_NAME", "issues")
    event_action = os.getenv("GITHUB_EVENT_ACTION", "opened")
    issue_number = os.getenv("GITHUB_EVENT_ISSUE_NUMBER", "3")
    issue_comment_id = os.getenv("GITHUB_EVENT_COMMENT_ID", "0")
    repository_name = os.getenv("GITHUB_REPOSITORY", "snowykami/sfkm.me")

    ctx = await IssueContext.new(
        client=GitHubClient(token=os.getenv("GITHUB_TOKEN", "")),
        repository_name=repository_name,
        event_name=event_name,
        event_action=event_action,
        issue_number=int(issue_number) if issue_number.isdigit() else 0,
        comment_id=int(issue_comment_id) if issue_comment_id.isdigit() else 0,
    )
    err = await handle_friend_link_issue(ctx)
    if err:
        print(f"Error handling issue: {err}")
        if err := await ctx.edit_one_comment(f"出现错误：{err}", add_line=True):
            print(f"Failed to edit comment: {err}")
        if err := await ctx.set_failed():
            print(f"Failed to set issue as failed: {err}")
    else:
        print("Issue handled successfully.")


if __name__ == "__main__":
    asyncio.run(main())
