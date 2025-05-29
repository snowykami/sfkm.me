import os

from github import Github
from issue_context import IssueContext

if __name__ == "__main__":
    ctx = IssueContext(
        issue_number=int(os.getenv("github.event.issue.number", "0")),
        repository_name=os.getenv("github.repository", ""),
        event_action=os.getenv("github.event.action", "")
    )
    
    print(ctx)