# -*- coding: utf-8 -*-
"""
AF Agent Utils Package
"""

from .deprecated import (
    deprecated,
    deprecated_class,
    deprecated_property
)

from ._common import (
    _route_similarity,
    format_table_datas
)

__all__ = [
    'deprecated',
    'deprecated_class', 
    'deprecated_property',
    '_route_similarity',
    'format_table_datas'
]