#!/usr/bin/env python3
"""
简单的文件web服务器，用于浏览log目录下的文件
"""

import os
import http.server
import socketserver
from urllib.parse import quote
import mimetypes
from datetime import datetime

class LogFileHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # 设置工作目录为log目录
        self.log_dir = "/Users/Zhuanz/Work/as/dip_ws/agent-executor/log"
        os.chdir(self.log_dir)
        super().__init__(*args, **kwargs)
    
    def do_GET(self):
        """处理GET请求"""
        if self.path == '/':
            self.list_directory('.')
        else:
            # 移除开头的斜杠，因为已经在log目录中
            file_path = self.path.lstrip('/')
            
            if os.path.isfile(file_path):
                self.serve_file(file_path)
            elif os.path.isdir(file_path):
                self.list_directory(file_path)
            else:
                self.send_error(404, "File not found")
    
    def list_directory(self, path):
        """列出目录内容"""
        try:
            entries = os.listdir(path)
        except OSError as e:
            self.send_error(500, f"Error listing directory: {e}")
            return
        
        # 分离文件和目录
        files = []
        directories = []
        
        for entry in sorted(entries):
            full_path = os.path.join(path, entry)
            if os.path.isdir(full_path):
                directories.append(entry)
            else:
                files.append(entry)
        
        # 生成HTML页面
        html = self.generate_directory_html(path, directories, files)
        
        self.send_response(200)
        self.send_header('Content-type', 'text/html; charset=utf-8')
        self.end_headers()
        self.wfile.write(html.encode('utf-8'))
    
    def serve_file(self, file_path):
        """提供文件下载或查看"""
        try:
            with open(file_path, 'rb') as f:
                content = f.read()
            
            # 猜测MIME类型
            mime_type, _ = mimetypes.guess_type(file_path)
            if mime_type is None:
                mime_type = 'application/octet-stream'
            
            # 如果是文本文件，直接在浏览器中显示
            if mime_type.startswith('text/'):
                self.send_response(200)
                self.send_header('Content-type', f'{mime_type}; charset=utf-8')
                self.end_headers()
                self.wfile.write(content)
            else:
                # 其他文件类型作为下载
                self.send_response(200)
                self.send_header('Content-type', mime_type)
                self.send_header('Content-Disposition', f'attachment; filename="{quote(os.path.basename(file_path))}"')
                self.end_headers()
                self.wfile.write(content)
                
        except OSError as e:
            self.send_error(500, f"Error reading file: {e}")
    
    def generate_directory_html(self, path, directories, files):
        """生成目录列表的HTML"""
        # 构建面包屑导航
        breadcrumb = self.build_breadcrumb(path)
        
        html = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Log 文件浏览器 - {path}</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }}
        .header {{
            background: #2563eb;
            color: white;
            padding: 20px;
        }}
        .header h1 {{
            margin: 0;
            font-size: 24px;
        }}
        .breadcrumb {{
            background: #f8fafc;
            padding: 15px 20px;
            border-bottom: 1px solid #e2e8f0;
        }}
        .breadcrumb a {{
            color: #2563eb;
            text-decoration: none;
        }}
        .breadcrumb a:hover {{
            text-decoration: underline;
        }}
        .file-list {{
            padding: 20px;
        }}
        .file-item {{
            display: flex;
            align-items: center;
            padding: 12px;
            border-bottom: 1px solid #e2e8f0;
            text-decoration: none;
            color: inherit;
            transition: background-color 0.2s;
        }}
        .file-item:hover {{
            background-color: #f8fafc;
        }}
        .file-icon {{
            margin-right: 12px;
            font-size: 20px;
        }}
        .file-info {{
            flex: 1;
        }}
        .file-name {{
            font-weight: 500;
            margin-bottom: 4px;
        }}
        .file-meta {{
            font-size: 12px;
            color: #64748b;
        }}
        .file-size {{
            color: #64748b;
            font-size: 14px;
        }}
        .directory {{
            background-color: #f1f5f9;
        }}
        .directory .file-name {{
            color: #2563eb;
        }}
        .stats {{
            padding: 20px;
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #64748b;
            font-size: 14px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📁 Log 文件浏览器</h1>
        </div>
        <div class="breadcrumb">
            {breadcrumb}
        </div>
        <div class="file-list">"""
        
        # 添加返回上级目录链接
        if path != '.':
            parent_path = os.path.dirname(path)
            if parent_path == '':
                parent_path = '.'
            html += f"""
            <a href="{self.get_url(parent_path)}" class="file-item directory">
                <span class="file-icon">📁</span>
                <div class="file-info">
                    <div class="file-name">..</div>
                    <div class="file-meta">返回上级目录</div>
                </div>
            </a>"""
        
        # 添加目录
        for directory in directories:
            full_path = os.path.join(path, directory)
            file_count = len([f for f in os.listdir(full_path) if os.path.isfile(os.path.join(full_path, f))])
            dir_count = len([d for d in os.listdir(full_path) if os.path.isdir(os.path.join(full_path, d))])
            
            html += f"""
            <a href="{self.get_url(full_path)}" class="file-item directory">
                <span class="file-icon">📁</span>
                <div class="file-info">
                    <div class="file-name">{directory}</div>
                    <div class="file-meta">{dir_count} 个子目录, {file_count} 个文件</div>
                </div>
            </a>"""
        
        # 添加文件
        for file in files:
            full_path = os.path.join(path, file)
            size = self.format_file_size(os.path.getsize(full_path))
            mtime = datetime.fromtimestamp(os.path.getmtime(full_path)).strftime('%Y-%m-%d %H:%M:%S')
            
            # 根据文件类型选择图标
            icon = self.get_file_icon(file)
            
            html += f"""
            <a href="{self.get_url(full_path)}" class="file-item">
                <span class="file-icon">{icon}</span>
                <div class="file-info">
                    <div class="file-name">{file}</div>
                    <div class="file-meta">修改时间: {mtime}</div>
                </div>
                <div class="file-size">{size}</div>
            </a>"""
        
        total_dirs = len(directories)
        total_files = len(files)
        
        html += f"""
        </div>
        <div class="stats">
            共 {total_dirs} 个目录, {total_files} 个文件
        </div>
    </div>
</body>
</html>"""
        
        return html
    
    def build_breadcrumb(self, path):
        """构建面包屑导航"""
        if path == '.':
            return '<a href="/">🏠 根目录</a>'
        
        parts = path.split('/')
        breadcrumb = '<a href="/">🏠 根目录</a>'
        current_path = ''
        
        for part in parts:
            current_path = os.path.join(current_path, part) if current_path else part
            breadcrumb += f' / <a href="{self.get_url(current_path)}">{part}</a>'
        
        return breadcrumb
    
    def get_url(self, path):
        """获取文件的URL"""
        if path == '.':
            return '/'
        return '/' + quote(path)
    
    def format_file_size(self, size):
        """格式化文件大小"""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} TB"
    
    def get_file_icon(self, filename):
        """根据文件类型获取图标"""
        ext = os.path.splitext(filename)[1].lower()
        icon_map = {
            '.txt': '📄',
            '.log': '📋',
            '.md': '📝',
            '.json': '📊',
            '.csv': '📈',
            '.pdf': '📕',
            '.zip': '📦',
            '.tar': '📦',
            '.gz': '📦',
            '.py': '🐍',
            '.js': '📜',
            '.html': '🌐',
            '.css': '🎨',
            '.jpg': '🖼️',
            '.jpeg': '🖼️',
            '.png': '🖼️',
            '.gif': '🖼️',
        }
        return icon_map.get(ext, '📄')

def main():
    """主函数"""
    PORT = 8088
    import os
    # 获取日志目录，优先使用环境变量，否则使用相对路径
    if 'LOG_DIR' in os.environ:
        log_dir = os.environ['LOG_DIR']
    else:
        # 从脚本位置推导项目根目录和日志目录
        script_dir = os.path.dirname(__file__)
        project_root = os.path.dirname(os.path.dirname(script_dir))
        log_dir = os.path.join(project_root, 'log')
    
    # 确保log目录存在
    if not os.path.exists(log_dir):
        print(f"错误: 日志目录不存在: {log_dir}")
        return
    
    print(f"启动文件服务器...")
    print(f"服务目录: {log_dir}")
    print(f"访问地址: http://localhost:{PORT}")
    print("按 Ctrl+C 停止服务器")
    
    try:
        with socketserver.TCPServer(("", PORT), LogFileHandler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n服务器已停止")
    except OSError as e:
        print(f"启动服务器失败: {e}")

if __name__ == "__main__":
    main()
