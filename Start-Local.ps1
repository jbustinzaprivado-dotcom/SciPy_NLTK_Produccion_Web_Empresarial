param([switch]$RestartApi)
$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$localDirectory = Join-Path $projectRoot '.local'
$pgDirectory = Join-Path $localDirectory 'postgres'
$pgBin = 'C:\Program Files\PostgreSQL\17\bin'
$pythonExe = Join-Path $projectRoot 'backend\.venv\Scripts\python.exe'
if (!(Test-Path $pythonExe)) { throw 'Instala primero backend/requirements.txt en backend/.venv.' }
if (!(Test-Path "$pgBin\pg_ctl.exe")) { throw 'Se requiere PostgreSQL 17 instalado en este equipo.' }
New-Item -ItemType Directory -Force $localDirectory | Out-Null
$configPath = Join-Path $localDirectory 'database.json'
if (!(Test-Path $configPath)) {
    $passwordBytes = New-Object byte[] 32
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($passwordBytes)
    @{ password = [Convert]::ToBase64String($passwordBytes) } | ConvertTo-Json | Set-Content -LiteralPath $configPath
}
$localConfig = Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json
if (!$localConfig.PSObject.Properties['secret_key']) {
    $secretBytes = New-Object byte[] 48
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($secretBytes)
    $localConfig | Add-Member -NotePropertyName secret_key -NotePropertyValue ([Convert]::ToBase64String($secretBytes))
    $localConfig | ConvertTo-Json | Set-Content -LiteralPath $configPath
}
$env:SECRET_KEY = $localConfig.secret_key
$env:PGHOST = '127.0.0.1'
$env:PGPORT = '55440'
$env:PGUSER = 'empresa_local'
$env:PGPASSWORD = $localConfig.password
$env:PGDATABASE = 'postgres'
# This launcher deliberately uses its own cluster and does not touch installed services.
Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
if (!(Test-Path (Join-Path $pgDirectory 'PG_VERSION'))) {
    $passwordFile = Join-Path $localDirectory 'init-password.txt'
    try {
        Set-Content -LiteralPath $passwordFile -Value $localConfig.password -Encoding ascii
        & "$pgBin\initdb.exe" -D $pgDirectory -U empresa_local -A scram-sha-256 --encoding=UTF8 --locale=C "--pwfile=$passwordFile"
        if ($LASTEXITCODE -ne 0) { throw 'No se pudo inicializar PostgreSQL local.' }
    } finally { Remove-Item -LiteralPath $passwordFile -ErrorAction SilentlyContinue }
}
& "$pgBin\pg_ctl.exe" -D $pgDirectory status *> $null
if ($LASTEXITCODE -ne 0) {
    & "$pgBin\pg_ctl.exe" -D $pgDirectory -l (Join-Path $localDirectory 'postgres.log') -o '-h 127.0.0.1 -p 55440' start
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo iniciar PostgreSQL. Revisa .local/postgres.log.' }
}
Push-Location (Join-Path $projectRoot 'backend')
try {
    & $pythonExe -c "from app.database.connection import connect; c=connect(); c.autocommit=True; exists=c.execute('SELECT 1 FROM pg_database WHERE datname=%s', ('empresa_inteligente',)).fetchone(); c.execute('CREATE DATABASE empresa_inteligente') if not exists else None; c.close()"
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo preparar la base local.' }
    $env:PGDATABASE = 'empresa_inteligente'
    & $pythonExe -m app.database.migrate
    if ($LASTEXITCODE -ne 0) { throw 'Fallaron las migraciones.' }
    $listener = Get-NetTCPConnection -State Listen -LocalPort 8000 -ErrorAction SilentlyContinue
    if ($listener -and $RestartApi) {
        foreach ($apiProcessId in ($listener.OwningProcess | Select-Object -Unique)) {
            $apiProcess = Get-CimInstance Win32_Process -Filter "ProcessId = $apiProcessId"
            $apiParent = Get-CimInstance Win32_Process -Filter "ProcessId = $($apiProcess.ParentProcessId)"
            $belongsToProject = ($apiProcess.ExecutablePath -eq $pythonExe) -or ($apiParent.ExecutablePath -eq $pythonExe -and $apiParent.CommandLine -match 'uvicorn\s+app\.main:app')
            if ($apiProcess.CommandLine -notmatch 'uvicorn\s+app\.main:app' -or !$belongsToProject) {
                throw 'El puerto 8000 pertenece a otro proceso; no se reiniciará.'
            }
            Stop-Process -Id $apiProcessId
            Wait-Process -Id $apiProcessId -Timeout 10 -ErrorAction SilentlyContinue
        }
        $listener = $null
    }
    if (!$listener) {
        Start-Process -FilePath $pythonExe -ArgumentList '-m','uvicorn','app.main:app','--host','127.0.0.1','--port','8000' -WorkingDirectory (Get-Location).Path -WindowStyle Hidden -RedirectStandardOutput (Join-Path $localDirectory 'api.log') -RedirectStandardError (Join-Path $localDirectory 'api-error.log') | Out-Null
    }
    $ready = $false
    for ($attempt = 0; $attempt -lt 15; $attempt++) {
        try { Invoke-RestMethod 'http://127.0.0.1:8000/openapi.json' -TimeoutSec 2 | Out-Null; $ready = $true; break }
        catch { Start-Sleep -Seconds 1 }
    }
    if (!$ready) { throw 'La API no está lista. Revisa .local/api-error.log.' }
    Write-Output 'API y PostgreSQL listos. Abre el frontend en http://localhost:5173.'
} finally {
    Pop-Location
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}
