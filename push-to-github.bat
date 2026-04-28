@echo off
echo === LesCoach GitHub Push ===
cd /d "%~dp0"

echo Removing stale git locks...
del /f .git\config.lock 2>nul
del /f .git\index.lock 2>nul

echo Adding remote...
git remote add origin https://github.com/tbthijs-oss/lescoach.git 2>nul || git remote set-url origin https://github.com/tbthijs-oss/lescoach.git

echo Staging all changes...
git add -A

echo Committing...
git -c user.email=tbthijs@gmail.com -c user.name=Thomas commit -m "fix: ExpertModal pre-fill + expert email routing + resultaten page"

echo Pushing to GitHub...
git push -u origin main

echo.
echo Done! Check Vercel for deployment status.
pause
