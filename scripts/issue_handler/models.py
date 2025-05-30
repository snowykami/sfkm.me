import json
import os
import base64
from typing import Literal, Type, TYPE_CHECKING
from pydantic import BaseModel
from httpx import AsyncClient

if TYPE_CHECKING:
    from friend_link_handler import FriendLink

type Err = Type[BaseException] | BaseException | None


class Repo(BaseModel):
    """
    仓库信息类，包含仓库的所有者和名称。
    """

    owner: str
    name: str

    def __str__(self):
        return f"{self.owner}/{self.name}"

    def __repr__(self):
        return f"Repo(owner={self.owner}, name={self.name})"


class Issue(BaseModel):
    """
    Issue 实现类，包含 issue 的标题、正文和编号。
    """

    title: str
    body: str
    number: int


class Comment(BaseModel):
    user: str
    comment_id: int
    body: str
    role: str


class Event(BaseModel):
    name: Literal["issues", "issue_comment"]
    action: Literal[
        "opened", "edited", "closed", "reopened", "deleted", "created", "updated"
    ]


class ClientInterface:
    def __init__(self, client: AsyncClient):
        self.client = client

    async def whoami(self) -> tuple[str | None, Err]:
        """
        获取当前用户信息。

        Returns:
            _type_: 返回用户名或 None
        """
        return None, NotImplementedError(
            "This method should be implemented by subclasses"
        )

    async def fetch_issue(
        self, owner: str, repo: str, issue_number: int
    ) -> tuple[Issue | None, Err]:
        """
        获取指定仓库的 issue。
        Args:
            owner (str): 仓库所有者
            repo (str): 仓库名称
            issue_number (int): issue 编号

        Returns:
            _type_: 返回 issue 对象或 None
        """
        return None, NotImplementedError(
            "This method should be implemented by subclasses"
        )

    async def edit_issue(
        self, repo_owner: str, repo_name: str, issue_number: int, issue: Issue
    ) -> Err:
        """
        设置 issue 对象。

        Args:
            issue (Issue): 要设置的 issue 对象
        """
        return NotImplementedError("This method should be implemented by subclasses")

    async def close_issue(
        self, repo_owner: str, repo_name: str, issue_number: int
    ) -> Err:
        """
        关闭 issue。

        Args:
            issue_number (int): issue 编号
        """
        return NotImplementedError("This method should be implemented by subclasses")

    async def get_comment(
        self, repo_owner: str, repo_name: str, comment_id: int
    ) -> tuple[Comment | None, Err]:
        """
        获取 issue 评论。

        Args:
            comment_id (int): 评论 ID
        """
        raise NotImplementedError("This method should be implemented by subclasses")

    async def get_comments(
        self, repo_owner: str, repo_name: str, issue_number: int
    ) -> tuple[list[Comment], Err]:
        """
        获取 issue 评论列表。

        Args:
            issue_number (int): issue 编号
        """
        raise NotImplementedError("This method should be implemented by subclasses")

    async def create_comment(
        self, repo_owner: str, repo_name: str, issue_number: int, comment: str
    ) -> Err:
        """
        创建 issue 评论。

        Args:
            issue_number (int): issue 编号
            comment (str): 评论内容
        """
        raise NotImplementedError("This method should be implemented by subclasses")

    async def edit_comment(
        self, repo_owner: str, repo_name: str, comment_id: int, new_comment: str
    ) -> Err:
        """
        编辑 issue 评论。

        Args:
            comment_id (int): 评论 ID
            new_comment (str): 新的评论内容
        """
        raise NotImplementedError("This method should be implemented by subclasses")

    async def fetch_file(
        self, repo_owner: str, repo_name: str, file_path: str
    ) -> tuple[str | None, Err]:
        """
        获取指定仓库的文件内容。

        Args:
            repo_owner (str): 仓库所有者
            repo_name (str): 仓库名称
            file_path (str): 文件路径

        Returns:
            _type_: 返回文件内容或 None
        """
        return None, NotImplementedError(
            "This method should be implemented by subclasses"
        )

    async def edit_file(
        self, repo_owner: str, repo_name: str, file_path: str, content: str, message: str = "Update file"
    ) -> Err:
        """
        编辑指定仓库的文件内容。

        Args:
            repo_owner (str): 仓库所有者
            repo_name (str): 仓库名称
            file_path (str): 文件路径
            content (str): 新的文件内容

        Returns:
            _type_: 返回编辑结果或 None
        """
        return NotImplementedError("This method should be implemented by subclasses")


