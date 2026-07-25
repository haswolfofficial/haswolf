HASWOLF V6 MOBILE VOICE V6

1) ZIP icindeki iki dosyayi C:\Users\Lenovo\haswolf-v6 klasorune kopyala.
2) Acik build varsa Ctrl+C.
3) Calistir:

cd C:\Users\Lenovo\haswolf-v6
powershell -ExecutionPolicy Bypass -File .\apply-haswolf-v6-mobile-voice-v6.ps1
Remove-Item .next -Recurse -Force -ErrorAction SilentlyContinue
npm run build
