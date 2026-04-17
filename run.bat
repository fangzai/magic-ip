@echo off
title CF IP Optimizer
echo ===================================================
echo   Starting Cloudflare IP Optimizer Server...
echo ===================================================
echo.
echo Please wait... The browser will open automatically.
echo Do not close this black window while using the tool.
echo.
:: Clear proxy environment variables to ensure direct connection
set HTTP_PROXY=
set HTTPS_PROXY=
set http_proxy=
set https_proxy=
set NO_PROXY=localhost,127.0.0.1

:: Automatically open the default system browser
start http://localhost:3000

:: Start the node server
node server.js

pause
