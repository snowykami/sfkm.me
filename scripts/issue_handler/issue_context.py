from pydantic import BaseModel


class IssueContext(BaseModel):
    """
    Context for issue handling, containing the issue ID and the repository name.
    """
    issue_number: int
    repository_name: str
    event_action: str