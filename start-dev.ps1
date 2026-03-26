# Script para iniciar el entorno de desarrollo ADT PRO (VERSION CELULAR / RED EXTERNA)
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   INICIANDO ENTORNO DE DESARROLLO ADT" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

# --- DETECCIÓN DE IP AUTOMÁTICA (Filtrado Estricto) ---
$localIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
    $_.IPAddress -notlike '169.254.*' -and 
    $_.IPAddress -notlike '127.*' -and 
    $_.IPAddress -notlike '172.*' -and
    ($_.PrefixOrigin -eq 'Dhcp' -or $_.PrefixOrigin -eq 'Manual')
} | Select-Object -First 1).IPAddress

if (!$localIp) { 
    # Si falla el filtro estricto, intentamos buscar cualquiera que empiece con 192 o 10
    $localIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like '192.168.*' -or $_.IPAddress -like '10.*' } | Select-Object -First 1).IPAddress
}

if (!$localIp) { 
    $localIp = "localhost" 
    Write-Host "[!] ERROR: No se detectó una IP de red válida. ¿Estás conectado al Wi-Fi?" -ForegroundColor Red
}

Write-Host "`n[!] IP REAL DETECTADA: $localIp" -ForegroundColor Magenta
Write-Host "[!] Tu celular debe entrar a: http://$($localIp):5178" -ForegroundColor Magenta
Write-Host "===============================================" -ForegroundColor Cyan

# --- CONFIGURACIÓN DE ENTORNOS (.env) ---
Write-Host "[0/6] Configurando variables de entorno para red..." -ForegroundColor Yellow
$api_url_value = "http://$($localIp):3001"
$api_url_line = "VITE_API_URL=$api_url_value"

function Update-EnvFile {
    param($path, $newLine)
    if (Test-Path $path) {
        $content = Get-Content $path
        $found = $false
        $newContent = $content | ForEach-Object {
            if ($_ -match "^VITE_API_URL=") {
                $found = $true
                $newLine
            } else {
                $_
            }
        }
        if (!$found) { $newContent += $newLine }
        $newContent | Set-Content $path
    } else {
        $newLine | Set-Content $path
    }
}

Update-EnvFile "./pwa/.env" $api_url_line
Update-EnvFile "./dashboard/.env" $api_url_line

# 1. Verificar Docker
if (!(docker ps 2>$null)) {
    Write-Host "[!] ERROR: Docker no parece estar corriendo. Por favor inicia Docker Desktop." -ForegroundColor Red
    exit
}

# 2. Iniciar contenedores
Write-Host "`n[1/6] Levantando contenedores (MSSQL, Redis)..." -ForegroundColor Yellow
docker-compose up -d --remove-orphans

# 2.5 Verificar Redis
Write-Host "[*] Verificando Redis..." -ForegroundColor Yellow
$redisReady = $false
$retryRedis = 0
while (!$redisReady -and $retryRedis -lt 10) {
    $result = docker exec adt_redis redis-cli ping 2>$null
    if ($result -match "PONG") { $redisReady = $true }
    else { Write-Host "." -NoNewline; Start-Sleep -Seconds 2; $retryRedis++ }
}
if (!$redisReady) { Write-Host "`n[!] ADVERTENCIA: Redis no responde. Las colas de Telegram podrían fallar." -ForegroundColor Yellow }

# 3. Esperar a que MSSQL acepte conexiones
Write-Host "[2/6] Esperando a que MSSQL este listo..." -ForegroundColor Yellow
$retryCount = 0
$maxRetries = 20
$dbReady = $false
$sqlPath = "/opt/mssql-tools18/bin/sqlcmd"

while (!$dbReady -and $retryCount -lt $maxRetries) {
    $result = docker exec adt_mssql $sqlPath -S localhost -U sa -P YourStrongPassword123 -Q "SELECT 1" -C 2>$null
    if ($null -eq $result) {
        $sqlPath = "/opt/mssql-tools/bin/sqlcmd"
        $result = docker exec adt_mssql $sqlPath -S localhost -U sa -P YourStrongPassword123 -Q "SELECT 1" -C 2>$null
    }
    if ($result -match "1") { $dbReady = $true } 
    else { Write-Host "." -NoNewline -ForegroundColor Yellow; Start-Sleep -Seconds 5; $retryCount++ }
}

# 4. Crear DB si no existe
Write-Host "`n[3/6] Verificando base de datos adt_db..." -ForegroundColor Yellow
docker exec adt_mssql $sqlPath -S localhost -U sa -P YourStrongPassword123 -Q "IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'adt_db') CREATE DATABASE adt_db" -C 2>$null

# 5. Instalar dependencias si faltan
Write-Host "[4/6] Sincronizando librerias..." -ForegroundColor Yellow
# Solo instalamos si no existe node_modules para ganar velocidad
if (!(Test-Path "./node_modules")) { Write-Host "[-] Instalando dependencias Backend..."; npm install --quiet }
if (!(Test-Path "./pwa/node_modules")) { cd pwa; npm install --quiet; cd .. }
if (!(Test-Path "./dashboard/node_modules")) { cd dashboard; npm install --quiet; cd .. }

# --- VERIFICACIÓN DE TELEGRAM ---
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "TELEGRAM_BOT_TOKEN=(.+)") {
        Write-Host "[*] Token de Telegram detectado OK." -ForegroundColor Green
    } else {
        Write-Host "[!] ADVERTENCIA: No se encontró TELEGRAM_BOT_TOKEN en .env. Las notificaciones no funcionarán." -ForegroundColor Yellow
    }
} else {
    Write-Host "[!] ERROR: No existe archivo .env en la raíz. Creando uno básico..." -ForegroundColor Red
    "TELEGRAM_BOT_TOKEN=7545078862:AAHPBq5VwX2PnIl5PWW10rGCjiswyuG9xps" | Out-File -FilePath ".env" -Encoding utf8
}

# --- LIMPIEZA DE PROCESOS ANTERIORES (Súrgica por puerto) ---
Write-Host "[*] Limpiando puertos 3001, 5177, 5178 para evitar colisiones..." -ForegroundColor Gray
$ports = @(3001, 5173, 5174, 5177, 5178)
foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connections) {
        foreach ($conn in $connections) {
            Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    }
}

# 6. Iniciar servicios
Write-Host "[5/6] Lanzando Backend NestJS..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run start:dev"

# Esperar un poco a que el backend inicie antes de lanzar frontends
Start-Sleep -Seconds 3

Write-Host "[6/6] Lanzando Frontends (MODO RED EXTERNA)..." -ForegroundColor Yellow
# Dashboard: Puerto 5177 con acceso externo
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd dashboard; npx vite --host --port 5177"
# PWA Chofer: Puerto 5178 con acceso externo
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd pwa; npx vite --host --port 5178 --force"

Write-Host "`n===============================================" -ForegroundColor Green
Write-Host "   SISTEMA ADT EN MARCHA (VERSION CELULAR)" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host "Tu PC Dashboard: http://localhost:5177"
Write-Host "Tu PC PWA Chofer: http://localhost:5178"
Write-Host "TU CELULAR PWA: http://$($localIp):5178" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Green
