@echo off
start "Nextjs" cmd /k "cd /d %~dp0nextjs && bun dev"
start "FastAPI" cmd /k "cd /d %~dp0fastapi && call .venv\Scripts\activate && uvicorn app.main:app --reload"
