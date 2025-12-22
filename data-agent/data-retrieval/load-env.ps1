# 读取 .env 文件并设置环境变量（如果存在）
# if (Test-Path ".env") {
#     Get-Content .env | ForEach-Object {
#         if ($_ -match '^([^#].+?)=(.+)$') {
#             $name = $Matches[1].Trim()
#             $value = $Matches[2].Trim()
#             Set-Item "env:$name" $value
#             Write-Host "Set $name = $value"
#         }
#     }
# } else {
#     Write-Host ".env not found, skip loading env vars."
# }

# 设置 PYTHONPATH
$env:PYTHONPATH = "$PSScriptRoot\src;$PSScriptRoot\tests"
Write-Host "Set PYTHONPATH = $env:PYTHONPATH" 