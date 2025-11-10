# PowerShell script to start both servers
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; & 'C:\Program Files\nodejs\node.exe' proxy-server.js"
Start-Sleep -Seconds 2
ng serve

