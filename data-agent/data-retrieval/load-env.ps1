# 读取 .env 文件并设置环境变量
Get-Content .env | ForEach-Object {
    if ($_ -match '^([^#].+?)=(.+)$') {
        $name = $Matches[1].Trim()
        $value = $Matches[2].Trim()
        Set-Item "env:$name" $value
        Write-Host "Set $name = $value"
    }
}

# 设置 PYTHONPATH
$env:PYTHONPATH = "$PSScriptRoot\src;$PSScriptRoot\tests"
Write-Host "Set PYTHONPATH = $env:PYTHONPATH" 