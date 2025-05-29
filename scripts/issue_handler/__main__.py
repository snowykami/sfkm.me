import os

from github import Github
from issue_context import IssueContext

if __name__ == "__main__":
    ctx = IssueContext(
        issue_number=int(os.getenv("GITHUB_EVENT_ISSUE_NUMBER", "0")),
        repository_name=os.getenv("GITHUB_REPOSITORY", ""),
        event_action=os.getenv("GITHUB_EVENT_ACTION", "")
    )
    
    print(ctx)