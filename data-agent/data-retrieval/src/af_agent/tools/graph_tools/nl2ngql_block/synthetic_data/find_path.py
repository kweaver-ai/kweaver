# 111定义函数提取所有唯一节点

search_path_func = {
    "v1": "find_unique_nodes",
    "v1->v2": "find_simple_edges",

    "v1->v2->v3": "find_two_hop_paths",
    "v1, v1->v2->v3": "find_two_hop_paths",

    "v1->v2->v3->v4": "find_three_hop_paths",

    "v1->v2<-v3": "find_converging_paths",
    "v1<-v2->v3": "find_diverging_paths",
    "v1->v2, v3->v2": "find_converging_paths",
}

search_path_template = {
    "v1": "(v1:{label_1})",
    "v1->v2": "(v1:{label_1})-[e1:{rel_1}]->(v2:{label_2})",
    "v3->v4": "(v3:{label_3})-[e2:{rel_2}]->(v4:{label_4})",
    "v1->v2->v3": "(v1:{label_1})-[e1:{rel_1}]->(v2:{label_2})-[e2:{rel_2}]->(v3:{label_3})",
    "v1->v2->v3->v4": "(v1:{label_1})-[e1:{rel_1}]->(v2:{label_2})-[e2:{rel_2}]->(v3:{label_3})-[e3:{rel_3}]->(v4:{label_4})",
    "v1->v2<-v3": "(v1:{label_1})-[e1:{rel_1}]->(v2:{label_2})<-[e2:{rel_2}]-(v3:{label_3})",
    "v1<-v2->v3": "(v1:{label_1})<-[e1:{rel_1}]-(v2:{label_2})-[e2:{rel_2}]->(v3:{label_3})",
}


def find_unique_nodes(edges):
    """查找所有独立节点 (v1)"""
    nodes = set()  # 使用集合去重
    paths = []
    for edge in edges:
        if edge['subject'] not in nodes:
            nodes.add(edge['subject'])# 添加起点
            paths.append({
                'v1': edge['subject'],
            })

        if edge['object'] not in nodes:
            nodes.add(edge['object'])  # 添加终点
            paths.append({
                'v1': edge['object'],
            })
    return paths


# # 查找所有唯一节点
# unique_nodes = find_unique_nodes(edges)
#
# # 输出结果
# for node in unique_nodes:
#     print(f"(v1: {node})")


# 222定义函数查找所有简单路径
def find_simple_edges(edges):
    """查找所有简单路径 (v1)-[e1]->(v2)"""
    paths = []
    for edge in edges:
        paths.append({
            'v1': edge['subject'],
            'e1': edge['name'],
            'v2': edge['object']
        })
    return paths


# # 查找所有简单路径
# paths = find_simple_edges(edges)
#
# # 输出结果
# for path in paths:
#     print(f"(v1: {path['v1']})-[e1: {path['e1']}]->(v2: {path['v2']})")


# 333定义函数查找符合条件的路径
def find_two_hop_paths(edges):
    """查找两跳路径 (v1)-[e1]->(v2)-[e2]->(v3)"""
    paths = []
    for e1 in edges:
        v1, v2 = e1['subject'], e1['object']
        for e2 in edges:
            if e2['subject'] == v2:  # e2 的起点要是 e1 的终点
                v3 = e2['object']
                if v3 == v2: continue # 去掉嵌套的关系，后面自己拼接
                if v3 == v1: continue # 去掉嵌套的关系，后面自己拼接
                if e1['name'] == e2['name']: # TODO 去重嵌套关系
                    continue

                paths.append({
                    'v1': v1,
                    'e1': e1['name'],
                    'v2': v2,
                    'e2': e2['name'],
                    'v3': v3
                })
    return paths


# # 查找所有路径
# paths = find_two_hop_paths(edges)
#
# # 输出结果
# for path in paths:
#     print(f"(v1: {path['v1']})-[e1: {path['e1']}]->(v2: {path['v2']})-[e2: {path['e2']}]->(v3: {path['v3']})")


# 444定义函数查找符合条件的路径
def find_three_hop_paths(edges):
    """查找三跳路径 (v1)-[e1]->(v2)-[e2]->(v3)-[e3]->(v4)"""
    paths = []
    for e1 in edges:
        v1, v2 = e1['subject'], e1['object']
        if v1 == v2: continue
        for e2 in edges:
            if e2['subject'] == v2:  # e2 的起点要是 e1 的终点
                v3 = e2['object']
                if v3 == v2: continue # 去掉嵌套的关系，后面自己拼接
                if v3 == v1: continue # 去掉嵌套的关系，后面自己拼接
                for e3 in edges:
                    if e3['subject'] == v3:  # e3 的起点要是 e2 的终点
                        v4 = e3['object']
                        if v4 == v3: continue # 去掉嵌套的关系，后面自己拼接
                        if v4 == v2: continue # 去掉嵌套的关系，后面自己拼接
                        if v4 == v1: continue # 去掉嵌套的关系，后面自己拼接
                        if e1['name'] == e2['name'] or e1['name'] == e3['name'] or e3['name'] == e2['name']: continue
                        paths.append({
                            'v1': v1,
                            'e1': e1['name'],
                            'v2': v2,
                            'e2': e2['name'],
                            'v3': v3,
                            'e3': e3['name'],
                            'v4': v4
                        })
    return paths


