$user = "automailai"
$pass = "glXAGMZDfBp+46G4D3h86kW8lhmWAsLgvhvx98mF0Tg="
$pair = "$($user):$($pass)"
$bytes = [System.Text.Encoding]::ASCII.GetBytes($pair)
$base64 = [Convert]::ToBase64String($bytes)
$headers = @{ Authorization = "Basic $base64" }

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/cron" -Method Get -Headers $headers -ErrorAction Stop
    Write-Host "Success: $($response | ConvertTo-Json -Depth 5)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "Body: $($reader.ReadToEnd())"
    }
}
