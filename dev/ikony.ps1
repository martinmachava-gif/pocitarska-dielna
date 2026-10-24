# Vygeneruje PNG ikony (192, 512, 180 pre iPhone) zhodné s icons/icon.svg.
# Spustenie: powershell -ExecutionPolicy Bypass -File dev/ikony.ps1
Add-Type -AssemblyName System.Drawing
$out = Join-Path $PSScriptRoot '..\icons'

function New-Icon([int]$size, [string]$file, [bool]$rounded) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.Color]::Transparent)
  $k = $size / 512.0
  $yellow = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 255, 194, 26))
  $ink = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 35, 48, 56))

  if ($rounded) {
    $r = 112 * $k * 2
    $p = New-Object System.Drawing.Drawing2D.GraphicsPath
    $p.AddArc(0, 0, $r, $r, 180, 90)
    $p.AddArc($size - $r, 0, $r, $r, 270, 90)
    $p.AddArc($size - $r, $size - $r, $r, $r, 0, 90)
    $p.AddArc(0, $size - $r, $r, $r, 90, 90)
    $p.CloseFigure()
    $g.FillPath($yellow, $p)
  } else {
    $g.FillRectangle($yellow, 0, 0, $size, $size)
  }

  $c = 256 * $k
  # zuby ozubeného kolesa
  for ($i = 0; $i -lt 10; $i++) {
    $st = $g.Save()
    $g.TranslateTransform($c, $c)
    $g.RotateTransform($i * 36 + 27)
    $g.FillRectangle($ink, [float](-23.5 * $k), [float](-182 * $k), [float](47 * $k), [float](64 * $k))
    $g.Restore($st)
  }
  $g.FillEllipse($ink, [float]($c - 138 * $k), [float]($c - 138 * $k), [float](276 * $k), [float](276 * $k))
  # plus
  $g.FillRectangle($yellow, [float]($c - 22 * $k), [float]($c - 78 * $k), [float](44 * $k), [float](156 * $k))
  $g.FillRectangle($yellow, [float]($c - 78 * $k), [float]($c - 22 * $k), [float](156 * $k), [float](44 * $k))

  $bmp.Save((Join-Path $out $file), [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
}

New-Icon 192 'icon-192.png' $true
New-Icon 512 'icon-512.png' $true
New-Icon 512 'icon-maskable.png' $false
New-Icon 180 'apple-touch-icon.png' $false
'hotovo'
