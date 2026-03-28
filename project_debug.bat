@echo off
set ROOT_DIR=%~dp0
echo [%DATE% %TIME%] Starting Project Debug... > "%ROOT_DIR%project_debug.log"

echo [%DATE% %TIME%] Checking Backend... >> "%ROOT_DIR%project_debug.log"
cd /d "%ROOT_DIR%backend"
if exist main.py (
    echo FOUND: main.py >> "%ROOT_DIR%project_debug.log"
    start /B python main.py >> "%ROOT_DIR%project_debug.log" 2>&1
) else (
    echo NOT FOUND: main.py >> "%ROOT_DIR%project_debug.log"
)

echo [%DATE% %TIME%] Checking Frontend... >> "%ROOT_DIR%project_debug.log"
cd /d "%ROOT_DIR%frontend"
if exist package.json (
    echo FOUND: package.json >> "%ROOT_DIR%project_debug.log"
    start /B npm run dev >> "%ROOT_DIR%project_debug.log" 2>&1
) else (
    echo NOT FOUND: package.json >> "%ROOT_DIR%project_debug.log"
)

echo [%DATE% %TIME%] Startup sequence complete. >> "%ROOT_DIR%project_debug.log"
