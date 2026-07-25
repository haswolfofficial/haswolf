HASWOLF V6 MOBILE VOICE V3 — FIXED

Önce eski betiği silmek zorunda değilsin. Bu düzeltilmiş dosyayı proje klasörüne kopyalayıp eskisinin üzerine yaz.

VS Code terminalinde:

cd C:\Users\Lenovo\haswolf-v6
powershell -ExecutionPolicy Bypass -File .\apply-haswolf-v6-mobile-voice-v3.ps1
Remove-Item .next -Recurse -Force -ErrorAction SilentlyContinue
npm run build

Build başarılıysa:

git add .
git commit -m "Mobile voice panel, media controls and Turkish encoding fix"
git push origin haswolf-v6-professional
