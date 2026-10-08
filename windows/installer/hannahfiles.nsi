; HannahFiles Windows installer (NSIS). Built on CI after dotnet publish.
; makensis /DAPPDIR=<publish dir> /DOUTFILE=<out exe> installer/hannahfiles.nsi
!include "LogicLib.nsh"
!ifndef APPDIR
  !error "APPDIR not defined"
!endif
!ifndef OUTFILE
  !define OUTFILE "HannahFiles-setup-x64.exe"
!endif

Name "HannahFiles"
OutFile "${OUTFILE}"
InstallDir "$PROGRAMFILES64\HannahFiles"
RequestExecutionLevel admin
Icon "..\src\Files.App\Assets\AppTiles\Dev\Logo.ico"
UninstallIcon "..\src\Files.App\Assets\AppTiles\Dev\Logo.ico"

Section "Install"
  DetailPrint "Installing Windows App Runtime (required)..."
  NSISdl::download "https://aka.ms/windowsappsdk/2.5/latest/windowsappruntimeinstall-x64.exe" "$TEMP\winappruntime.exe"
  Pop $0
  ${If} $0 == "success"
    ExecWait '"$TEMP\winappruntime.exe" --quiet'
  ${EndIf}
  SetOutPath "$INSTDIR"
  File /r "${APPDIR}\*.*"
  SetOutPath "$PICTURES\HannahFiles"
  File "..\..\wallpapers\*.jpg"
  CreateDirectory "$SMPROGRAMS\HannahFiles"
  CreateShortcut "$SMPROGRAMS\HannahFiles\HannahFiles.lnk" "$INSTDIR\Files.exe"
  CreateShortcut "$SMPROGRAMS\HannahFiles\Wallpapers.lnk" "$PICTURES\HannahFiles"
  WriteUninstaller "$INSTDIR\uninstall.exe"
SectionEnd

Section "Uninstall"
  RMDir /r "$INSTDIR"
  RMDir /r "$PICTURES\HannahFiles"
  RMDir "$SMPROGRAMS\HannahFiles"
SectionEnd
