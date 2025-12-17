"""
DictPathParser 非扁平化版本单元测试
"""

import unittest
from dict_path_parser import (
    DictPathParser,
    DictPathParserFlat,
    get_dict_val_by_path,
    get_dic_val_by_path_flat,
    set_dict_val_by_path,
)


class TestDictPathParserNotFlat(unittest.TestCase):
    """非扁平化版本测试类"""

    def setUp(self):
        """测试数据准备"""
        self.test_data = {
            "companies": [
                {
                    "name": "公司A",
                    "departments": [
                        {
                            "name": "开发部",
                            "employees": [
                                {"name": "张三", "skills": ["Python", "Java"]},
                                {"name": "李四", "skills": ["JavaScript", "React"]},
                            ],
                        },
                        {
                            "name": "测试部",
                            "employees": [
                                {"name": "王五", "skills": ["Selenium", "pytest"]}
                            ],
                        },
                    ],
                },
                {
                    "name": "公司B",
                    "departments": [
                        {
                            "name": "运维部",
                            "employees": [
                                {"name": "赵六", "skills": ["Docker", "K8s"]},
                                {"name": "钱七", "skills": ["AWS", "Linux"]},
                            ],
                        }
                    ],
                },
            ]
        }
        self.parser = DictPathParser(self.test_data)

    def test_simple_path_get(self):
        """测试简单路径获取"""
        result = self.parser.get("companies[0].name")
        self.assertEqual(result, "公司A")

        result = self.parser.get("companies[1].name")
        self.assertEqual(result, "公司B")

    def test_array_traversal_preserves_structure(self):
        """测试数组遍历保持结构"""
        # 关键测试：companies[*].departments 应该保持结构
        result = self.parser.get("companies[*].departments")
        self.assertEqual(len(result), 2)  # 两个公司

        # 第一个公司有2个部门
        self.assertEqual(len(result[0]), 2)
        self.assertEqual(result[0][0]["name"], "开发部")
        self.assertEqual(result[0][1]["name"], "测试部")

        # 第二个公司有1个部门
        self.assertEqual(len(result[1]), 1)
        self.assertEqual(result[1][0]["name"], "运维部")

    def test_nested_array_traversal_structure(self):
        """测试嵌套数组遍历保持结构"""
        # companies[*].departments[*].employees 应该保持公司级别的结构
        result = self.parser.get("companies[*].departments[*].employees")
        self.assertEqual(len(result), 2)  # 两个公司

        # 公司A的部门员工：[[开发部员工], [测试部员工]]
        self.assertEqual(len(result[0]), 2)  # 公司A有2个部门
        self.assertEqual(len(result[0][0]), 2)  # 开发部2个员工
        self.assertEqual(result[0][0][0]["name"], "张三")
        self.assertEqual(result[0][0][1]["name"], "李四")
        self.assertEqual(len(result[0][1]), 1)  # 测试部1个员工
        self.assertEqual(result[0][1][0]["name"], "王五")

        # 公司B的部门员工：[[运维部员工]]
        self.assertEqual(len(result[1]), 1)  # 公司B有1个部门
        self.assertEqual(len(result[1][0]), 2)  # 运维部2个员工
        self.assertEqual(result[1][0][0]["name"], "赵六")
        self.assertEqual(result[1][0][1]["name"], "钱七")

    def test_final_flatten_with_get_flat(self):
        """测试最终扁平化"""
        # 使用 get_flat 方法获取扁平化结果
        result = self.parser.get_flat("companies[*].departments[*].employees[*].name")
        expected = ["张三", "李四", "王五", "赵六", "钱七"]
        self.assertEqual(result, expected)

    def test_skill_extraction_structure(self):
        """测试技能提取保持结构"""
        # 保持结构版本 - 按公司和部门分组
        result = self.parser.get("companies[*].departments[*].employees[*].skills")
        self.assertEqual(len(result), 2)  # 2个公司

        # 公司A的技能 [[开发部技能], [测试部技能]]
        self.assertEqual(len(result[0]), 2)  # 2个部门
        self.assertEqual(
            result[0][0], [["Python", "Java"], ["JavaScript", "React"]]
        )  # 开发部
        self.assertEqual(result[0][1], [["Selenium", "pytest"]])  # 测试部

        # 公司B的技能 [[运维部技能]]
        self.assertEqual(len(result[1]), 1)  # 1个部门
        self.assertEqual(result[1][0], [["Docker", "K8s"], ["AWS", "Linux"]])  # 运维部

        # 扁平化版本
        result_flat = self.parser.get_flat(
            "companies[*].departments[*].employees[*].skills"
        )
        expected_flat = [
            "Python",
            "Java",
            "JavaScript",
            "React",
            "Selenium",
            "pytest",
            "Docker",
            "K8s",
            "AWS",
            "Linux",
        ]
        self.assertEqual(result_flat, expected_flat)

    def test_department_names_structure(self):
        """测试部门名称提取结构"""
        # 按公司分组的部门名称（保持结构）
        result = self.parser.get("companies[*].departments[*].name")
        expected = [["开发部", "测试部"], ["运维部"]]  # 保持公司分组结构
        self.assertEqual(result, expected)

        # 扁平化版本
        result_flat = self.parser.get_flat("companies[*].departments[*].name")
        expected_flat = ["开发部", "测试部", "运维部"]  # 按部门顺序，不按公司分组
        self.assertEqual(result_flat, expected_flat)

    def test_comparison_with_old_behavior(self):
        """对比新旧行为"""
        simple_data = {"groups": [{"items": ["a", "b"]}, {"items": ["c", "d"]}]}

        parser = DictPathParser(simple_data)

        # 新行为：保持结构
        result_structured = parser.get("groups[*].items")
        self.assertEqual(result_structured, [["a", "b"], ["c", "d"]])

        # 旧行为：扁平化
        result_flat = parser.get_flat("groups[*].items")
        self.assertEqual(result_flat, ["a", "b", "c", "d"])

    def test_set_operations(self):
        """测试设置操作"""
        parser = DictPathParser({"test": [{"val": 1}, {"val": 2}]})

        # 批量设置
        parser.set("test[*].val", 999)
        result = parser.get("test[*].val")
        self.assertEqual(result, [999, 999])

    def test_has_method(self):
        """测试路径存在检查"""
        self.assertTrue(self.parser.has("companies[0].name"))
        self.assertTrue(self.parser.has("companies[*].departments[*].name"))
        self.assertFalse(self.parser.has("nonexistent.path"))

    def test_error_cases(self):
        """测试错误情况"""
        with self.assertRaises(ValueError):
            self.parser.get("companies.nonexistent[*].name")

        with self.assertRaises(IndexError):
            self.parser.get("companies[10].name")

    def test_empty_arrays(self):
        """测试空数组处理"""
        empty_data = {"groups": [{"items": []}, {"items": ["a", "b"]}]}

        parser = DictPathParser(empty_data)
        result = parser.get("groups[*].items")
        self.assertEqual(result, [[], ["a", "b"]])

        result_flat = parser.get_flat("groups[*].items")
        self.assertEqual(result_flat, ["a", "b"])