class GitHubClient(ClientInterface):
    """
    GitHub 客户端，用于获取 issue。
    """

    def __init__(self, token: str):
        client = AsyncClient(
            base_url="https://api.github.com",
            headers={"Authorization": f"token {token}"},
        )
        super().__init__(client)
        
    async def whoami(self) -> tuple[str | None, Err]:
        """
        获取当前用户信息。

        Returns:
            _type_: 返回用户名或 None
        """
        response = await self.client.get("/user")
        if response.status_code == 200:
            data = response.json()
            return data["login"], None
        return None, Exception(f"Failed to fetch user info: {response.text}")

    async def fetch_issue(
        self, owner: str, repo: str, issue_number: int
    ) -> tuple[Issue | None, Err]:
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
            return Issue(
                title=data["title"], body=data["body"], number=data["number"]
            ), None
        return None, Exception(
            f"Failed to fetch issue {issue_number} from {owner}/{repo}: {response.text}"
        )

    async def edit_issue(
        self, owner: str, repo: str, issue_number: int, issue: Issue
    ) -> Err:
        """
        编辑指定仓库的 issue。

        Args:
            owner (str): 仓库所有者
            repo (str): 仓库名称
            issue_number (int): issue 编号
            issue (Issue): 要更新的 issue 对象
        """
        response = await self.client.patch(
            f"/repos/{owner}/{repo}/issues/{issue_number}",
            json={"title": issue.title, "body": issue.body},
        )
        if response.status_code != 200:
            return Exception(
                f"Failed to edit issue {issue_number} in {owner}/{repo}: {response.text}"
            )
        return None

    async def close_issue(self, owner: str, repo: str, issue_number: int) -> Err:
        """
        关闭指定仓库的 issue。
        Args:
            owner (str): 仓库所有者
            repo (str): 仓库名称
            issue_number (int): issue 编号
        """
        response = await self.client.patch(
            f"/repos/{owner}/{repo}/issues/{issue_number}",
            json={"state": "closed"},
        )
        if response.status_code != 200:
            return Exception(
                f"Failed to close issue {issue_number} in {owner}/{repo}: {response.text}"
            )
        return None

    async def get_comment(
        self, owner: str, repo: str, comment_id: int
    ) -> tuple[Comment | None, Err]:
        """
        获取 issue 评论。

        Args:
            owner (str): 仓库所有者
            repo (str): 仓库名称
            comment_id (int): 评论 ID

        Returns:
            _type_: 返回评论内容或 None
        """
        response = await self.client.get(
            f"/repos/{owner}/{repo}/issues/comments/{comment_id}"
        )
        if response.status_code == 200:
            data = response.json()
            return Comment(
                user=data["user"]["login"],
                comment_id=data["id"],
                body=data["body"],
                role=data.get("author_association"),  # 默认角色为 'user'
            ), None
        return None, Exception(
            f"Failed to fetch comment {comment_id} from {owner}/{repo}: {response.text}"
        )

    async def get_comments(
        self, owner: str, repo: str, issue_number: int
    ) -> tuple[list[Comment], Err]:
        """
        获取 issue 评论列表。

        Args:
            owner (str): 仓库所有者
            repo (str): 仓库名称
            issue_number (int): issue 编号

        Returns:
            _type_: 返回评论内容列表或 None
        """
        response = await self.client.get(
            f"/repos/{owner}/{repo}/issues/{issue_number}/comments"
        )
        if response.status_code == 200:
            data = response.json()
            return [
                Comment(
                    user=comment["user"]["login"],
                    comment_id=comment["id"],
                    body=comment["body"],
                    role=comment.get("author_association"),  # 默认角色为 'user'
                )
                for comment in data
            ], None
        return [], Exception(
            f"Failed to fetch comments for issue {issue_number} in {owner}/{repo}: {response.text}"
        )

    async def create_comment(
        self, owner: str, repo: str, issue_number: int, comment: str
    ) -> Err:
        """
        创建 issue 评论。

        Args:
            owner (str): 仓库所有者
            repo (str): 仓库名称
            issue_number (int): issue 编号
            comment (str): 评论内容
        """
        response = await self.client.post(
            f"/repos/{owner}/{repo}/issues/{issue_number}/comments",
            json={"body": comment},
        )
        if response.status_code != 201:
            return Exception(
                f"Failed to create comment on issue {issue_number} in {owner}/{repo}: {response.text}"
            )
        return None

    async def edit_comment(
        self, owner: str, repo: str, comment_id: int, new_comment: str
    ) -> Err:
        """
        编辑 issue 评论。
        Args:
            owner (str): 仓库所有者
            repo (str): 仓库名称
            comment_id (int): 评论 ID
            new_comment (str): 新的评论内容
        """
        response = await self.client.patch(
            f"/repos/{owner}/{repo}/issues/comments/{comment_id}",
            json={"body": new_comment},
        )
        if response.status_code != 200:
            return Exception(
                f"Failed to edit comment {comment_id} in {owner}/{repo}: {response.text}"
            )
        return None

    async def fetch_file(
        self, repo_owner: str, repo_name: str, file_path: str
    ) -> tuple[str | None, Err]:
        """
        获取指定仓库的文件内容。

        Args:
            repo_owner (str): 仓库所有者
            repo_name (str): 仓库名称
            file_path (str): 文件路径

        Returns:
            _type_: 返回文件内容或 None
        """
        response = await self.client.get(
            f"/repos/{repo_owner}/{repo_name}/contents/{file_path}"
        )
        if response.status_code == 200:
            data = response.json()
            # 从base64转换    
            return base64.b64decode(data["content"]).decode("utf-8"), None
        return None, Exception(
            f"Failed to fetch file {file_path} from {repo_owner}/{repo_name}: {response.text}"
        )

    async def edit_file(
        self, repo_owner: str, repo_name: str, file_path: str, content: str, message: str = "Update file"
    ) -> Err:
        """
        编辑指定仓库的文件内容。

        Args:
            repo_owner (str): 仓库所有者
            repo_name (str): 仓库名称
            file_path (str): 文件路径
            content (str): 新的文件内容

        Returns:
            _type_: 返回编辑结果或 None
        """
        response = await self.client.put(
            f"/repos/{repo_owner}/{repo_name}/contents/{file_path}",
            json={"message": message, "content": base64.b64encode(content.encode("utf-8")).decode("utf-8")}
        )
        if response.status_code != 200:
            return Exception(
                f"Failed to edit file {file_path} in {repo_owner}/{repo_name}: {response.text}"
            )
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
            base_url=base_url, headers={"Authorization": f"token {token}"}
        )
        super().__init__(client)

    async def whoami(self) -> tuple[str | None, Err]:
        """
        获取当前用户信息。

        Returns:
            _type_: 返回用户名或 None
        """
        response = await self.client.get("/user")
        if response.status_code == 200:
            data = response.json()
            return data["login"], None
        return None, Exception(f"Failed to fetch user info: {response.text}")

    async def fetch_issue(
        self, owner: str, repo: str, issue_number: int
    ) -> tuple[Issue | None, Err]:
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
            return Issue(
                title=data["title"], body=data["body"], number=data["number"]
            ), None
        return None, Exception(
            f"Failed to fetch issue {issue_number} from {owner}/{repo}: {response.text}"
        )


