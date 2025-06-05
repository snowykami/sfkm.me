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
        "opened",
        "edited",
        "closed",
        "reopened",
        "deleted",
        "created",
        "updated",
        "labeled",
        "unlabeled",
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

    async def get_labels(
        self, repo_owner: str, repo_name: str, issue_number: int
    ) -> tuple[list[str], Err]:
        """
        获取 issue 的标签列表。

        Args:
            repo_owner (str): 仓库所有者
            repo_name (str): 仓库名称
            issue_number (int): issue 编号

        Returns:
            _type_: 返回标签列表或 None
        """
        return [], NotImplementedError(
            "This method should be implemented by subclasses"
        )

    async def add_label(
        self, repo_owner: str, repo_name: str, issue_number: int, label: str
    ) -> Err:
        """
        添加标签到 issue。

        Args:
            repo_owner (str): 仓库所有者
            repo_name (str): 仓库名称
            issue_number (int): issue 编号
            label (str): 标签名称

        Returns:
            Err: 返回错误或 None
        """
        return NotImplementedError("This method should be implemented by subclasses")

    async def remove_label(
        self, repo_owner: str, repo_name: str, issue_number: int, label: str
    ) -> Err:
        """
        从 issue 中移除标签。

        Args:
            repo_owner (str): 仓库所有者
            repo_name (str): 仓库名称
            issue_number (int): issue 编号
            label (str): 标签名称

        Returns:
            Err: 返回错误或 None
        """
        return NotImplementedError("This method should be implemented by subclasses")

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
        self,
        repo_owner: str,
        repo_name: str,
        file_path: str,
        content: str,
        message: str = "Update file",
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

    async def get_labels(
        self, repo_owner: str, repo_name: str, issue_number: int
    ) -> tuple[list[str], Err]:
        """
        获取 issue 的标签列表。

        Args:
            repo_owner (str): 仓库所有者
            repo_name (str): 仓库名称
            issue_number (int): issue 编号

        Returns:
            _type_: 返回标签列表或 None
        """
        response = await self.client.get(
            f"/repos/{repo_owner}/{repo_name}/issues/{issue_number}/labels"
        )
        if response.status_code == 200:
            data = response.json()
            return [label["name"] for label in data], None
        return [], Exception(
            f"Failed to fetch labels for issue {issue_number} in {repo_owner}/{repo_name}: {response.text}"
        )

    async def add_label(
        self, repo_owner: str, repo_name: str, issue_number: int, label: str
    ) -> Err:
        """
        添加标签到 issue。

        Args:
            repo_owner (str): 仓库所有者
            repo_name (str): 仓库名称
            issue_number (int): issue 编号
            label (str): 标签名称

        Returns:
            Err: 返回错误或 None
        """
        response = await self.client.post(
            f"/repos/{repo_owner}/{repo_name}/issues/{issue_number}/labels",
            json=[label],
        )
        if response.status_code != 200:
            return Exception(
                f"Failed to add label {label} to issue {issue_number} in {repo_owner}/{repo_name}: {response.text}"
            )
        return None

    async def remove_label(
        self, repo_owner: str, repo_name: str, issue_number: int, label: str
    ) -> Err:
        """
        从 issue 中移除标签。

        Args:
            repo_owner (str): 仓库所有者
            repo_name (str): 仓库名称
            issue_number (int): issue 编号
            label (str): 标签名称

        Returns:
            Err: 返回错误或 None
        """
        response = await self.client.delete(
            f"/repos/{repo_owner}/{repo_name}/issues/{issue_number}/labels/{label}"
        )
        if response.status_code != 200:
            return Exception(
                f"Failed to remove label {label} from issue {issue_number} in {repo_owner}/{repo_name}: {response.text}"
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
        self,
        repo_owner: str,
        repo_name: str,
        file_path: str,
        content: str,
        message: str = "Update file",
    ) -> Err:
        """
        编辑指定仓库的文件内容。

        Args:
            repo_owner (str): 仓库所有者
            repo_name (str): 仓库名称
            file_path (str): 文件路径
            content (str): 新的文件内容
            message (str): 提交消息

        Returns:
            Err: 返回错误或 None
        """
        # 获取当前文件的 SHA
        current_file_response = await self.client.get(
            f"/repos/{repo_owner}/{repo_name}/contents/{file_path}"
        )

        if current_file_response.status_code != 200:
            return Exception(
                f"Failed to get current file {file_path} in {repo_owner}/{repo_name}: {current_file_response.text}"
            )

        file_data = current_file_response.json()
        file_sha = file_data["sha"]

        # 将内容编码为 base64 字符串
        content_bytes = content.encode("utf-8")
        base64_bytes = base64.b64encode(content_bytes)
        base64_string = base64_bytes.decode("utf-8")

        # 提交更新
        response = await self.client.put(
            f"/repos/{repo_owner}/{repo_name}/contents/{file_path}",
            json={"message": message, "content": base64_string, "sha": file_sha},
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
            raise ValueError(f"Failed to fetch user info: {err}")

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

    async def get_one_comment(self) -> tuple[Comment | None, Err]:
        """
        获取当前 issue 当前用户的第一条或者唯一评论，如果存在的话。

        Returns:
            _type_: 返回评论内容或 None
        """
        if not self.client:
            raise ValueError("Client is not initialized.")
        comments, err = await self.get_comments()
        if err:
            return None, err
        for comment in comments:
            if comment.user == self.whoami:
                return comment, None
        return None, None

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

    async def edit_one_comment(self, new_comment: str, add_line: bool = False) -> Err:
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
                if add_line:
                    new_comment = f"{comment.body}\n\n{new_comment}"
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

    async def edit_file(
        self, file_path: str, content: str, message: str = "Update file"
    ) -> Err:
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

    async def set_updated(self):
        """通过去除updated再添加updated标签来触发工作流
        """
        if not self.client:
            raise ValueError("Client is not initialized.")
        # 先检查标签是否存在
        labels, err = await self.client.get_labels(
            self.repo.owner, self.repo.name, self.issue.number
        )
        if err:
            return err
        if "updated" in labels:
            print(f"移除标签 updated 从 issue {self.issue.number} 中。")
            await self.client.remove_label(
                self.repo.owner, self.repo.name, self.issue.number, "updated"
            )
        print(f"添加标签 updated 到 issue {self.issue.number} 中。")
        return await self.client.add_label(
            self.repo.owner, self.repo.name, self.issue.number, "updated"
        )

    async def add_label(self, label: str) -> Err:
        """
        添加标签到 issue。
        Args:
            label (str): 标签名称
        """
        if not self.client:
            return ValueError("Client is not initialized.")
        # 先检查标签是否已经存在
        labels, err = await self.client.get_labels(
            self.repo.owner, self.repo.name, self.issue.number
        )
        if err:
            return err
        if label in labels:
            print(f"标签 {label} 已经存在于 issue {self.issue.number} 中。")
            return None
        print(f"添加标签 {label} 到 issue {self.issue.number} 中。")
        return await self.client.add_label(
            self.repo.owner, self.repo.name, self.issue.number, label
        )

    async def remove_label(self, label: str) -> Err:
        """
        从 issue 中移除标签。
        Args:
            label (str): 标签名称
        """
        if not self.client:
            return ValueError("Client is not initialized.")
        # 先检查标签是否存在
        labels, err = await self.client.get_labels(
            self.repo.owner, self.repo.name, self.issue.number
        )
        if err:
            return err
        if label not in labels:
            print(f"标签 {label} 不存在于 issue {self.issue.number} 中。")
            return None
        print(f"从 issue {self.issue.number} 中移除标签 {label}。")
        return await self.client.remove_label(
            self.repo.owner, self.repo.name, self.issue.number, label
        )

    async def check_passed(self) -> tuple[bool, str | None]:
        """
        检查 issue 是否已经通过，以及是谁添加的 passed 标签。

        Returns:
            tuple[bool, str | None]:
                - 第一个元素：如果 issue 已经通过，返回 True，否则返回 False
                - 第二个元素：添加标签的用户名，如果未找到则为 None
        """
        if not self.client:
            raise ValueError("Client is not initialized.")

        # 先检查 issue 是否有 passed 标签
        labels, err = await self.client.get_labels(
            self.repo.owner, self.repo.name, self.issue.number
        )
        if err:
            raise err if isinstance(err, BaseException) else Exception(str(err))

        has_passed = "passed" in labels

        if has_passed:
            # 获取标签添加者
            response = await self.client.client.get(
                f"/repos/{self.repo.owner}/{self.repo.name}/issues/{self.issue.number}/timeline",
                headers={"Accept": "application/vnd.github.v3+json"},
            )

            if response.status_code != 200:
                print(f"获取 timeline 失败: {response.text}")
                return has_passed, None

            events = response.json()

            # 查找最近的 labeled 事件，其中标签是 "passed"
            for event in reversed(events):
                if (
                    event.get("event") == "labeled"
                    and event.get("label", {}).get("name") == "passed"
                ):
                    actor = event.get("actor", {}).get("login")
                    return has_passed, actor
        return has_passed, None
    
    async def has_label(self, label: str) -> bool:
        """
        检查 issue 是否有指定的标签。

        Args:
            label (str): 标签名称

        Returns:
            bool: 如果 issue 有指定的标签，返回 True，否则返回 False
        """
        if not self.client:
            raise ValueError("Client is not initialized.")
        
        labels, err = await self.client.get_labels(
            self.repo.owner, self.repo.name, self.issue.number
        )
        if err:
            raise err if isinstance(err, BaseException) else Exception(str(err))
        
        return label in labels
    
    async def check_passed_with_permission(self) -> tuple[bool, str | None, bool]:
        """
        检查 issue 是否已通过，谁添加了标签，以及添加者是否有权限。

        Returns:
            tuple[bool, str | None, bool]:
                - 第一个元素：如果 issue 已通过，返回 True，否则返回 False
                - 第二个元素：添加标签的用户名，如果未找到则为 None
                - 第三个元素：添加者是否有权限
        """
        has_passed, labeler = await self.check_passed()
        
        if has_passed and labeler:
            # 检查添加标签的用户是否有权限
            has_permission, err = await self.is_owner_or_maintainer(labeler)
            if err:
                print(f"检查用户权限时出错: {err}")
                return has_passed, labeler, False
            
            return has_passed, labeler, has_permission
        
        return has_passed, labeler, False

    async def is_owner_or_maintainer(self, user_login: str | None = None) -> tuple[bool, Err]:
        """
        检查给定用户是否为仓库所有者或维护者（有写权限）。
        如果未提供用户名，则检查当前用户。

        Args:
            user_login (str, optional): 用户登录名。默认为 None，表示检查当前用户。

        Returns:
            tuple[bool, Err]: 
                - 第一个元素：如果用户是所有者或维护者，返回 True，否则返回 False
                - 第二个元素：如果发生错误，返回错误对象，否则返回 None
        """
        if not self.client:
            return False, ValueError("Client is not initialized.")
        login = user_login or self.whoami
        if not login:
            return False, ValueError("User login not provided and whoami not set.")
        # 获取用户在仓库中的权限
        response = await self.client.client.get(
            f"/repos/{self.repo.owner}/{self.repo.name}/collaborators/{login}/permission"
        )
        if response.status_code != 200:
            return False, Exception(f"Failed to get user permission: {response.text}")
        data = response.json()
        permission = data.get("permission")
        # 检查用户是否有管理员或写入权限
        # GitHub API 返回的权限级别: "admin", "write", "read", "none"
        return permission in ["admin", "write"], None
    
    async def upsert_friend_link(self, friend_link: "FriendLink") -> Err:
        """
        添加友链。

        Args:
            friend_link (FriendLink): 友链对象
        """
        if not self.client:
            return ValueError("Client is not initialized.")
        friend_link_file_content, err = await self.fetch_file(
            os.getenv("FRIEND_LINK_FILE", "data/friends.json")
        )
        if err or friend_link_file_content is None:
            return err

        friend_link_data = json.loads(friend_link_file_content)
        if not isinstance(friend_link_data, list):
            return ValueError("Friend link data is not a list.")

        # 检查是否已经存在相同的友链,有则更新
        is_updated = False
        issue_number_to_check = friend_link.issue_number if hasattr(friend_link, 'issue_number') and friend_link.issue_number else self.issue.number

        for existing_link in friend_link_data:
            if existing_link.get("issue_number", -1) == issue_number_to_check:
                is_updated = True
                print(f"更新友链: {friend_link.name}({friend_link.link})")
                existing_link["name"] = friend_link.name
                existing_link["link"] = str(friend_link.link)
                existing_link["description"] = friend_link.description
                existing_link["avatar"] = str(friend_link.avatar)
                break
        else:
            print(f"添加友链: {friend_link.name}({friend_link.link})")
            friend_link_data.append(
                {
                    "issue_number": issue_number_to_check,
                    "name": friend_link.name,
                    "link": str(friend_link.link),
                    "description": friend_link.description,
                    "avatar": str(friend_link.avatar),
                }
            )
        new_content = json.dumps(friend_link_data, indent=4, ensure_ascii=False)
        err = await self.edit_file(
            os.getenv("FRIEND_LINK_FILE", "data/friends.json"),
            new_content,
            f"friend: add friend {friend_link.name}({friend_link.link})",
        )
        if err:
            return err

        if is_updated:
            await self.edit_one_comment(
                "信息已更新，页面稍后就会构建好~", add_line=True
            )
        return None

    async def delete_friend_link(self, issue_number: int) -> Err:
        """
        删除友链。

        Args:
            issue_number (int): issue 编号
        """
        if not self.client:
            return ValueError("Client is not initialized.")
        friend_link_file_content, err = await self.fetch_file(
            os.getenv("FRIEND_LINK_FILE", "data/friends.json")
        )
        if err or friend_link_file_content is None:
            return err

        friend_link_data = json.loads(friend_link_file_content)
        if not isinstance(friend_link_data, list):
            return ValueError("Friend link data is not a list.")

        # 查找并删除对应的友链
        new_friend_links = [
            link for link in friend_link_data if link.get("issue_number") != issue_number
        ]
        if len(new_friend_links) == len(friend_link_data):
            print(f"未找到 issue {issue_number} 的友链。")
            return None
        print(f"删除 issue {issue_number} 的友链。")
        new_content = json.dumps(new_friend_links, indent=4, ensure_ascii=False)
        err = await self.edit_file(
            os.getenv("FRIEND_LINK_FILE", "data/friends.json"),
            new_content,
            f"friend: delete friend link for issue {issue_number}",
        )
        return err

    async def set_status(self, status: Literal["passed", "failed"]) -> Err:
        """
        设置 issue 的状态标签。

        Args:
            status (str): 状态标签，"passed" 或 "failed"
        """
        if not self.client:
            return ValueError("Client is not initialized.")
        if status == "passed":
            await self.remove_label("failed")
            return await self.add_label("passed")
        elif status == "failed":
            await self.remove_label("passed")
            return await self.add_label("failed")
        else:
            return ValueError(f"Unknown status: {status}")

    async def set_failed(self) -> Err:
        """
        设置 issue 为失败状态，并添加错误信息。

        Args:
            err (Err): 错误信息
        """
        if not self.client:
            return ValueError("Client is not initialized.")
        await self.set_status("failed")
        return None

    async def set_passed(self) -> Err:
        """
        设置 issue 为成功状态。

        Returns:
            Err: 返回错误或 None
        """
        if not self.client:
            return ValueError("Client is not initialized.")
        return await self.set_status("passed")
