@echo off
REM 设置UTF-8编码 
chcp 65001 >nul
REM 听听音乐启动脚本 
echo 正在启动听听音乐... 

REM 检查虚拟环境是否存在 
if not exist "venv" (
    echo 虚拟环境不存在，请先运行 setup.bat 搭建环境  
    pause
    exit /b 1
)

REM 激活虚拟环境 
echo 激活虚拟环境.. 
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo 激活虚拟环境失败 
    pause
    exit /b 1
)

REM 获取本地IP地址 
set IP_ADDRESS=127.0.0.1
for /f "tokens=2 delims=: " %%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "127.0.0.1"') do (
    set IP_ADDRESS=%%a
    goto :found_ip
)
:found_ip

REM 移除IP地址前后的空格 
for /f "tokens=*" %%a in ("%IP_ADDRESS%") do set IP_ADDRESS=%%a

REM 启动服务 
echo 正在启动服务... 
echo 服务将在 http://127.0.0.1:8000 上运行 
echo 手机调试地址：http://%IP_ADDRESS%:8000 
echo 按 Ctrl+C 停止服务 
uvicorn app.backend.main:app --reload --host 0.0.0.0

pause
