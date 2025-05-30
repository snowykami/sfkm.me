import re

from pydantic import BaseModel, ValidationError


from typing import Optional, Type

def parse_markdown_to_structured_data[T: BaseModel](
    markdown_text: str,
    schema_mapping: dict[str, list[str]],
    model_class: Optional[Type[T]] = None,
) -> tuple[T | None, list[str]]:
    """
    从 Markdown 文本中解析结构化数据，支持任意 schema

    Args:
        markdown_text (str): Markdown 文本
        schema_mapping (Dict[str, List[str]]): 字段映射，格式为 {字段名: [可能的标题列表]}
        model_class (Optional[type(BaseModel)]): 可选的 Pydantic 模型类用于验证数据

    Returns:
        Tuple[Optional[Dict[str, Any]], List[str]]: 返回 (解析后的数据字典, 错误列表)
    """
    errors = []
    extracted_data = {}

    # 反转 schema_mapping，使得任何标题都能映射到正确的字段名
    title_to_field = {}
    for field, titles in schema_mapping.items():
        for title in titles:
            title_to_field[title.lower()] = field

    # 使用正则表达式查找所有标题和内容块
    # 支持 ### 标题、## 标题、# 标题 格式
    blocks = re.findall(
        r"(?:^|\n)#{1,3}\s*(.*?)\s*(?:\n+)([\s\S]*?)(?=\n#{1,3}|$)", markdown_text
    )

    # 检查是否找到任何块
    if not blocks:
        # 尝试使用更宽松的模式，忽略换行要求
        blocks = re.findall(
            r"#{1,3}\s*(.*?)\s*\n+([\s\S]*?)(?=\n#{1,3}|$)", markdown_text
        )

    # 处理找到的每个块
    for title, content in blocks:
        # 标准化标题（去除空格、转为小写）
        normalized_title = title.strip().lower()

        # 查找对应的字段名
        field_name = title_to_field.get(normalized_title)

        if field_name:
            # 清理内容（去除前后空白）
            cleaned_content = content.strip()
            extracted_data[field_name] = cleaned_content
        else:
            # 未找到对应的字段名，记录错误
            errors.append(f"未知字段: {title}")

    # 检查必填字段
    for field in schema_mapping.keys():
        if field not in extracted_data:
            all_titles = ", ".join(schema_mapping[field])
            errors.append(f"缺少必填字段: {field} (可能的标题: {all_titles})")

    # 如果提供了模型类，使用它验证数据
    if (
        model_class is not None
        and not errors
        and isinstance(model_class, type)
        and issubclass(model_class, BaseModel)
        and model_class is not BaseModel
    ):
        try:
            validated_data = model_class(**extracted_data)
            # 返回模型实例
            return validated_data, errors
        except ValidationError as e:
            for error in e.errors():
                errors.append(f"{error['loc'][0]}: {error['msg']}")
            return None, errors

    # 如果没有提供模型类或验证失败，直接返回 None 作为第一个元素
    return None, errors
