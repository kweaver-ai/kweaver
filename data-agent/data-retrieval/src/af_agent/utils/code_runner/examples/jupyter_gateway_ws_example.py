# -*- coding: utf-8 -*-
"""
WebSocket版Jupyter Gateway Runner 使用示例

这个示例演示了如何使用基于WebSocket的JupyterGatewayRunner执行代码，
并演示了如何在多次执行之间保持kernel状态
"""

import time

from af_agent.utils.code_runner.jupyter_gateway_runner import JupyterGatewayRunner
from af_agent.settings import get_settings, set_value
import json

def main():
    # 设置Jupyter Gateway URL（如果需要）
    # set_value("AD_GATEWAY_URL", "http://your-jupyter-gateway-url:8888")
    
    print("=== WebSocket版 Jupyter Gateway Runner 演示 ===")
    
    # 检查是否可用
    if not JupyterGatewayRunner.is_jupyter_gateway_available():
        print("错误: Jupyter Gateway依赖不可用，请安装requests和websocket-client库")
        return
    
    # 创建一个新的runner
    runner = JupyterGatewayRunner(gateway_url="http://127.0.0.1:8888")
    kernel_id = runner.get_id()
    
    if not kernel_id:
        print("错误: 无法创建Jupyter Gateway kernel")
        return
    
    print(f"成功创建了一个新的kernel，ID: {kernel_id}")
    
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
result
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
    
    # 示例2: 使用第一次执行中创建的变量 - 演示状态保持
    code2 = """
# 在df中添加一列
df['C'] = df['A'] + df['B']

# 返回更新后的DataFrame
result = df.to_dict()
result
"""
    
    try:
        print("\n=== 示例2: 使用之前执行中创建的变量 (演示状态保持) ===")
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
print(input_df)
result
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
    
    # 示例4: 执行错误处理
    code4 = """
# 这段代码会产生一个错误
1/0
result = "不会执行到这里"
"""
    
    try:
        print("\n=== 示例4: 错误处理 ===")
        result4 = runner.run(code4)
        print(f"执行结果:\n{json.dumps(result4['result'], indent=2)}")
    except Exception as e:
        print(f"执行错误 (预期的): {str(e)}")
    
    # 示例5: 执行长时间运行的代码
    code5 = """
import time

# 一个耗时的计算
result = []
for i in range(100000):
    if i % 10000 == 0:
        # 打印进度
        print(f"处理中: {i/1000:.1f}%")
    result.append(i**2)

# 只返回结果的一部分，避免返回太多数据
result = {'count': len(result), 'sample': result[:5]}
result
"""
    
    try:
        print("\n=== 示例5: 长时间运行的代码 ===")
        start_time = time.time()
        result5 = runner.run(code5)
        end_time = time.time()
        print(f"执行时间: {end_time - start_time:.2f}秒")
        print(f"执行结果:\n{json.dumps(result5['result'], indent=2)}")
    except Exception as e:
        print(f"执行错误: {str(e)}")
    
    # 关闭kernel
    print("\n关闭kernel...")
    if runner.close():
        print(f"成功关闭kernel: {kernel_id}")
    else:
        print(f"关闭kernel失败: {kernel_id}")
    
    # 示例6: 使用static_run方法一次性执行代码
    print("\n=== 示例6: 使用static_run方法 ===")
    code6 = """
import numpy as np

# 创建一个随机矩阵
matrix = np.random.rand(3, 3)

# 计算特征值和特征向量
eigenvalues, eigenvectors = np.linalg.eig(matrix)

# 返回结果
result = {
    'matrix': matrix.tolist(),
    'eigenvalues': eigenvalues.tolist(),
    'eigenvectors': eigenvectors.tolist()
}
result
"""
    
    try:
        start_time = time.time()
        result6 = JupyterGatewayRunner.static_run(code6)
        end_time = time.time()
        print(f"执行时间: {end_time - start_time:.2f}秒")
        print(f"执行结果:\n{json.dumps(result6['result'], indent=2)}")
        
        # 关闭所有kernels
        count = JupyterGatewayRunner.close_all_kernels()
        print(f"关闭了 {count} 个kernels")
        
    except Exception as e:
        print(f"执行错误: {str(e)}")

if __name__ == "__main__":
    main() 