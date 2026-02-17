$url = "https://cfxmrckrzfocmdtnstwx.supabase.co/functions/v1/send-review-emails"
$headers = @{
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmeG1yY2tyemZvY21kdG5zdHd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NzQ0NjUsImV4cCI6MjA4NDM1MDQ2NX0.leiLW46GoL1cH6EoazfMzH844XqoRzziKp3GMlv9ELE"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -ErrorAction Stop
    Write-Host "SUCCESS: Function responded."
    Write-Host "Response: $($response | ConvertTo-Json -Depth 5)"
} catch {
    $err = $_.Exception.Response
    if ($err) {
        $reader = New-Object System.IO.StreamReader($err.GetResponseStream())
        $body = $reader.ReadToEnd()
        Write-Host "ERROR: HTTP $($err.StatusCode)"
        Write-Host "Body: $body"
    } else {
        Write-Host "ERROR: $($_.Exception.Message)"
    }
}
