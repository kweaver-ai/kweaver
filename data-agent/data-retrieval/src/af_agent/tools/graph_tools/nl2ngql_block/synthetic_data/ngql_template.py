

generic_template_strict = {
        "match return": {
            # 返回属性值
            "match {path1} return {node1}.p": {
                "path1": ["v1->v2->v3->v4", "v1->v2->v3", "v1->v2<-v3", "v1->v2", "v1"],
                "node1": ["v1"],
            },
            # 返回计数
            "match {path1} return count(distinct {node1})": {
                "path1": ["v1->v2->v3->v4", "v1->v2->v3", "v1->v2<-v3", "v1->v2", "v1"],
                "node1": ["v1"],
            },
            # 返回聚合
            "match {path1} return {{aggregate}}({node1}.p_int)": {
                "path1": ["v1->v2->v3->v4", "v1->v2->v3", "v1->v2<-v3", "v1->v2", "v1"],
                "node1": ["v1"],
                # "aggregate": ["avg", "sum", "max", "min"],
            },
        },
        "match with return": {
                # 按数值排序，返回属性值
                "match {path1} with {node1}, {node2}.p_int as m1 order by m1 {{desc_asc}} LIMIT {{limit}} return {node1}.p": {
                    "path1": ["v1->v2->v3->v4", "v1->v2->v3", "v1->v2<-v3", "v1->v2", "v1"],
                    "node1": ["v1", "v2"],
                    "node2": ["v1", "v2"],
                    # "order_by": ["as m1 order by m1 desc LIMIT 1", "as m1 order by m1 asc LIMIT 1"]
                },
                # 按日期排序，返回属性值
                "match {path1} with {node1}, {node2}.p_date as m1 order by m1 {{desc_asc}} LIMIT {{limit}} return {node1}.p": {
                    "path1": ["v1->v2->v3->v4", "v1->v2->v3", "v1->v2<-v3", "v1->v2", "v1"],
                    "node1": ["v1", "v2"],
                    "node2": ["v1", "v2"],
                    # "order_by": ["as m1 order by m1 desc LIMIT 1", "as m1 order by m1 asc LIMIT 1"]
                },
                # 按日期年份排序，返回属性值
                "match {path1} with {node1}.P_date.year as m1, count({node1}.P_date.year) as m2 order by m2 {{desc_asc}} LIMIT {{limit}} return m1, m2": {
                    "path1": ["v1->v2->v3->v4", "v1->v2->v3", "v1->v2<-v3", "v1->v2", "v1"],
                    "node1": ["v1"],
                    # "order_by": ["as m1 order by m1 desc LIMIT 1", "as m1 order by m1 asc LIMIT 1"]
                },
                # 按计数排序，返回属性值
                "match {path1} with {node1}, count({node2}) as m1 order by m1 {{desc_asc}} LIMIT {{limit}} return {node1}.p": {
                    "path1": ["v1->v2->v3->v4", "v1->v2->v3", "v1->v2<-v3", "v1->v2", "v1"],
                    "node1": ["v1", "v2"],
                    "node2": ["v1", "v2"],
                    # "order_by": ["as m1 order by m1 desc LIMIT 1", "as m1 order by m1 asc LIMIT 1"]
                },
# MATCH (v1:cust_order) WITH v1.cust_order.order_date.year AS order_date,COUNT(v1.cust_order.order_date.year) AS count_order_date ORDER BY count_order_date DESC LIMIT 1 RETURN order_date, count_order_date
            },
        "match where return": {
            # 一个条件，返回属性值
            "match {path1} where {node1}.pov return {node1}.p": {
                "path1": ["v1->v2->v3->v4", "v1->v2->v3", "v1->v2<-v3", "v1->v2", "v1"],
                "node1": ["v1"],
            },
            # 一个条件，返回属性值
            "match {path1} where {node1}.pov return {node2}.p": {
                "path1": ["v1->v2->v3->v4", "v1->v2->v3", "v1->v2<-v3", "v1->v2", "v1"],
                "node1": ["v1", "v2"],
                "node2": ["v1", "v2"],
            },
            # 一个条件，返回计数
            "match {path1} where {node1}.pov return count(distinct {node2})": {
                "path1": ["v1->v2->v3->v4", "v1->v2->v3", "v1->v2<-v3", "v1->v2", "v1"],
                "node1": ["v1", "v2"],
                "node2": ["v1", "v2"],
            },
            # 一个条件，返回聚合
            "match {path1} where {node1}.pov return {{aggregate}}({node2}.p_int)": {
                "path1": ["v1->v2->v3->v4", "v1->v2->v3", "v1->v2<-v3", "v1->v2", "v1"],
                "node1": ["v1", "v2"],
                "node2": ["v1", "v2"],
                # "aggregate": ["avg", "sum", "max", "min"],
            },
            # 一个年份条件，返回属性值
            "match {path1} where {node1}.p_date.year == 2020 return {node2}.p": {
                "path1": ["v1->v2->v3->v4", "v1->v2->v3", "v1->v2<-v3", "v1->v2", "v1"],
                "node1": ["v1", "v2"],
                "node2": ["v1", "v2"],
            },
            # 一个年份条件，返回计数
            "match {path1} where {node1}.p_date.year == 2020 return count(distinct {node2})": {
                "path1": ["v1->v2->v3->v4", "v1->v2->v3", "v1->v2<-v3", "v1->v2", "v1"],
                "node1": ["v1", "v2"],
                "node2": ["v1", "v2"],
            },
            # 一个年份条件，返回聚合
            "match {path1} where {node1}.p_date.year == 2020 return {{aggregate}}({node2}.p_int)": {
                "path1": ["v1->v2->v3->v4", "v1->v2->v3", "v1->v2<-v3", "v1->v2", "v1"],
                "node1": ["v1", "v2"],
                "node2": ["v1", "v2"],
                # "aggregate": ["avg", "sum", "max", "min"],
            },
            # 两个条件，返回属性值
            "match {path1} where {node1}.pov {{connector}} {node2}.pov return {node3}.p": {
                "path1": ["v1->v2->v3->v4", "v1->v2->v3", "v1->v2<-v3", "v1->v2", "v1"],
                "node1": ["v1", "v2", "v3"],
                "node2+": ["v1", "v2", "v3"],
                "node3": ["v1", "v2", "v3"]
            },
            # 两个条件，返回计数
            "match {path1} where {node1}.pov {{connector}} {node2}.pov return count(distinct {node3})": {
                "path1": ["v1->v2->v3->v4", "v1->v2->v3", "v1->v2<-v3", "v1->v2", "v1"],
                "node1": ["v1", "v2", "v3"],
                "node2": ["v1", "v2", "v3"],
                "node3": ["v1", "v2", "v3"]
            },
            # 两个条件，返回聚合
            "match {path1} where {node1}.pov {{connector}} {node2}.pov return {{aggregate}}({node3}.p_int)": {
                "path1": ["v1->v2->v3->v4", "v1->v2->v3", "v1->v2<-v3", "v1->v2", "v1"],
                "node1": ["v1", "v2", "v3"],
                "node2": ["v1", "v2", "v3"],
                "node3": ["v1", "v2", "v3"],
                # "aggregate": ["avg", "sum", "max", "min"],
            },
            # 两个条件(带年份)，返回属性值
            "match {path1} where {node1}.p_date.year == 2020 {{connector}} {node2}.pov return {node3}.p": {
                "path1": ["v1->v2->v3->v4", "v1->v2->v3", "v1->v2<-v3", "v1->v2", "v1"],
                "node1": ["v1", "v2", "v3"],
                "node2": ["v1", "v2", "v3"],
                "node3": ["v1", "v2", "v3"]
            },
            # 两个条件(带年份)，返回计数
            "match {path1} where {node1}.p_date.year == 2020 {{connector}} {node2}.pov return count(distinct {node3})": {
                "path1": ["v1->v2->v3->v4", "v1->v2->v3", "v1->v2<-v3", "v1->v2", "v1"],
                "node1": ["v1", "v2", "v3"],
                "node2": ["v1", "v2", "v3"],
                "node3": ["v1", "v2", "v3"]
            },
            # 两个条件(带年份)，返回聚合
            "match {path1} where {node1}.p_date.year == 2020 {{connector}} {node2}.pov return {{aggregate}}({node3}.p_int)": {
                "path1": ["v1->v2->v3->v4", "v1->v2->v3", "v1->v2<-v3", "v1->v2", "v1"],
                "node1": ["v1", "v2", "v3"],
                "node2": ["v1", "v2", "v3"],
                "node3": ["v1", "v2", "v3"],
                # "aggregate": ["avg", "sum", "max", "min"],
            },
        },
        "match where with return": {
            # 一个条件，按数值排序，返回属性值
            "match {path1} where {node1}.pov with {node2}, {node3}.p_int as m1 order by m1 {{desc_asc}} LIMIT {{limit}} return {node2}.p": {
                "path1": ["v1->v2->v3->v4", "v1->v2->v3", "v1->v2<-v3", "v1->v2", "v1"],
                "node1": ["v1", "v2", "v3"],
                "node2": ["v1", "v2", "v3"],
                "node3": ["v1", "v2", "v3"],
                # "order_by": ["as m1 order by m1 desc LIMIT 1", "as m1 order by m1 asc LIMIT 1"],
            },
            # 一个条件，按日期排序，返回属性值
            "match {path1} where {node1}.pov with {node2}, {node3}.p_date as m1 order by m1 {{desc_asc}} LIMIT {{limit}} return {node2}.p": {
                "path1": ["v1->v2->v3->v4", "v1->v2->v3", "v1->v2<-v3", "v1->v2", "v1"],
                "node1": ["v1", "v2", "v3"],
                "node2": ["v1", "v2", "v3"],
                "node3": ["v1", "v2", "v3"],
                # "order_by": ["as m1 order by m1 desc LIMIT 1", "as m1 order by m1 asc LIMIT 1"],
            },
            # 一个条件，按数值排序，返回计数，TODO 都排序了，count没有必要
            # "match {path1} where {node1}.pov with {node2}, {node3}.p_int {order_by} return count({node2})": {
            #     "path1": ["v1->v2->v3->v4", "v1->v2->v3", "v1->v2<-v3", "v1->v2", "v1"],
            #     "node1": ["v1", "v2", "v3"],
            #     "node2": ["v1", "v2", "v3"],
            #     "node3": ["v1", "v2", "v3"],
            #     "order_by": ["as m1 order by m1 desc LIMIT 1", "as m1 order by m1 asc LIMIT 1"],
            # },
            # 一个条件，按日期排序，返回计数
            # "match {path1} where {node1}.pov with {node2}, {node3}.p_date {order_by} return count({node2})": {
            #     "path1": ["v1->v2->v3->v4", "v1->v2->v3", "v1->v2<-v3", "v1->v2", "v1"],
            #     "node1": ["v1", "v2", "v3"],
            #     "node2": ["v1", "v2", "v3"],
            #     "node3": ["v1", "v2", "v3"],
            #     "order_by": ["as m1 order by m1 desc LIMIT 1", "as m1 order by m1 asc LIMIT 1"],
            # },
            # 一个条件，按计数排序，返回属性值
            "match {path1} where {node1}.pov with {node2}, count({node3}) as m1 order by m1 {{desc_asc}} LIMIT {{limit}} return {node2}.p": {
                "path1": ["v1->v2->v3->v4", "v1->v2->v3", "v1->v2<-v3", "v1->v2", "v1"],
                "node1": ["v1", "v2", "v3"],
                "node2": ["v1", "v2", "v3"],
                "node3": ["v1", "v2", "v3"],
                # "order_by": ["as m1 order by m1 desc LIMIT 1", "as m1 order by m1 asc LIMIT 1"],

            },
            # 两个条件，按时间排序，返回属性值
            "match {path1} where {node1}.pov {{connector}} {node2}.pov with {node3}, {node4}.p_int as m1 order by m1 {{desc_asc}} LIMIT {{limit}} return {node3}.p": {
                "path1": ["v1->v2->v3->v4", "v1->v2->v3", "v1->v2<-v3", "v1->v2", "v1"],
                "node1": ["v1", "v2", "v3", "v4"],
                "node2": ["v1", "v2", "v3", "v4"],
                "node3": ["v1", "v2", "v3", "v4"],
                "node4": ["v1", "v2", "v3", "v4"],
            },
            # 两个条件，按日期排序，返回属性值
            "match {path1} where {node1}.pov {{connector}} {node2}.pov with {node3}, {node4}.p_date as m1 order by m1 {{desc_asc}} LIMIT {{limit}} return {node3}.p": {
                "path1": ["v1->v2->v3->v4", "v1->v2->v3", "v1->v2<-v3", "v1->v2", "v1"],
                "node1": ["v1", "v2", "v3", "v4"],
                "node2": ["v1", "v2", "v3", "v4"],
                "node3": ["v1", "v2", "v3", "v4"],
                "node4": ["v1", "v2", "v3", "v4"],
                # "order_by": ["as m1 order by m1 desc LIMIT 1", "as m1 order by m1 asc LIMIT 1"],
            },
            # 两个条件，按计数排序，返回属性值
            "match {path1} where {node1}.pov {{connector}} {node2}.pov with {node3}, count({node4}) as m1 order by m1 {{desc_asc}} LIMIT {{limit}} return {node3}.p": {
                "path1": ["v1->v2->v3->v4", "v1->v2->v3", "v1->v2<-v3", "v1->v2", "v1"],
                "node1": ["v1", "v2", "v3", "v4"],
                "node2": ["v1", "v2", "v3", "v4"],
                "node3": ["v1", "v2", "v3", "v4"],
                "node4": ["v1", "v2", "v3", "v4"],
                # "order_by": ["as m1 order by m1 desc LIMIT 1", "as m1 order by m1 asc LIMIT 1"],
            },
        },
        "match with match where": {
            # 先计数，返回比例（带一个条件）
            "match {path1} with count({node1}) as m1 match {path1} where {node2}.pov return 100*toFloat(COUNT({node1}))/m1": {
                "path1": ["v1->v2->v3->v4", "v1->v2->v3", "v1->v2<-v3", "v1->v2", "v1"],
                "node1": ["v1", "v2"],
                "node2": ["v1", "v2"],
            },
            # 先计数，返回比例（带两个条件）
            "match {path1} with count({node1}) as m1 match {path1} where {node2}.pov AND {node3}.pov return 100*toFloat(COUNT({node1}))/m1": {
                "path1": ["v1->v2->v3->v4", "v1->v2->v3", "v1->v2<-v3", "v1->v2", "v1"],
                "node1": ["v1", "v2", "v3"],
                "node2": ["v1", "v2", "v3"],
                "node3": ["v1", "v2", "v3"],
            },
            # 先聚合（求平均），并比较聚合结果，返回属性值
            "match {path1} with {aggregate}({node1}.P_int) as m1 match {path1} where {node1}.P_int {{operator}} m1 return {node2}.p": {
                "path1": ["v1->v2->v3->v4", "v1->v2->v3", "v1->v2<-v3", "v1->v2", "v1"],
                "node1": ["v1", "v2"],
                "node2": ["v1", "v2"],
                "aggregate": ["avg"],
                # "operator": ["==", "<", ">"]
            },
            # 先聚合（求最大最小），并比较聚合结果，返回属性值
            "match {path1} with {{aggregate_min_max}}({node1}.P_int) as m1 match {path1} where {node1}.P_int {operator} m1 return {node2}.p": {
                "path1": ["v1->v2->v3->v4", "v1->v2->v3", "v1->v2<-v3", "v1->v2", "v1"],
                "node1": ["v1", "v2"],
                "node2": ["v1", "v2"],
                # "aggregate": ["min", "max"],
                "operator": ["=="]
            },
            # # 先按日期排序，并比较排序结果，返回计数
            "match {path1} with {node1}.P_date as m1 order by m1 {{desc_asc}} LIMIT {{limit}} match {path1} where {node1}.P_date {{operator}} m1 return count({node2})": {
                "path1": ["v1->v2->v3->v4", "v1->v2->v3", "v1->v2<-v3", "v1->v2", "v1"],
                "node1": ["v1", "v2"],
                "node2": ["v1", "v2"],
                # "operator": ["==", "<", ">"],
                # "order_by": ["as m1 order by m1 desc LIMIT 1", "as m1 order by m1 asc LIMIT 1"]
            },

        },
        "match where with match where": {
            # 计算比例（带一个条件/带两个条件）
            "match {path1} where {node1}.POV with count({node2}) as m1 match {path1} where {node1}.POV AND {node3}.pov return 100*toFloat(COUNT({node2}))/m1": {
                "path1": ["v1->v2->v3->v4", "v1->v2->v3", "v1->v2<-v3", "v1->v2", "v1"],
                "node1": ["v1", "v2", "v3"],
                "node2": ["v1", "v2", "v3"],
                "node3": ["v1", "v2", "v3"],
            },
            # 计算比例（带一个条件/带两个条件，包括时间）
            "match {path1} where {node1}.POV with count({node2}) as m1 match {path1} where {node1}.POV AND {node3}.p_date.year == 2020 return 100*toFloat(COUNT({node2}))/m1": {
                "path1": ["v1->v2->v3->v4", "v1->v2->v3", "v1->v2<-v3", "v1->v2", "v1"],
                "node1": ["v1", "v2", "v3"],
                "node2": ["v1", "v2", "v3"],
                "node3": ["v1", "v2", "v3"],
            },
            # 先聚合（求平均），并比较聚合结果，返回属性值（额外带一个条件）
            "match {path1} where {node1}.POV with {aggregate}({node2}.P_int) as m1 match {path1} where {node1}.POV AND {node2}.P_int {{operator}} m1 return {node3}.p": {
                "path1": ["v1->v2->v3->v4", "v1->v2->v3", "v1->v2<-v3", "v1->v2", "v1"],
                "node1": ["v1", "v2", "v3"],
                "node2": ["v1", "v2", "v3"],
                "node3": ["v1", "v2", "v3"],
                "aggregate": ["avg"],
                # "operator": ["==", "<", ">"]
            },
            # 先聚合（求最大最小），并比较聚合结果，返回属性值（额外带一个条件）
            "match {path1} where {node1}.POV with {{aggregate_min_max}}({node2}.P_int) as m1 match {path1} where {node1}.POV AND {node2}.P_int {operator} m1 return {node3}.p": {
                "path1": ["v1->v2->v3->v4", "v1->v2->v3", "v1->v2<-v3", "v1->v2", "v1"],
                "node1": ["v1", "v2", "v3"],
                "node2": ["v1", "v2", "v3"],
                "node3": ["v1", "v2", "v3"],
                # "aggregate": ["min", "max"],
                "operator": ["=="]
            },
            # 先按日期排序，并比较排序结果，返回计数(额外带一个条件)
            "match {path1} where {node1}.POV with {node2}.P_date as m1 order by m1 {{desc_asc}} LIMIT {{limit}} match {path1} where {node1}.POV AND {node2}.P_date {{operator}} m1 return count({node3})": {
                "path1": ["v1->v2->v3->v4", "v1->v2->v3", "v1->v2<-v3", "v1->v2", "v1"],
                "node1": ["v1", "v2", "v3"],
                "node2": ["v1", "v2", "v3"],
                "node3": ["v1", "v2", "v3"],
                # "operator": ["==", "<", ">"],
                # "order_by": ["as m1 order by m1 desc LIMIT 1", "as m1 order by m1 asc LIMIT 1"]
            },

        },
    }


if __name__ == "__main__":
    pass
