@echo off
echo ===================================================
echo   Pushing Rydex Self-Healing Cloud to GitHub
echo ===================================================
echo.
cd /d "%~dp0"
git push -u origin main
echo.
echo ===================================================
if %ERRORLEVEL% equ 0 (
    echo [SUCCESS] Code pushed to https://github.com/Babysree0805/self-healing-cloud
    echo.
    echo Next step: Go to https://dashboard.render.com/blueprints
    echo Click 'New Blueprint Instance' and select 'self-healing-cloud'
) else (
    echo [NOTICE] If the repository does not exist yet:
    echo 1. Open https://github.com/new in your browser
    echo 2. Set repository name: self-healing-cloud
    echo 3. Click 'Create repository' (leave everything else unchecked)
    echo 4. Run this script again!
)
echo ===================================================
pause
