#!/bin/bash
# Convierte y redimensiona el set curado de imágenes fuente (TIFF/PNG de alta
# resolución) a JPG optimizado para web usando `sips` (nativo de macOS).
# Se corre una sola vez; solo hace falta repetir si cambian las imágenes fuente.
set -euo pipefail

SRC="/Users/mariaardilad/Documents/2_MARCAS:DISEÑO/NAUNO"
OUT="$(cd "$(dirname "$0")/.." && pwd)/public/images"
mkdir -p "$OUT"

convert_jpg() {
  local src="$1" dest="$2" maxdim="$3" quality="$4"
  sips -s format jpeg -s formatOptions "$quality" -Z "$maxdim" "$src" --out "$OUT/$dest" >/dev/null
  echo "✓ $dest"
}

convert_png() {
  local src="$1" dest="$2" maxdim="$3"
  sips -Z "$maxdim" "$src" --out "$OUT/$dest" >/dev/null
  echo "✓ $dest"
}

echo "Hero"
convert_jpg "$SRC/04_rendersMJT_el-nauno-v5_2023-09-04_2025/Entrega final/MARINA 1.tif" "hero-marina.jpg" 2400 80

echo "Quiénes somos"
convert_jpg "$SRC/01_Imagenes ppt /AEREO completo.png" "aereo-completo.jpg" 2000 80

echo "Etapas"
convert_jpg "$SRC/04_rendersMJT_el-nauno-v5_2023-09-04_2025/Entrega final/CASA 2.tif" "etapa-villas.jpg" 1600 80
convert_jpg "$SRC/01_Imagenes ppt /HOTELERIA.png" "etapa-hotel.jpg" 1600 80
convert_jpg "$SRC/01_Imagenes ppt /Ref Terrazas.jpg" "etapa-terrazas.jpg" 1600 80
convert_jpg "$SRC/04_rendersMJT_el-nauno-v5_2023-09-04_2025/Entrega final/KIOSKO 1 (CONLUZ).tif" "etapa-comercial.jpg" 1600 80

echo "Ubicación"
convert_jpg "$SRC/01_Imagenes ppt /Mapa de ubicacion .png" "mapa-ubicacion.jpg" 2000 85
convert_jpg "$SRC/01_Imagenes ppt /ENTORNO PANORAMICA 1.png" "entorno-panoramica.jpg" 2000 80

echo "Galería"
convert_jpg "$SRC/04_rendersMJT_el-nauno-v5_2023-09-04_2025/Entrega final/CASA 3 (ATARDECER).tif" "galeria-casa-atardecer.jpg" 1600 80
convert_jpg "$SRC/04_rendersMJT_el-nauno-v5_2023-09-04_2025/Entrega final/KIOSKO 2.tif" "galeria-kiosko.jpg" 1600 80
convert_jpg "$SRC/01_Imagenes ppt /Ref sendero 1.jpg" "galeria-sendero-1.jpg" 1600 80
convert_jpg "$SRC/01_Imagenes ppt /Ref sendero 2.jpg" "galeria-sendero-2.jpg" 1600 80
convert_jpg "$SRC/01_Imagenes ppt /Ref nicho principal.jpg" "galeria-nicho.jpg" 1600 80
convert_jpg "$SRC/01_Imagenes ppt /img nauticos.jpg" "galeria-nauticos.jpg" 1600 80
convert_jpg "$SRC/01_Imagenes ppt /VISTA FRENTE A MARINA.png" "galeria-vista-marina.jpg" 1600 80
convert_jpg "$SRC/04_rendersMJT_el-nauno-v5_2023-09-04_2025/Entrega final/CASA 1.tif" "galeria-casa-1.jpg" 1600 80

echo "Logo"
convert_png "$SRC/LOGO EL NAUNO/LOGO ARENA .png" "logo-arena.png" 800
convert_png "$SRC/LOGO EL NAUNO/LOGO NEGRO.png" "logo-negro-icon.png" 400

echo "Listo. Imágenes en $OUT"
