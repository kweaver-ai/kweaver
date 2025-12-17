"""
Setup configuration for TTFT Performance Testing Package
"""

from setuptools import setup, find_packages
import os

# Read README file for long description
def read_readme():
    readme_path = os.path.join(os.path.dirname(__file__), 'README.md')
    if os.path.exists(readme_path):
        with open(readme_path, 'r', encoding='utf-8') as f:
            return f.read()
    return "TTFT Performance Testing Package for Conversation APIs"

# Read requirements
def read_requirements():
    requirements_path = os.path.join(os.path.dirname(__file__), 'requirements.txt')
    if os.path.exists(requirements_path):
        with open(requirements_path, 'r', encoding='utf-8') as f:
            return [line.strip() for line in f if line.strip() and not line.startswith('#')]
    return []

# Read version from package
def get_version():
    version_path = os.path.join(os.path.dirname(__file__), 'ttft_tester', '__init__.py')
    with open(version_path, 'r', encoding='utf-8') as f:
        for line in f:
            if line.startswith('__version__'):
                return line.split('=')[1].strip().strip('"').strip("'")
    return "1.0.0"

setup(
    name="ttft-performance-test",
    version=get_version(),
    author="Claude AI",
    author_email="noreply@anthropic.com",
    description="TTFT Performance Testing Package for Conversation APIs",
    long_description=read_readme(),
    long_description_content_type="text/markdown",
    url="https://github.com/your-repo/ttft-performance-test",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Software Development :: Testing",
        "Topic :: System :: Benchmarking",
        "Topic :: Internet :: WWW/HTTP :: HTTP Servers",
    ],
    python_requires=">=3.10",
    install_requires=read_requirements(),
    extras_require={
        "charts": ["matplotlib>=3.5.0"],
        "full": ["pyyaml>=6.0", "matplotlib>=3.5.0", "pandas>=1.3.0", "aiohttp>=3.8.0"],
        "dev": [
            "pytest>=7.0.0",
            "pytest-cov>=4.0.0",
            "black>=22.0.0",
            "flake8>=5.0.0",
            "mypy>=0.991",
        ],
    },
    entry_points={
        "console_scripts": [
            "ttft-tester=ttft_tester.cli:main",
        ],
    },
    include_package_data=True,
    zip_safe=False,
    keywords="ttft performance testing benchmarking api http asyncio",
    project_urls={
        "Bug Reports": "https://github.com/your-repo/ttft-performance-test/issues",
        "Source": "https://github.com/your-repo/ttft-performance-test",
        "Documentation": "https://github.com/your-repo/ttft-performance-test/docs",
    },
)