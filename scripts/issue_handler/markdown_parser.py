import re
from typing import Optional, Type

from pydantic import BaseModel, ValidationError


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

    title_to_field = {}
    for field, titles in schema_mapping.items():
        for title in titles:
            title_to_field[title.lower()] = field

    blocks = re.findall(
        r"(?:^|\n)#{1,3}\s*(.*?)\s*(?:\n+)([\s\S]*?)(?=\n#{1,3}|$)", markdown_text
    )

    if not blocks:
        blocks = re.findall(
            r"#{1,3}\s*(.*?)\s*\n+([\s\S]*?)(?=\n#{1,3}|$)", markdown_text
        )

    for title, content in blocks:
        normalized_title = title.strip().lower()
        field_name = title_to_field.get(normalized_title)

        if field_name:
            cleaned_content = content.strip()
            extracted_data[field_name] = cleaned_content
        else:
            errors.append(f"未知字段: {title}")
    for field in schema_mapping.keys():
        if field not in extracted_data:
            all_titles = ", ".join(schema_mapping[field])
            errors.append(f"缺少必填字段: {field} (可能的标题: {all_titles})")
    if (
        model_class is not None
        and not errors
        and isinstance(model_class, type)
        and issubclass(model_class, BaseModel)
        and model_class is not BaseModel
    ):
        try:
            validated_data = model_class(**extracted_data)
            return validated_data, errors
        except ValidationError as e:
            for error in e.errors():
                errors.append(f"{error['loc'][0]}: {error['msg']}")
            return None, errors

    return None, errors