class IssueContext:
    """
    Context for issue handling, containing the issue ID and the repository details.
    """

    def __init__(
        self,
        client: ClientInterface,
        repo: Repo,
        issue: Issue,
        event: Event,
        comment: Comment | None = None,
        whoami: str | None = None,
    ):
        self.client = client
        self.repo = repo
        self.issue = issue
        self.event = event
        self.client = client
        self.comment = comment
        self.whoami = whoami

    @classmethod
    async def new(
        cls,
        client: ClientInterface,
        repository_name: str,
        event_name: Literal["issues", "issue_comment"],
        event_action: Literal[
            "opened", "edited", "closed", "reopened", "deleted", "created", "updated"
        ],
        issue_number: int,
        comment_id: int,
    ) -> "IssueContext":
        """
        创建一个新的 IssueContext 实例。
        Args:
            client (ClientInterface): GitHub 或 Gitea 客户端实例
            repository_name (str): 仓库名称，格式为 "owner/repo"
            event_name (str): 事件名称: issue, issue_comment
            target_id (int): 目标 ID
        Returns:
            IssueContext: 返回 IssueContext 实例
        """
        repo_owner, repo_name = repository_name.split("/", 1)
        event = Event(name=event_name, action=event_action)

        issue, err = await client.fetch_issue(
            repo_owner, repo_name, issue_number
        )  # Ensure the issue exists
        if err or not issue:
            raise ValueError(
                f"Failed to fetch issue {issue_number} from {repo_owner}/{repo_name}: {err}"
            )

        whoami, err = await client.whoami()
        if err or not whoami:
            raise ValueError(
                f"Failed to fetch user info: {err}"
            )

        comment = None
        if event_action == "issue_comment":
            comment, err = await client.get_comment(repo_owner, repo_name, comment_id)
            if err or not comment:
                raise err if isinstance(err, BaseException) else Exception(str(err))

        return cls(
            client=client,
            repo=Repo(owner=repo_owner, name=repo_name),
            issue=issue,
            event=event,
            comment=comment,
            whoami=whoami,
        )

    def __repr__(self):
        return f"IssueContext(issue_number={self.issue_number}, repo_owner={self.repo_owner}, repo_name={self.repo_name}, event_action={self.event_action})"

    async def get_issue(self) -> tuple[Issue | None, Err]:
        """
        获取 issue 对象。

        Returns:
            _type_: 返回 issue 对象或 None
        """
        if not self.client:
            raise ValueError("Client is not initialized.")
        return await self.client.fetch_issue(
            self.repo.owner, self.repo.name, self.issue.number
        )

    async def edit_issue(self) -> Err:
        """
        编辑 issue。

        Args:
            issue (Issue): 要编辑的 issue 对象
        """
        if not self.client:
            raise ValueError("Client is not initialized.")
        return await self.client.edit_issue(
            self.repo.owner, self.repo.name, self.issue.number, self.issue
        )

    async def close_issue(self) -> Err:
        """
        关闭 issue。

        Args:
            issue_number (int): issue 编号
        """
        if not self.client:
            raise ValueError("Client is not initialized.")
        return await self.client.close_issue(
            self.repo.owner, self.repo.name, self.issue.number
        )

    async def get_comment(self, comment_id: int) -> tuple[Comment | None, Err]:
        """
        获取 issue 评论。

        Args:
            comment_id (int): 评论 ID
        """
        if not self.client:
            raise ValueError("Client is not initialized.")
        return await self.client.get_comment(
            self.repo.owner, self.repo.name, comment_id
        )

    async def get_comments(self) -> tuple[list[Comment], Err]:
        """
        获取 issue 评论列表。

        Returns:
            _type_: 返回评论内容列表或 None
        """
        if not self.client:
            raise ValueError("Client is not initialized.")
        return await self.client.get_comments(
            self.repo.owner, self.repo.name, self.issue.number
        )

    async def create_comment(self, comment: str) -> Err:
        """
        创建 issue 评论。

        Args:
            comment (str): 评论内容
        """
        if not self.client:
            raise ValueError("Client is not initialized.")
        return await self.client.create_comment(
            self.repo.owner, self.repo.name, self.issue.number, comment
        )

    async def edit_comment(self, comment_id: int, new_comment: str) -> Err:
        """
        编辑 issue 评论。

        Args:
            comment_id (int): 评论 ID
            new_comment (str): 新的评论内容
        """
        if not self.client:
            raise ValueError("Client is not initialized.")
        return await self.client.edit_comment(
            self.repo.owner, self.repo.name, comment_id, new_comment
        )

    async def edit_one_comment(self, new_comment: str) -> Err:
        """
        编辑当前 issue 的第一条或者唯一评论，如果存在的话，否则创建。

        Args:
            new_comment (str): 新的评论内容
        """
        comments, err = await self.get_comments()
        if err:
            return err
        for comment in comments:
            if comment.user == self.whoami:
                return await self.edit_comment(comment.comment_id, new_comment)
        return await self.create_comment(new_comment)

    async def fetch_file(self, file_path: str) -> tuple[str | None, Err]:
        """
        获取指定仓库的文件内容。

        Args:
            file_path (str): 文件路径

        Returns:
            _type_: 返回文件内容或 None
        """
        if not self.client:
            return None, ValueError("Client is not initialized.")
        return await self.client.fetch_file(self.repo.owner, self.repo.name, file_path)

    async def edit_file(self, file_path: str, content: str, message: str = "Update file") -> Err:
        """
        编辑指定仓库的文件内容。

        Args:
            file_path (str): 文件路径
            content (str): 新的文件内容

        Returns:
            _type_: 返回编辑结果或 None
        """
        if not self.client:
            return ValueError("Client is not initialized.")
        return await self.client.edit_file(
            self.repo.owner, self.repo.name, file_path, content, message
        )

    async def upsert_friend_link(self, friend_link: "FriendLink") -> Err:
        """
        添加友链。

        Args:
            friend_link (FriendLink): 友链对象
        """
        if not self.client:
            return ValueError("Client is not initialized.")
        friend_link_file_content, err = await self.fetch_file(os.getenv("FRIEND_LINK_FILE", "data/friends.json"))
        if err or friend_link_file_content is None:
            return err
        
        friend_link_data = json.loads(friend_link_file_content)
        if not isinstance(friend_link_data, list):
            return ValueError("Friend link data is not a list.")
        
        # 检查是否已经存在相同的友链,有则更新
        for existing_link in friend_link_data:
            if existing_link.get("issue_number", -1) == friend_link.issue_number:
                print(f"更新友链: {friend_link.name}({friend_link.link})")
                existing_link["name"] = friend_link.name
                existing_link["link"] = str(friend_link.link)
                existing_link["description"] = friend_link.description
                existing_link["avatar"] = str(friend_link.avatar)
                break
        else:
            print(f"添加友链: {friend_link.name}({friend_link.link})")
            friend_link_data.append({
                "issue_number": friend_link.issue_number,
                "name": friend_link.name,
                "link": str(friend_link.link),
                "description": friend_link.description,
                "avatar": str(friend_link.avatar),
            })
        new_content = json.dumps(friend_link_data, indent=4)
        err = await self.edit_file(os.getenv("FRIEND_LINK_FILE", "data/friends.json"), new_content, f"friend: add friend {friend_link.name}({friend_link.link})")
        if err:
            return err
        return None
