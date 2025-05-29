from typing import Type
from pydantic import BaseModel
from httpx import AsyncClient

type Err = Type[Exception] | Exception | None

class Issue(BaseModel):
    """
    Issue 实现类，包含 issue 的标题、正文和编号。
    """
    title: str
    body: str
    number: int

class ClientInterface:
    def __init__(self, client: AsyncClient):
        self.client = client
    
    async def get_issue(self, owner: str, repo: str, issue_number: int) -> tuple[Issue | None, Err]:
        """
        获取指定仓库的 issue。
        Args:
            owner (str): 仓库所有者
            repo (str): 仓库名称
            issue_number (int): issue 编号

        Returns:
            _type_: 返回 issue 对象或 None
        """
        return None, NotImplementedError("This method should be implemented by subclasses")
    
    async def edit_issue(self, repo_owner: str, repo_name: str, issue_number: int, issue: Issue) -> Err:
        """
        设置 issue 对象。

        Args:
            issue (Issue): 要设置的 issue 对象
        """
        return NotImplementedError("This method should be implemented by subclasses")
    
    async def create_comment(self, repo_owner: str, repo_name: str, issue_number: int, comment: str) -> Err:
        """
        创建 issue 评论。

        Args:
            issue_number (int): issue 编号
            comment (str): 评论内容
        """
        raise NotImplementedError("This method should be implemented by subclasses")
    
    async def edit_comment(self, repo_owner: str, repo_name: str, comment_id: int, new_comment: str) -> Err:
        """
        编辑 issue 评论。

        Args:
            comment_id (int): 评论 ID
            new_comment (str): 新的评论内容
        """
        raise NotImplementedError("This method should be implemented by subclasses")
    
    async def close_issue(self, repo_owner: str, repo_name: str, issue_number: int) -> Err:
        """
        关闭 issue。

        Args:
            issue_number (int): issue 编号
        """
        raise NotImplementedError("This method should be implemented by subclasses")
    
class GitHubClient(ClientInterface):
    """
    GitHub 客户端，用于获取 issue。
    """
    def __init__(self, token: str):
        client = AsyncClient(
            base_url="https://api.github.com",
            headers={"Authorization": f"token {token}"}
        )
        super().__init__(client)
        
    async def get_issue(self, owner: str, repo: str, issue_number: int) -> tuple[Issue | None, Err]:
        """
        获取指定仓库的 issue。

        Args:
            owner (str): 仓库所有者
            repo (str): 仓库名称
            issue_number (int): issue 编号

        Returns:
            _type_: 返回 issue 对象或 None
        """
        response = await self.client.get(f"/repos/{owner}/{repo}/issues/{issue_number}")
        if response.status_code == 200:
            data = response.json()
            return Issue(title=data['title'], body=data['body'], number=data['number']), None
        return None, Exception(f"Failed to fetch issue {issue_number} from {owner}/{repo}: {response.text}")
    
    async def edit_issue(self, owner: str, repo: str, issue_number: int, issue: Issue) -> Err:
        """
        编辑指定仓库的 issue。

        Args:
            owner (str): 仓库所有者
            repo (str): 仓库名称
            issue_number (int): issue 编号
            issue (Issue): 要更新的 issue 对象
        """
        response = await self.client.patch(f"/repos/{owner}/{repo}/issues/{issue_number}", json={
            "title": issue.title,
            "body": issue.body
        })
        if response.status_code != 200:
            return Exception(f"Failed to edit issue {issue_number} in {owner}/{repo}: {response.text}")
        return None
        
    async def create_comment(self, owner: str, repo: str, issue_number: int, comment: str) -> Err:
        """
        创建 issue 评论。

        Args:
            owner (str): 仓库所有者
            repo (str): 仓库名称
            issue_number (int): issue 编号
            comment (str): 评论内容
        """
        response = await self.client.post(f"/repos/{owner}/{repo}/issues/{issue_number}/comments", json={
            "body": comment
        })
        if response.status_code != 201:
            return Exception(f"Failed to create comment on issue {issue_number} in {owner}/{repo}: {response.text}")
        return None
        
    async def edit_comment(self, owner: str, repo: str, comment_id: int, new_comment: str) -> Err:
        """
        编辑 issue 评论。
        Args:
            owner (str): 仓库所有者
            repo (str): 仓库名称
            comment_id (int): 评论 ID
            new_comment (str): 新的评论内容
        """
        response = await self.client.patch(f"/repos/{owner}/{repo}/issues/comments/{comment_id}", json={
            "body": new_comment
        })
        if response.status_code != 200:
            return Exception(f"Failed to edit comment {comment_id} in {owner}/{repo}: {response.text}")
        return None
    
class GiteaClient(ClientInterface):
    """
    Gitea 客户端，用于获取 issue。
    """
    def __init__(self, base_url: str, token: str):
        """
        初始化 Gitea 客户端。

        Args:
            base_url (str): _description_
            token (str): _description_
        """
        client = AsyncClient(
            base_url=base_url,
            headers={"Authorization": f"token {token}"}
        )
        super().__init__(client)
        
    async def get_issue(self, owner: str, repo: str, issue_number: int) -> tuple[Issue | None, Err]:
        """
        获取指定仓库的 issue。

        Args:
            owner (str): 仓库所有者
            repo (str): 仓库名称
            issue_number (int): issue 编号

        Returns:
            _type_: 返回 issue 对象或 None
        """
        response = await self.client.get(f"/repos/{owner}/{repo}/issues/{issue_number}")
        if response.status_code == 200:
            data = response.json()
            return Issue(title=data['title'], body=data['body'], number=data['number']), None
        return None, Exception(f"Failed to fetch issue {issue_number} from {owner}/{repo}: {response.text}")
        

class ActionIssueContext:
    """
    Context for issue handling, containing the issue ID and the repository details.
    """
    def __init__(self, issue_number: int, repository_name: str, event_action: str, client: ClientInterface):
        self.issue_number = issue_number
        self.repo_owner, self.repo_name = repository_name.split('/')
        self.event_action = event_action
        self.client = client
            
    def __repr__(self):
        return f"ActionIssueContext(issue_number={self.issue_number}, repo_owner={self.repo_owner}, repo_name={self.repo_name}, event_action={self.event_action})"
                
    async def get_issue(self) -> tuple[Issue | None, Err]:
        """
        获取 issue 对象。

        Returns:
            _type_: 返回 issue 对象或 None
        """
        if not self.client:
            raise ValueError("Client is not initialized.")
        return await self.client.get_issue(self.repo_owner, self.repo_name, self.issue_number)
    
    async def edit_issue(self, issue: Issue) -> Err:
        """
        编辑 issue。

        Args:
            issue (Issue): 要编辑的 issue 对象
        """
        if not self.client:
            raise ValueError("Client is not initialized.")
        return await self.client.edit_issue(self.repo_owner, self.repo_name, self.issue_number, issue)
    
    async def create_comment(self, comment: str) -> Err:
        """
        创建 issue 评论。

        Args:
            comment (str): 评论内容
        """
        if not self.client:
            raise ValueError("Client is not initialized.")
        return await self.client.create_comment(self.repo_owner, self.repo_name, self.issue_number, comment)
    
    async def edit_comment(self, comment_id: int, new_comment: str) -> Err:
        """
        编辑 issue 评论。

        Args:
            comment_id (int): 评论 ID
            new_comment (str): 新的评论内容
        """
        if not self.client:
            raise ValueError("Client is not initialized.")
        return await self.client.edit_comment(self.repo_owner, self.repo_name, comment_id, new_comment)
