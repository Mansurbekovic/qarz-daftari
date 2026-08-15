@echo off
echo ========================================
echo   Qarz Daftari v1.2 - Serverlarni ishga tushirish
echo ========================================
echo.

echo [1/2] Backend server (Flask) ishga tushirilmoqda...
start "Qarz Daftari Backend" cmd /c "cd /d %~dp0 && python backend/app.py"
echo      Backend: http://0.0.0.0:5000 ✓
echo.

timeout /t 2 /nobreak >nul

echo [2/2] Frontend server (Vite) ishga tushirilmoqda...
start "Qarz Daftari Frontend" cmd /c "cd /d %~dp0 && npm run dev"
echo      Frontend: http://localhost:3000 ✓
echo.

echo ========================================
echo   Ikkala server ham ishga tushdi!
echo.
echo   Brauzerda oching:
echo     - Kompyuterda: http://localhost:3000
echo     - Telefonda:   http://[KOMPYUTER_IP]:3000
echo.
echo   Bu oynani yopishingiz mumkin.
echo ========================================
pause
