@echo off
echo Starting PDF Baba...

start cmd /k "cd api && npm run dev"
start cmd /k "cd frontend && npm run dev"

echo Servers started!
echo Frontend: http://localhost:3000
echo API: http://localhost:4000
echo.
echo If the API window closes immediately, there is an error in the API folder.
pause
