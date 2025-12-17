# Dict Path Parser

一个强大的Python字典和列表路径解析工具，支持复杂的嵌套数据结构操作。

## 特性

- 🎯 **灵活的路径语法**：支持点号访问、数组索引、通配符等
- 🏗️ **结构保持**：可选择保持原始数据结构或扁平化结果
- 🔧 **完整操作**：支持获取、设置、删除、检查路径存在性
- 🚀 **高性能**：针对大型嵌套数据结构优化
- 🧪 **全面测试**：包含17个测试用例，覆盖各种使用场景

## 安装

```python
from app.utils.dict_util import DictPathParser, get_dict_val_by_path
```

## 快速开始

### 基础用法

```python
from app.utils.dict_util import DictPathParser, get_dict_val_by_path

# 测试数据
data = {
    'companies': [
        {
            'name': '公司A',
            'departments': [
                {'name': '开发部', 'employees': 10},
                {'name': '测试部', 'employees': 5}
            ]
        },
        {
            'name': '公司B',
            'departments': [
                {'name': '运维部', 'employees': 3}
            ]
        }
    ]
}

# 创建解析器
parser = DictPathParser(data)

# 获取简单路径
company_name = parser.get('companies[0].name')  # '公司A'

# 获取通配符路径（保持结构）
dept_by_company = parser.get('companies[*].departments[*].name')
# 结果: [['开发部', '测试部'], ['运维部']]

# 获取通配符路径（扁平化）
all_depts = parser.get_flat('companies[*].departments[*].name')
# 结果: ['开发部', '测试部', '运维部']
```

### 便捷函数

```python
# 直接使用函数，无需创建解析器实例
result = get_by_path(data, 'companies[*].name', preserve_structure=True)
# 结果: ['公司A', '公司B']

result = get_by_path(data, 'companies[*].name', preserve_structure=False)  
# 结果: ['公司A', '公司B']  # 这个例子中结果相同
```

## 路径语法

### 支持的路径格式

| 语法 | 说明 | 示例 |
|------|------|------|
| `key` | 字典键访问 | `'name'` |
| `key.subkey` | 嵌套字典访问 | `'user.profile.name'` |
| `array[0]` | 数组索引访问 | `'users[0].name'` |
| `array[*]` | 数组通配符遍历 | `'users[*].name'` |
| `key[*].subkey[*]` | 多层通配符 | `'companies[*].depts[*].name'` |

### 路径示例

```python
data = {
    'users': [
        {
            'name': 'Alice',
            'orders': [
                {'id': 1, 'items': ['A', 'B']},
                {'id': 2, 'items': ['C']}
            ]
        },
        {
            'name': 'Bob', 
            'orders': [
                {'id': 3, 'items': ['D', 'E']}
            ]
        }
    ]
}

parser = DictPathParser(data)

# 各种路径示例
parser.get('users[0].name')                    # 'Alice'
parser.get('users[*].name')                    # ['Alice', 'Bob']  
parser.get('users[*].orders[*].id')            # [[1, 2], [3]]  (保持结构)
parser.get_flat('users[*].orders[*].id')       # [1, 2, 3]      (扁平化)
parser.get_flat('users[*].orders[*].items')    # ['A', 'B', 'C', 'D', 'E']
```

## API 参考

### DictPathParser 类

#### 构造函数
```python
DictPathParser(data: Union[dict, list] = None)
```

#### 主要方法

##### get(path: str, flatten_final: bool = False) -> Any
获取指定路径的数据

```python
parser.get('companies[*].name')                    # 保持结构
parser.get('companies[*].name', flatten_final=True) # 扁平化
```

##### get_flat(path: str) -> Any
获取扁平化结果（等价于 `get(path, flatten_final=True)`）

```python
parser.get_flat('companies[*].departments[*].name')
```

##### set(path: str, value: Any) -> None
设置指定路径的值

```python
parser.set('companies[*].status', 'active')  # 批量设置
parser.set('companies[0].name', '新公司名')   # 单个设置
```

##### has(path: str) -> bool
检查路径是否存在

```python
if parser.has('companies[0].departments'):
    print("路径存在")
```

##### delete(path: str) -> bool
删除指定路径的数据

```python
success = parser.delete('companies[0].old_field')
```

### 便捷函数

##### get_by_path(data, path, preserve_structure=True)
直接从数据获取路径值

```python
result = get_by_path(data, 'companies[*].name')
```

##### get_by_path_flat(data, path)
直接获取扁平化结果

