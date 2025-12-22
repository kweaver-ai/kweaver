# -*- coding: utf-8 -*-
"""
Jupyter Gateway Runner 使用示例

这个示例演示了如何使用JupyterGatewayRunner执行代码，
并演示了如何在多次执行之间保持kernel状态
"""

import time
import sys

from data_retrieval.utils.code_runner.jupyter_gateway_runner import JupyterGatewayRunner
from data_retrieval.settings import get_settings, set_value
import json

def main():
    # 设置Jupyter Gateway URL - 请根据实际环境修改
    gateway_url = "http://127.0.0.1:8888"  # 修改为你的Jupyter Gateway URL
    
    print("=== Jupyter Gateway Runner 示例 ===")
    
    # 检查是否可用
    if not JupyterGatewayRunner.is_jupyter_gateway_available():
        print("错误: Jupyter Gateway依赖不可用，请安装requests库")
        return
    
    try:
        # 创建一个新的runner
        runner = JupyterGatewayRunner(gateway_url=gateway_url)
        kernel_id = runner.get_id()
        
        if not kernel_id:
            print("错误: 无法创建Jupyter Gateway kernel")
            return
        
        print(f"成功创建了一个新的kernel，ID: {kernel_id}")
    except Exception as e:
        print(f"连接失败: {str(e)}")
        return
    
    # 示例1: 执行简单代码
    code1 = """
import numpy as np
import pandas as pd

# 创建一个简单的DataFrame
df = pd.DataFrame({
    'A': np.random.rand(5),
    'B': np.random.rand(5)
})

# 将结果存储在result变量中
result = df.to_dict()
"""
    
    try:
        print("\n=== 示例1: 执行简单代码 ===")
        start_time = time.time()
        result1 = runner.run(code1)
        end_time = time.time()
        print(f"执行时间: {end_time - start_time:.2f}秒")
        print(f"执行结果:\n{json.dumps(result1['result'], indent=2)}")
    except Exception as e:
        print(f"执行错误: {str(e)}")
    
    # 示例2: 使用第一次执行中创建的变量
    code2 = """
# 在df中添加一列
df['C'] = df['A'] + df['B']

# 返回更新后的DataFrame
result = df.to_dict()
"""
    
    try:
        print("\n=== 示例2: 使用之前执行中创建的变量 ===")
        start_time = time.time()
        result2 = runner.run(code2)
        end_time = time.time()
        print(f"执行时间: {end_time - start_time:.2f}秒")
        print(f"执行结果:\n{json.dumps(result2['result'], indent=2)}")
    except Exception as e:
        print(f"执行错误: {str(e)}")
    
    # 示例3: 传入数据和变量
    data = {
        "x": [1, 2, 3, 4, 5],
        "y": [10, 20, 30, 40, 50]
    }
    
    code3 = """
# 使用传入的数据创建DataFrame
input_df = pd.DataFrame(data)

# 进行一些计算
input_df['z'] = input_df['x'] * input_df['y']

# 返回结果
result = {
    'input_data': data,
    'output_data': input_df.to_dict(),
    'correlation': input_df.corr().to_dict()
}
"""
    
    try:
        print("\n=== 示例3: 传入数据和变量 ===")
        start_time = time.time()
        result3 = runner.run(code3, data=data, custom_variable="这是一个自定义变量")
        end_time = time.time()
        print(f"执行时间: {end_time - start_time:.2f}秒")
        print(f"执行结果:\n{json.dumps(result3['result'], indent=2)}")
    except Exception as e:
        print(f"执行错误: {str(e)}")
    
    # 示例4: 复数处理
    code4 = """
import numpy as np

# 创建一个包含复数的数组
complex_array = np.array([1+2j, 3+4j, 5+6j])

# 返回复数数据
result = {
    'complex_values': complex_array.tolist(),
    'complex_calculation': (2+3j) * (4+5j)
}
"""
    
    try:
        print("\n=== 示例4: 复数处理 ===")
        start_time = time.time()
        result4 = runner.run(code4)
        end_time = time.time()
        print(f"执行时间: {end_time - start_time:.2f}秒")
        print(f"执行结果:\n{json.dumps(result4['result'], indent=2)}")
    except Exception as e:
        print(f"执行错误: {str(e)}")
    
    # 关闭kernel
    print("\n关闭kernel...")
    if runner.close():
        print(f"成功关闭kernel: {kernel_id}")
    else:
        print(f"关闭kernel失败: {kernel_id}")
    
    # 示例5: 使用static_run方法一次性执行代码
    print("\n=== 示例5: 使用static_run方法 ===")
    code5 = """
import numpy as np

# 创建随机矩阵
matrix = np.random.rand(3, 3)

# 计算矩阵特征值
eigenvalues = np.linalg.eigvals(matrix)

# 返回结果
result = {
    'matrix': matrix.tolist(),
    'eigenvalues': [{'real': float(v.real), 'imag': float(v.imag)} for v in eigenvalues]
}
"""
    
    try:
        start_time = time.time()
        result5 = JupyterGatewayRunner.static_run(code5, gateway_url=gateway_url)
        end_time = time.time()
        print(f"执行时间: {end_time - start_time:.2f}秒")
        print(f"执行结果:\n{json.dumps(result5['result'], indent=2)}")
        
        # 关闭所有kernels
        count = JupyterGatewayRunner.close_all_kernels()
        print(f"关闭了 {count} 个kernels")
        
    except Exception as e:
        print(f"执行错误: {str(e)}")

if __name__ == "__main__":
    main() 