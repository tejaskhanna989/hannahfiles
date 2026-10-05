function hf() {
    param (
        [string[]]$Params
    )
    $hf_location = [Environment]::GetFolderPath("LocalApplicationData") + "\Programs\hannahfiles\hannahfiles.exe"
    $HF_LAST_DIR_PATH = [Environment]::GetFolderPath("LocalApplicationData") + "\hannahfiles\lastdir"

    & $hf_location @Params

    if (Test-Path $HF_LAST_DIR_PATH) {
        $HF_LAST_DIR = Get-Content -Path $HF_LAST_DIR_PATH
        Invoke-Expression $HF_LAST_DIR
        Remove-Item -Force $HF_LAST_DIR_PATH
    }
}
