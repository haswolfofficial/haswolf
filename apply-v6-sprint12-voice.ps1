param([string]$ProjectPath="C:\Users\Lenovo\haswolf-v6")
$ErrorActionPreference="Stop"
$stamp=Get-Date -Format "yyyyMMdd-HHmmss";$backup=Join-Path $ProjectPath ".haswolf-backup-v6-sprint12-voice-$stamp";New-Item -ItemType Directory -Path $backup -Force|Out-Null
$files=@("app\layout.tsx","app\globals.css","components\LanguageSelector.tsx","components\AnnouncementBroadcast.tsx","features\community\components\VoiceRoom.tsx")
foreach($r in $files){$s=Join-Path $ProjectPath $r;if(Test-Path $s){$t=Join-Path $backup $r;New-Item -ItemType Directory -Path(Split-Path $t)-Force|Out-Null;Copy-Item $s $t -Force}}
Copy-Item "$PSScriptRoot\PersistentVoiceProvider.tsx" "$ProjectPath\components\PersistentVoiceProvider.tsx" -Force
Copy-Item "$PSScriptRoot\LanguageSelector.tsx" "$ProjectPath\components\LanguageSelector.tsx" -Force
Copy-Item "$PSScriptRoot\VoiceRoom.tsx" "$ProjectPath\features\community\components\VoiceRoom.tsx" -Force
$lp="$ProjectPath\app\layout.tsx";$l=Get-Content $lp -Raw
if($l-notmatch"PersistentVoiceProvider"){$l=$l.Replace('import AnnouncementBroadcast from "@/components/AnnouncementBroadcast";','import AnnouncementBroadcast from "@/components/AnnouncementBroadcast";'+"`r`n"+'import { PersistentVoiceProvider } from "@/components/PersistentVoiceProvider";');$l=$l.Replace('        <AutoTranslate />','        <PersistentVoiceProvider>'+"`r`n"+'        <AutoTranslate />');$l=$l.Replace('        <FloatingWhatsApp />','        <FloatingWhatsApp />'+"`r`n"+'        </PersistentVoiceProvider>');Set-Content $lp $l -Encoding UTF8}
$ap="$ProjectPath\components\AnnouncementBroadcast.tsx";$a=Get-Content $ap -Raw;$a=[regex]::Replace($a,'const unlockAudio = \(\) => \{\s*void playAnnouncementSound\(\);\s*\};','const unlockAudio = () => { const context = announcementAudioContext; if (context?.state === "suspended") void context.resume(); };');Set-Content $ap $a -Encoding UTF8
$cp="$ProjectPath\app\globals.css";$c=Get-Content $cp -Raw;if($c-notmatch"HASWOLF V6 Sprint UI \+ persistent voice"){$c+="`r`n"+(Get-Content "$PSScriptRoot\v6-sprint12-voice.css" -Raw);Set-Content $cp $c -Encoding UTF8}
Write-Host "Paket uygulandi. Yedek: $backup" -ForegroundColor Green
