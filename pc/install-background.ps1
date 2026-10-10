param([switch]$Remove)
$ErrorActionPreference = 'Stop'
$taskName = 'Codaki Mini Codex PC'
if ($Remove) {
    Stop-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
    exit
}
$source = Join-Path $PSScriptRoot 'mini_codex_pc.py'
if (-not (Test-Path -LiteralPath $source -PathType Leaf)) { throw 'Missing mini_codex_pc.py' }
$python = (Get-Command pythonw.exe -ErrorAction Stop).Source
$identity = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
# Interactive owner session; no password, elevation, network listener or visible console.
$action = New-ScheduledTaskAction -Execute $python -Argument ('"' + $source + '" run') -WorkingDirectory $PSScriptRoot
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $identity
$principal = New-ScheduledTaskPrincipal -UserId $identity -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -Hidden -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) -MultipleInstances IgnoreNew -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force | Out-Null
Start-ScheduledTask -TaskName $taskName
Write-Output 'Mini Codex background worker registered for this Windows user. Use stop to disable execution; remove preserves connections and journal.'
