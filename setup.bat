@echo off
REM 设置UTF-8编码 
chcp 65001 >nul
REM 听听音乐 - 环境搭建脚本 

REM 设置颜色 
echo 正在搭建听听音乐环境... 

REM 检查虚拟环境是否存在 
if not exist "venv" (
    echo 虚拟环境不存在，正在创建... 
    python -m venv venv
    if errorlevel 1 (
        echo 创建虚拟环境失败 
        pause
        exit /b 1
    )
)

REM 激活虚拟环境 
echo 激活虚拟环境... 
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo 激活虚拟环境失败 
    pause
    exit /b 1
)

REM 安装依赖 
echo 安装依赖... 
pip install -r requirements.txt
if errorlevel 1 (
    echo 安装依赖失败 
    pause
    exit /b 1
)

echo 环境搭建完成！ 
echo 可以运行 start.bat 启动服务 
pause
