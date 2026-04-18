$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
$env:CI = "1"
Set-Location "C:\Users\jaski\OneDrive\99. Codex\Uber App\mobile"
& ".\node_modules\.bin\expo.cmd" start --web