```python
result = get_by_path_flat(data, 'companies[*].departments[*].name')
```

##### set_by_path(data, path, value)
在数据副本中设置路径值

```python
new_data = set_by_path(data, 'new.field', 'value')
```

## 结构保持 vs 扁平化

这是本工具的核心特性之一。理解两种模式的区别很重要：

### 保持结构模式 (默认)
```python
data = {
    'groups': [
        {'items': ['a', 'b']}, 
        {'items': ['c', 'd']}
    ]
}

parser = DictPathParser(data)
result = parser.get('groups[*].items')
# 结果: [['a', 'b'], ['c', 'd']]  # 保持分组结构
```

### 扁平化模式
```python
result = parser.get_flat('groups[*].items') 
# 结果: ['a', 'b', 'c', 'd']  # 完全扁平化
```

### 实际应用场景

**配置管理场景**：
```python
config = {
    'servers': [
        {
            'name': 'web-01',
            'services': [
                {'name': 'nginx', 'port': 80},
                {'name': 'app', 'port': 8080}
            ]
        },
        {
            'name': 'web-02', 
            'services': [
                {'name': 'nginx', 'port': 80}
            ]
        }
    ]
}

parser = DictPathParser(config)

# 按服务器分组的服务（保持结构） - 用于配置验证
services_by_server = parser.get('servers[*].services')
# 结果: [
#   [{'name': 'nginx', 'port': 80}, {'name': 'app', 'port': 8080}],
#   [{'name': 'nginx', 'port': 80}]
# ]

# 所有服务端口（扁平化） - 用于端口冲突检查
all_ports = parser.get_flat('servers[*].services[*].port')  
# 结果: [80, 8080, 80]
```

## 错误处理

```python
try:
    result = parser.get('nonexistent.path')
except KeyError as e:
    print(f"键不存在: {e}")

try:
    result = parser.get('array[100]')  
except IndexError as e:
    print(f"索引超出范围: {e}")

try:
    result = parser.get('string.property')  # 对字符串使用点号访问
except ValueError as e:
    print(f"类型错误: {e}")
```

## 高级用法

### 复杂数据分析
```python
sales_data = {
    'regions': [
        {
            'name': '华东',
            'stores': [
                {'city': '上海', 'revenue': 1000, 'products': ['A', 'B']},
                {'city': '杭州', 'revenue': 800, 'products': ['B', 'C']}
            ]
        },
        {
            'name': '华南',
            'stores': [
                {'city': '深圳', 'revenue': 1200, 'products': ['A', 'C', 'D']}  
            ]
        }
    ]
}

parser = DictPathParser(sales_data)

# 按区域分组的门店收入
revenue_by_region = parser.get('regions[*].stores[*].revenue')
# 结果: [[1000, 800], [1200]]

# 总收入分析
total_revenues = parser.get_flat('regions[*].stores[*].revenue') 
# 结果: [1000, 800, 1200]
# 可以直接用于: sum(total_revenues), max(total_revenues) 等

# 产品销售分析
all_products = parser.get_flat('regions[*].stores[*].products')
# 结果: ['A', 'B', 'B', 'C', 'A', 'C', 'D']
# 可以用于: Counter(all_products) 统计销量
```

### 批量操作
```python
# 批量设置状态
parser.set('companies[*].status', 'verified')

# 批量更新配置
parser.set('servers[*].services[*].monitoring', True)

# 检查所有路径是否存在
paths_to_check = [
    'companies[0].name',
    'companies[1].departments', 
    'companies[*].status'
]

for path in paths_to_check:
    exists = parser.has(path)
    print(f"{path}: {'存在' if exists else '不存在'}")
```

## 性能提示

1. **重复操作**：如果需要对同一数据执行多次操作，创建解析器实例比每次使用便捷函数更高效
2. **大数据集**：对于大型数据集，考虑是否真的需要保持结构，扁平化模式通常更高效
3. **路径缓存**：解析器内部会缓存解析结果，重复相同路径的操作会更快

## 测试

运行测试套件：

```bash
cd /path/to/dict_util
python test_dict_path_parser.py
```

测试包含17个测试用例，覆盖：
- 基础路径操作
- 通配符遍历
- 结构保持vs扁平化
- 错误处理
- 实际应用场景
- 边界情况处理

## 许可证

本工具是项目内部工具，遵循项目许可证。

## 贡献

欢迎提交Issue和Pull Request来改进这个工具。