# # 查找所有路径
# paths = find_three_hop_paths(edges)
#
# # 输出结果
# for path in paths:
#     print(
#         f"(v1: {path['v1']})-[e1: {path['e1']}]->(v2: {path['v2']})-[e2: {path['e2']}]->(v3: {path['v3']})-[e3: {path['e3']}]->(v4: {path['v4']})")


# 555定义函数查找符合条件的路径
def find_converging_paths(edges):
    """查找收敛路径 (v1)-[e1]->(v2)<-[e2]-(v3)"""
    paths = []
    for e1 in edges:
        v1, v2_from_e1 = e1['subject'], e1['object']  # e1 的起点和终点
        if v1 == v2_from_e1: continue # 去掉嵌套的关系，后面自己拼接
        for e2 in edges:
            v3, v2_from_e2 = e2['subject'], e2['object']  # e2 的起点和终点
            if v3 == v2_from_e1: continue # 去掉嵌套的关系，后面自己拼接
            if v3 == v1: continue  # 去掉嵌套的关系，后面自己拼接
            # 条件：两条边指向同一个 v2，且 v1 != v3，e1 != e2
            if v2_from_e1 == v2_from_e2 and v1 != v3 and e1['name'] != e2['name']:
                paths.append({
                    'v1': v1,
                    'e1': e1['name'],
                    'v2': v2_from_e1,
                    'e2': e2['name'],
                    'v3': v3
                })
    return paths

def find_diverging_paths(edges):
    """查找路径 (v1)<-[e1]-(v2)-[e2]->(v3)"""
    paths = []
    for e1 in edges:
        v1, v2_from_e1 = e1['object'], e1['subject']  # e1 的终点是 v1，起点是 v2
        if v1 == v2_from_e1: continue  # 去掉嵌套的关系，后面自己拼接
        for e2 in edges:
            v2_from_e2, v3 = e2['subject'], e2['object']  # e2 的起点是 v2，终点是 v3
            if v3 == v2_from_e1: continue  # 去掉嵌套的关系，后面自己拼接
            if v3 == v1: continue  # 去掉嵌套的关系，后面自己拼接
            # 条件：两条边的起点相同为 v2，且 v1 != v3，e1 != e2
            if v2_from_e1 == v2_from_e2 and v1 != v3 and e1['name'] != e2['name']:
                paths.append({
                    'v1': v1,
                    'e1': e1['name'],
                    'v2': v2_from_e1,
                    'e2': e2['name'],
                    'v3': v3
                })
    return paths

# # 查找所有路径
# paths = find_converging_paths(edges)
#
# # 输出结果
# for path in paths:
#     print(f"(v1: {path['v1']})-[e1: {path['e1']}]->(v2: {path['v2']})<-[e2: {path['e2']}]->(v3: {path['v3']})")



"""
我有一些图的关系数据，如：
'edge': [
        {'alias': '对应的地址', 'description': '', 'name': 'customer_address_2_address', 'object': 'address','subject': 'customer_address'},
        {'alias': '消费者居住状态', 'description': '', 'name': 'customer_2_customer_address', 'object': 'customer_address', 'subject': 'customer'},
        {'alias': '下单', 'description': '', 'name': 'customer_2_cust_order', 'object': 'cust_order', 'subject': 'customer'},
        {'alias': '订单状态', 'description': '', 'name': 'cust_order_2_order_history', 'object': 'order_history', 'subject': 'cust_order'},
        {'alias': '状态为', 'description': '', 'name': 'order_history_2_order_status', 'object': 'order_status', 'subject': 'order_history'},
        {'alias': '购买', 'description': '', 'name': 'order_line_2_book', 'object': 'book', 'subject': 'order_line'},
        {'alias': '包含', 'description': '', 'name': 'cust_order_2_order_line', 'object': 'order_line', 'subject': 'cust_order'},
        {'alias': '运送方式', 'description': '', 'name': 'cust_order_2_shipping_method', 'object': 'shipping_method', 'subject': 'cust_order'},
        {'alias': '邮递地址', 'description': '', 'name': 'cust_order_2_address', 'object': 'address', 'subject': 'cust_order'},
        {'alias': '语言', 'description': '', 'name': 'book_2_book_language', 'object': 'book_language', 'subject': 'book'},
        {'alias': '出版', 'description': '', 'name': 'publisher_2_book', 'object': 'book', 'subject': 'publisher'},
        {'alias': '创作', 'description': '', 'name': 'author_2_book', 'object': 'book', 'subject': 'author'},
        {'alias': '属于', 'description': '', 'name': 'address_2_country', 'object': 'country', 'subject': 'address'}
    ]
    
subject 和 object是节点标签，用v表示。关系边，用e表示。
我想找到(v1)-[e1]->(v2)-[e2]->(v3)这种路径的所有组合，请问怎么写代码。
如下满足要求。
v1: customer_address
e1: customer_address_2_address
v2: address
e2: address_2_country
v3:country
"""