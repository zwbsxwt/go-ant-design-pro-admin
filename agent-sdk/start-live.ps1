$ErrorActionPreference = 'Stop'
$env:HARNESS_ADAPTER = 'live'
$env:DSH_HOME = Join-Path $env:USERPROFILE '.dsh'
$env:DSH_PROFILE = 'sdk'
$env:DSH_MODEL = 'deepseek-v4-pro'
$env:DSH_MODELS = 'deepseek-v4-pro,deepseek-v4-flash'
$env:DEEPSEEK_API_KEY = (Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot '..\deepSeek.dev')).Trim()

Set-Location $PSScriptRoot
python app.py
