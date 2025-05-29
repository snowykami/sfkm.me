from models import ActionIssueContext, Err


async def handle_friend_link_issue(ctx: ActionIssueContext) -> Err:
    """
    处理友链相关的 issue。

    Args:
        ctx (ActionIssueContext): 上下文对象，包含 issue 信息和 GitHub 客户端

    Returns:
        Err: 错误信息，如果没有错误则返回 None
    """
    if ctx.event_action == "opened":
        # 处理新开 issue 的逻辑
        return await ctx.create_comment("感谢您提交友链申请！请确保您的网站符合我们的友链要求。我们会尽快审核您的申请。")
    
    elif ctx.event_action == "edited":
        return await ctx.create_comment("您的友链申请已被编辑。请确保所有信息正确无误。")
    return None  # 如果没有错误，返回 None