class TestDictPathParserFlat(unittest.TestCase):
    """扁平化版本解析器测试"""

    def setUp(self):
        self.test_data = {"groups": [{"items": ["a", "b"]}, {"items": ["c", "d"]}]}

    def test_flat_parser_behavior(self):
        """测试扁平化解析器行为"""
        parser = DictPathParserFlat(self.test_data)
        result = parser.get("groups[*].items")
        self.assertEqual(result, ["a", "b", "c", "d"])


class TestConvenienceFunctions(unittest.TestCase):
    """测试便捷函数"""

    def setUp(self):
        self.test_data = {
            "companies": [
                {"departments": [{"name": "A"}, {"name": "B"}]},
                {"departments": [{"name": "C"}]},
            ]
        }

    def test_get_by_path_preserve_structure(self):
        """测试保持结构的便捷函数"""
        result = get_dict_val_by_path(
            self.test_data, "companies[*].departments", preserve_structure=True
        )
        self.assertEqual(len(result), 2)
        self.assertEqual(len(result[0]), 2)
        self.assertEqual(len(result[1]), 1)

    def test_get_by_path_flat(self):
        """测试扁平化便捷函数"""
        result = get_dic_val_by_path_flat(
            self.test_data, "companies[*].departments[*].name"
        )
        self.assertEqual(result, ["A", "B", "C"])

        # 等价调用
        result2 = get_dict_val_by_path(
            self.test_data, "companies[*].departments[*].name", preserve_structure=False
        )
        self.assertEqual(result, result2)

    def test_set_by_path(self):
        """测试设置便捷函数"""
        result = set_dict_val_by_path(self.test_data, "new.path", "value")
        self.assertEqual(result["new"]["path"], "value")

        # 原数据不变
        self.assertNotIn("new", self.test_data)


class TestRealWorldScenarios(unittest.TestCase):
    """实际使用场景测试"""

    def test_config_parsing(self):
        """测试配置解析场景"""
        config = {
            "servers": [
                {
                    "name": "web-01",
                    "services": [
                        {"name": "nginx", "port": 80},
                        {"name": "app", "port": 8080},
                    ],
                },
                {"name": "web-02", "services": [{"name": "nginx", "port": 80}]},
            ]
        }

        parser = DictPathParser(config)

        # 获取每个服务器的服务（保持服务器分组）
        services_by_server = parser.get("servers[*].services")
        self.assertEqual(len(services_by_server), 2)
        self.assertEqual(len(services_by_server[0]), 2)  # web-01 有2个服务
        self.assertEqual(len(services_by_server[1]), 1)  # web-02 有1个服务

        # 获取所有服务名（扁平化）
        all_service_names = parser.get_flat("servers[*].services[*].name")
        self.assertEqual(all_service_names, ["nginx", "app", "nginx"])

        # 获取所有端口（保持结构）
        ports_by_service = parser.get("servers[*].services[*].port")
        self.assertEqual(ports_by_service, [[80, 8080], [80]])  # 按服务器分组

        # 获取所有端口（扁平化）
        all_ports = parser.get_flat("servers[*].services[*].port")
        self.assertEqual(all_ports, [80, 8080, 80])

    def test_data_analysis(self):
        """测试数据分析场景"""
        sales_data = {
            "regions": [
                {
                    "name": "华东",
                    "stores": [
                        {"city": "上海", "revenue": 1000, "products": ["A", "B"]},
                        {"city": "杭州", "revenue": 800, "products": ["B", "C"]},
                    ],
                },
                {
                    "name": "华南",
                    "stores": [
                        {"city": "深圳", "revenue": 1200, "products": ["A", "C", "D"]}
                    ],
                },
            ]
        }

        parser = DictPathParser(sales_data)

        # 按区域分组的门店数据
        stores_by_region = parser.get("regions[*].stores")
        self.assertEqual(len(stores_by_region), 2)

        # 所有门店收入（扁平化）
        all_revenues = parser.get_flat("regions[*].stores[*].revenue")
        self.assertEqual(all_revenues, [1000, 800, 1200])

        # 所有产品（扁平化）
        all_products = parser.get_flat("regions[*].stores[*].products")
        self.assertEqual(all_products, ["A", "B", "B", "C", "A", "C", "D"])


if __name__ == "__main__":
    # 运行所有测试
    unittest.main(verbosity=2)
