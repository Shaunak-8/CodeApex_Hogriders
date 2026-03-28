@echo off
set PYTHON_PATH=C:\Users\patil\AppData\Local\Programs\Python\Python311\python.exe
set NPM_PATH=C:\Program Files\nodejs\npm.cmd

echo [%DATE% %TIME%] Starting Backend with %PYTHON_PATH%... > run_log.txt
cd backend
start /B %PYTHON_PATH% main.py >> ..\run_log.txt 2>&1
cd ..

echo [%DATE% %TIME%] Starting Frontend with %NPM_PATH%... >> run_log.txt
cd frontend
start /B %NPM_PATH% run dev >> ..\run_log.txt 2>&1
cd ..

echo [%DATE% %TIME%] Startup commands issued in background. >> run_log.txt
