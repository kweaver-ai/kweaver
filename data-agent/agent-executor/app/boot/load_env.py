import os


# 在应用启动前加载环境变量
def load_env():
    env_file = os.path.join(os.path.dirname(__file__), "..", "..", ".env")

    from app.utils.env import load_env_file

    load_env_file(env_file)
