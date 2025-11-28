@echo off
REM 设置UTF-8编码
chcp 65001 >nul
REM 听听音乐 - 环境搭建脚本

REM 设置颜色
echo [92m正在搭建听听音乐环境...[0m

REM 检查虚拟环境是否存在
if not exist "venv" (
    echo [93m虚拟环境不存在，正在创建...[0m
    python -m venv venv
    if errorlevel 1 (
        echo [91m创建虚拟环境失败[0m
        pause
        exit /b 1
    )
)

REM 激活虚拟环境
echo [92m激活虚拟环境...[0m
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo [91m激活虚拟环境失败[0m
    pause
    exit /b 1
)

REM 安装依赖
echo [92m安装依赖...[0m
pip install -r requirements.txt
if errorlevel 1 (
    echo [91m安装依赖失败[0m
    pause
    exit /b 1
)

echo [92m环境搭建完成！[0m
echo [96m可以运行 start.bat 启动服务[0m
pause
