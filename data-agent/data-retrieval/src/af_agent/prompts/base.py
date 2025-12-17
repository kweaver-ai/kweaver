# -*- coding: utf-8 -*-
# @Author:  Xavier.chen@aishu.cn
# @Date: 2024-6-1
from abc import ABC, abstractmethod
from typing import Dict, List, Any

from jinja2 import environment, meta
from langchain.pydantic_v1 import BaseModel
from af_agent.logs.logger import logger


class BasePrompt(BaseModel, ABC):
    """BasePrompt base class for different prompts
    """
    language: str = "cn"
    templates: Dict[str, str] = {"cn": "", "en": ""}
    prompt_manager: Any = None

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
    def custom_template(self) -> str:
        """Add some custom fields for the prompt

        User self.{your attribute} to add custom fields
        the render method will use self.dict() to render the prompt

        Example:
            self.aa = "aaa"

        """
        if self.prompt_manager:
            template_str = self.prompt_manager.get_prompt(self.get_name(), self.language)
        
        if not self.prompt_manager or not template_str:
            template_str = self.get_prompt(self.language)

        return template_str
    
    @classmethod
    def get_name(cls) -> str:
        """Get the name of the prompt"""
        if  cls.__fields__.get("name"):
            return cls.__fields__.get("name").default
        else:
            return cls.__name__
    
    @classmethod
    def get_prompt(cls, language=""):
        """Get the prompt"""
        if not language:
            return cls.__fields__.get("templates").default
        
        if cls.__fields__.get("templates", {}):
            return cls.__fields__.get("templates").default.get(language, "")
        return ""
        

    def render(self, remove_lines=True, escape_braces=False) -> str:
        """Render the prompt with Jinja2 template engine
            remove_lines: if True, the prompt will be removed empty lines
            escape_braces: if True, the prompt will be escaped with {{ and }}, because langchain need f-string, and {} must be escaped to {{ and }}
        """

        # disable autoescape here in safety case
        env = environment.Environment(autoescape=False)
        template_str = self.custom_template()
        template = env.from_string(template_str)

        # find vars to render
        parsed = env.parse(template_str)
        var_keys = meta.find_undeclared_variables(parsed)

        vars_to_render = {}

        for key in var_keys:
            if key in self.__dict__:
                vars_to_render[key]= self.__dict__[key]
        
        rendered = template.render(
            vars_to_render,
        )

        if escape_braces:
            rendered = rendered.replace("{", "{{").replace("}", "}}")

        if remove_lines:
            rendered = self.remove_unnecessary_lines(rendered)

        logger.debug(f"Params in prompt: {vars_to_render}")
        # logger.debug(f"Prompt: {rendered}")
        return rendered

    @staticmethod
    def remove_unnecessary_lines(text: str) -> str:
        """Remove unnecessary empty lines from text.
        if there are multiple empty lines, only keep one.
        """
        lines = text.split("\n")
        last_line = lines[0]
        new_lines = [last_line]
        for line in lines[1:]:
            if last_line.strip() == "" and line.strip() == "":
                continue

            new_lines.append(line)
            last_line = line

        return "\n".join(new_lines)
