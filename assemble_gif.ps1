<#
Assemble PNG frames into an optimized GIF using ffmpeg.

Place this script in the project root (same folder as the `frames` directory).
Usage (PowerShell):
    .\assemble_gif.ps1
Optional args:
    -Framerate 30 -Scale 800 -Out out.gif
#>

param(
    [int]$Framerate = 30,
    [int]$Scale = 800,
    [string]$Out = "out.gif"
)

function Check-FFmpeg {
    try {
        & ffmpeg -version > $null 2>&1
        return $true
    } catch {
        return $false
    }
}

if(-not (Check-FFmpeg)){
    Write-Error "ffmpeg not found in PATH. Install ffmpeg and re-run."
    exit 1
}

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$framesPattern = Join-Path $root 'frames\frame%04d.png'
$palette = Join-Path $root 'palette.png'
$outPath = Join-Path $root $Out

if(-not (Test-Path (Join-Path $root 'frames'))){
    Write-Error "frames directory not found. Run the capture step first (create frames/frame0000.png ...)."
    exit 1
}

Write-Host "Generating palette..."
& ffmpeg -y -framerate $Framerate -i $framesPattern -vf "scale=${Scale}:-1:flags=lanczos,palettegen" $palette

Write-Host "Building GIF..."
& ffmpeg -y -framerate $Framerate -i $framesPattern -i $palette -lavfi "scale=${Scale}:-1:flags=lanczos [x]; [x][1:v] paletteuse" -loop 0 $outPath

if(Test-Path $outPath){
    Write-Host "Done: $outPath"
} else {
    Write-Error "GIF not created. See ffmpeg output above for errors."
}
