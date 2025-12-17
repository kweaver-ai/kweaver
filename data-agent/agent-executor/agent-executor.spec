# agent-executor.spec
# -*- mode: python ; coding: utf-8 -*-
# PyInstaller specification file for Agent-Executor
# Based on dependency analysis and configuration requirements


block_cipher = None
project_root = os.path.abspath('.')

# Data files to include
datas = [
    ("data_migrations", "data_migrations"),
    ("last_commit_info.txt", "."),  # 包含 commit info 文件
    # 包含配置文件和数据文件
    ("app/logic/retriever/AS_doc/config/stop_words.txt", "app/logic/retriever/AS_doc/config"),
    ("app/resources/data/sensitive_words.txt", "app/resources/data"),
    ("app/resources/executors/graph_rag_block/stop_words.txt", "app/resources/executors/graph_rag_block"),
    (".venv/lib64/python3.10/site-packages/DolphinLanguageSDK/skill/installed", "DolphinLanguageSDK/skill/installed")
]

# Analysis configuration
a = Analysis(
    ['main.py'],  # Entry point
    pathex=[project_root],
    binaries=[],
    datas=datas,
    hiddenimports=[],
    excludes=[
        'tkinter',
        'matplotlib',
        'IPython',
        'jupyter',
        'notebook',
        'pytest',
        'pip',
        'pylint',
        'coverage',
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='agent-executor',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[
        'vcruntime140.dll',
        'python*.dll',
        'msvcp*.dll',
    ],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)