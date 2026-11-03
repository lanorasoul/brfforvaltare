@echo off
rem Startar sajten lokalt. Packa upp zippen helt forst (hogerklicka, Extrahera alla), dubbelklicka sedan pa den har filen.
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js hittades inte. Installera Node 22.18 eller nyare fran https://nodejs.org och prova igen.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installerar paket. Det tar en minut.
  call npm install
  if errorlevel 1 (
    echo Installationen misslyckades. Skicka texten ovan om du vill ha hjalp.
    pause
    exit /b 1
  )
)

echo.
echo Startar sajten pa http://localhost:3000
echo Webblasaren oppnas om nagra sekunder. Stang det har fonstret for att stanga av sajten.
echo.
start "" cmd /c "timeout /t 8 >nul & start http://localhost:3000"
rem Lokalt testlage for offertformularet: allt fungerar men ingenting skickas eller sparas.
set REQUESTS_MODE=preview
call npm run dev
pause
