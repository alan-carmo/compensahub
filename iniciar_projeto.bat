@echo off
title CompensaHub - Inicializador do Projeto
echo ========================================================
echo          Iniciando CompensaHub (Backend + Frontend)
echo ========================================================
echo.

:: 1. Inicia o servidor Backend (FastAPI) com a venv em uma nova janela
echo [1/2] Iniciando servidor Backend (FastAPI)...
start "CompensaHub - Backend (FastAPI)" cmd /k "cd /d "%~dp0backend" && call venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"

:: Aguarda 2 segundos para o backend inicializar
timeout /t 2 /nobreak >nul

:: 2. Inicia o servidor Frontend (React/Vite) em uma nova janela
echo [2/2] Iniciando servidor Frontend (React/Vite)...
start "CompensaHub - Frontend (React/Vite)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ========================================================
echo  Projeto iniciado com sucesso!
echo  - Backend API: http://localhost:8000
echo  - Frontend App: http://localhost:5173
echo ========================================================
echo.
pause
