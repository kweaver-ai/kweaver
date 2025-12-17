from enum import Enum

from af_agent.logs.logger import logger


class ModelType4Prompt(Enum):
    """
    Model type for prompt
    We need to customize the prompt for different models in some cases.
    """
    GPT4O = "gpt-4o"
    LANGCHAIN = "langchain"
    DEEPSEEK_R1= "deepseek-r1"
    DEFAULT = "default"

    @classmethod
    def values(cls):
        return [mt.value for mt in cls]
    
    @classmethod
    def keys(cls):
        return [mt.name for mt in cls]


def get_standard_model_type(model_type: str):
    """ Get standard model type
    """
    if isinstance(model_type, ModelType4Prompt):
        return model_type.value

    if not model_type:
        model_type = ModelType4Prompt.DEFAULT.value
    else:
        model_type = model_type.lower()

    if model_type not in ModelType4Prompt.values():
        logger.warning(f"model_type: {model_type} not found, use default model_type: {ModelType4Prompt.DEFAULT.value}")
        logger.info(f"supported model_type: {ModelType4Prompt.values()}")
        model_type = ModelType4Prompt.DEFAULT.value
    else:
        logger.info(f"model_type: {model_type}")

    return model_type
