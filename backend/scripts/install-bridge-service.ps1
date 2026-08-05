param(
  [string]$ServiceName = 'DynamicRestoBarBridge',
  [string]$BackendDir = 'D:\@Desarrollos\@Web\DynamicRestoBar\backend',
  [string]$NssmExe = 'C:\tools\nssm\win64\nssm.exe',
  [string]$NodeExe = 'C:\Program Files\nodejs\node.exe',
  [switch]$ForceReinstall
)

$ErrorActionPreference = 'Stop'

function Write-Step {
  param([string]$Message)
  Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Assert-Admin {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($identity)
  if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw 'Ejecuta este script en PowerShell como Administrador.'
  }
}

function Assert-Path {
  param([string]$PathValue, [string]$Label)
  if (-not (Test-Path $PathValue)) {
    throw "$Label no existe: $PathValue"
  }
}

Assert-Admin

Write-Step 'Validando rutas y prerequisitos'
Assert-Path -PathValue $BackendDir -Label 'BackendDir'
Assert-Path -PathValue $NssmExe -Label 'NssmExe'
Assert-Path -PathValue $NodeExe -Label 'NodeExe'
Assert-Path -PathValue (Join-Path $BackendDir '.env') -Label '.env'
Assert-Path -PathValue (Join-Path $BackendDir 'scripts\printBridgeAgent.js') -Label 'printBridgeAgent.js'

$logsDir = Join-Path $BackendDir 'logs'
if (-not (Test-Path $logsDir)) {
  New-Item -ItemType Directory -Path $logsDir | Out-Null
}

$outLog = Join-Path $logsDir 'bridge-agent.out.log'
$errLog = Join-Path $logsDir 'bridge-agent.err.log'

Write-Step 'Verificando servicio existente'
$existing = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($existing) {
  if (-not $ForceReinstall) {
    throw "El servicio $ServiceName ya existe. Ejecuta con -ForceReinstall para reinstalar."
  }

  Write-Step "Deteniendo y removiendo servicio existente: $ServiceName"
  & $NssmExe stop $ServiceName | Out-Null
  Start-Sleep -Seconds 1
  & $NssmExe remove $ServiceName confirm | Out-Null
}

Write-Step 'Instalando servicio NSSM'
& $NssmExe install $ServiceName $NodeExe 'scripts/printBridgeAgent.js' | Out-Null

Write-Step 'Configurando directorio de trabajo y logs'
& $NssmExe set $ServiceName AppDirectory $BackendDir | Out-Null
& $NssmExe set $ServiceName AppStdout $outLog | Out-Null
& $NssmExe set $ServiceName AppStderr $errLog | Out-Null
& $NssmExe set $ServiceName AppRotateFiles 1 | Out-Null
& $NssmExe set $ServiceName AppRotateOnline 1 | Out-Null
& $NssmExe set $ServiceName AppRotateBytes 10485760 | Out-Null

Write-Step 'Configurando reinicio automático en fallos'
& $NssmExe set $ServiceName AppExit Default Restart | Out-Null
& $NssmExe set $ServiceName AppThrottle 5000 | Out-Null

Write-Step 'Configurando autoarranque y arrancando servicio'
sc.exe config $ServiceName start= auto | Out-Null
sc.exe start $ServiceName | Out-Null

Write-Step 'Estado actual del servicio'
sc.exe query $ServiceName

Write-Host "`nServicio instalado correctamente." -ForegroundColor Green
Write-Host "Nombre      : $ServiceName"
Write-Host "BackendDir  : $BackendDir"
Write-Host "Stdout log  : $outLog"
Write-Host "Stderr log  : $errLog"
Write-Host "`nSi cambias .env, reinicia con: sc stop $ServiceName ; sc start $ServiceName"
