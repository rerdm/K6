# convert_results.ps1
# Converts k6 NDJSON `results.json` into a valid JSON array `results_fixed.json`.
# Usage: .\convert_results.ps1 -Input results.json -Output results_fixed.json
param(
    [string]$Input = "results.json",
    [string]$Output = "results_fixed.json"
)

if (-not (Test-Path $Input)) {
    Write-Error "Input file '$Input' not found"
    exit 1
}

$lines = Get-Content $Input | Where-Object { $_ -ne "" }
$objs = @()
foreach ($line in $lines) {
    try {
        $obj = $line | ConvertFrom-Json -ErrorAction Stop
        $objs += $obj
    } catch {
        Write-Host "Skipping invalid JSON line:`n$line`nError: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

nif ($objs.Count -eq 0) {
    Write-Error "No valid JSON objects found in '$Input'"
    exit 2
}

n$objs | ConvertTo-Json -Depth 10 | Out-File -Encoding UTF8 $Output
Write-Host "Wrote $($objs.Count) objects to $Output" -ForegroundColor Green
