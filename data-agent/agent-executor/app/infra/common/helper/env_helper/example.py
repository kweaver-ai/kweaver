"""
本地开发环境变量使用示例
"""

from local_env_helper import (
    RunScenario,
    is_local_dev,
    is_aaron_local_dev,
    get_current_scenarios,
    is_scenario,
)


def example_usage():
    """使用示例"""

    # 1. 判断是否为本地开发环境
    if is_local_dev():
        print("当前是本地开发环境")
    else:
        print("当前不是本地开发环境")

    # 2. 判断是否为特定场景的本地开发环境
    if is_aaron_local_dev():
        print("当前是 Aaron 本地开发环境")

    # 3. 判断是否为指定场景列表中的本地开发环境
    scenarios = [RunScenario.AARON_LOCAL_DEV]
    if is_local_dev(scenarios):
        print("当前是指定场景之一的本地开发环境")

    # 4. 获取当前运行场景列表（支持多个场景）
    current_scenarios = get_current_scenarios()
    print(f"当前运行场景列表: {current_scenarios}")

    # 5. 判断当前是否为指定场景
    if is_scenario(RunScenario.AARON_LOCAL_DEV):
        print("当前运行场景包含 Aaron 本地开发")

    # 6. 直接使用枚举值
    print(f"所有可用场景: {[scenario.value for scenario in RunScenario]}")

    # 7. 多场景示例
    print("\n--- 多场景示例 ---")
    print(
        "设置 LOCAL_DEVRUN_SCENARIO=aaron_local_dev,test_local_dev 可同时激活多个场景"
    )


if __name__ == "__main__":
    example_usage()
