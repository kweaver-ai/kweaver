# 当前所在包的入口文件，所有的boot方法都会在这里调用
from app.common.config import Config


def on_boot_run():
    # 1. 加载环境变量 ()
    from . import load_env

    load_env.load_env()

    # 2. 配置初始化（创建单例实例）
    from app.config.config_v2 import ConfigClassV2

    ConfigClassV2()

    # 3. 初始化内置agent和工具
    from . import built_in

    built_in.handle_built_in()

    # 4. 输出last_commit_info.txt的内容
    if Config.app.is_print_last_commit_info:
        from . import output_commit_info

        output_commit_info.output_last_commit_info()

    # 5. 启动时输出Config信息
    if Config.local_dev.is_show_config_on_boot:
        from app.common.struct_logger import struct_logger

        struct_logger.console_logger.debug(
            "Config配置信息", config_info=Config.to_dict()
        )
