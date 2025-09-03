# Build Icons

이 폴더에는 각 플랫폼별 빌드에 필요한 아이콘 파일들이 들어갑니다.

## 필요한 아이콘 파일

### macOS
- `icon.icns` - macOS 앱 아이콘 (1024x1024 권장)
- `icon.png` - PNG 버전 (1024x1024 권장)

### Windows
- `icon.ico` - Windows 앱 아이콘 (256x256 권장)
- `icon.png` - PNG 버전 (256x256 권장)

### Linux
- `icon.png` - Linux 앱 아이콘 (512x512 권장)

## 아이콘 생성 방법

### macOS (.icns)
```bash
# PNG를 ICNS로 변환
iconutil -c icns icon.iconset/
```

### Windows (.ico)
```bash
# ImageMagick 사용
convert icon.png -resize 256x256 icon.ico
```

### Linux (.png)
```bash
# PNG 파일을 512x512 크기로 리사이즈
convert icon.png -resize 512x512 icon.png
```

## 권장 사항
- 모든 아이콘은 정사각형 비율로 제작
- 투명 배경 사용 권장
- 고해상도 디스플레이를 고려하여 2x 크기로 제작
