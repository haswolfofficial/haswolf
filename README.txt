HASWOLF MOBILE VOICE V6.1

Bu sürüm, önceki Node betiğindeki 'ReferenceError: sp is not defined'
hatasını giderir. İç içe template literal kullanılmaz.

KULLANIM

1. haswolf-mobile-voice-v6-1.mjs dosyasını:
   C:\Users\Lenovo\haswolf-v6
   klasörüne kopyala.

2. Terminal:

cd C:\Users\Lenovo\haswolf-v6
node .\haswolf-mobile-voice-v6-1.mjs
Remove-Item .next -Recurse -Force -ErrorAction SilentlyContinue
npm run build

3. Build başarılıysa:

git add .
git commit -m "Fix mobile voice patch runtime v6.1"
git push origin haswolf-v6-professional
