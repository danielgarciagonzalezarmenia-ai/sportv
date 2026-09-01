# SPORTV — Script de despliegue a GitHub Pages
# Uso:  .\subir.ps1  "mensaje del commit"
# Sube los cambios a la rama actual y publica la web (GitHub Pages).

param([string]$Mensaje = "actualizacion web")

$ErrorActionPreference = 'Stop'

# 1) Verificar que estamos en un repo git
if (-not (Test-Path '.git')) {
  Write-Host "No hay repositorio git en esta carpeta. Crealo con: git init" -ForegroundColor Red
  exit 1
}

# 2) Añadir y commitear
git add -A
git commit -m $Mensaje
if ($LASTEXITCODE -ne 0) {
  Write-Host "No habia cambios para subir (o el commit fallo)." -ForegroundColor Yellow
}

# 3) Publicar a la rama remota actual
$branch = git branch --show-current
git push origin $branch
if ($LASTEXITCODE -ne 0) {
  Write-Host "Error al hacer push. Revisa el remoto con: git remote -v" -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "Web publicada. Espera 1-2 min y revisa GitHub Pages." -ForegroundColor Green
Write-Host "Recuerda recargar con Ctrl+F5 para saltar la cache del navegador." -ForegroundColor Cyan