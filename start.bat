@echo off
REM 设置UTF-8编码
chcp 65001 >nul
REM 听听音乐启动脚本

REM 设置颜色
echo [92m正在启动听听音乐...[0m

REM 检查虚拟环境是否存在
if not exist "venv" (
    echo [91m虚拟环境不存在，请先运行 setup.bat 搭建环境[0m
    pause
    exit /b 1
)

REM 激活虚拟环境
echo [92m激活虚拟环境...[0m
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo [91m激活虚拟环境失败[0m
    pause
    exit /b 1
)

REM 启动服务
echo [92m启动服务...[0m
echo [96m服务将在 http://127.0.0.1:8000 上运行[0m
echo [96m按 Ctrl+C 停止服务[0m
uvicorn app.backend.main:app --reload

pause
