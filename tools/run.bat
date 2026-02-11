@echo off
title LYT Work Order Extractor
cd /d "%~dp0"
python extract_workorder.py
echo.
pause
