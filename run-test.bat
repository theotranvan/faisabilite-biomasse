@echo off
REM Script de démarrage du parcours de test complet (Windows)
REM Utilisation: run-test.bat

setlocal enabledelayedexpansion

echo ===========================================================
echo   TEST PARCOURS COMPLET - Faisabilite Biomasse
echo ===========================================================
echo.

echo [1/4] npm install (si necessaire)...
if not exist "node_modules" (
  echo Installing dependencies...
  call npm install
) else (
  echo node_modules existe, skip npm install
)
echo.

echo [2/4] npx prisma generate...
call npx prisma generate
echo.

echo [3/4] npx prisma db seed...
call npx prisma db seed
echo.

echo [4/4] Lancer le test du parcours...
call npx tsx scripts/test-parcours-complet.ts
echo.

echo ===========================================================
echo   TEST TERMINE
echo ===========================================================
echo.
echo Si tous les tests sont passes ^(100%%^):
echo   1. Lancer le serveur: npm run dev
echo   2. Ouvrir http://localhost:3000
echo   3. Creer une affaire manuellement
echo   4. Exporter un PDF pour verification finale
echo.

pause
