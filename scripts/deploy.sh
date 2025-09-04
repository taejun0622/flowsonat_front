#!/bin/bash

# FlowSonat 앱 배포 스크립트
# 사용법: ./scripts/deploy.sh [platform]

set -e

# 기본값 설정
PLATFORM=${1:-all}

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# .env.deploy 파일 로드
if [ -f ".env.deploy" ]; then
    log_info "Loading deployment environment variables..."
    export $(cat .env.deploy | grep -v '^#' | xargs)
fi

# 환경 변수 확인
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    log_error "AWS credentials not found. Please run ./scripts/setup-env.sh first."
    exit 1
fi

if [ -z "$S3_BUCKET_NAME" ]; then
    export S3_BUCKET_NAME=flowsonat-release
fi

if [ -z "$AWS_REGION" ]; then
    export AWS_REGION=ap-northeast-2
fi

# 버전 정보 표시
CURRENT_VERSION=$(node -p "require('./package.json').version")
log_info "Building and deploying FlowSonat app v$CURRENT_VERSION using AWS credentials"
log_info "Target platform: $PLATFORM"

# 플랫폼별 Electron 빌드
case $PLATFORM in
    "all")
        log_info "Building for all platforms..."
        npm run build:all
        ;;
    "mac")
        log_info "Building for macOS with code signing and notarization..."
        npm run build:mac:env
        ;;
    "win")
        log_info "Building for Windows..."
        npm run build:win
        ;;
    "linux")
        log_info "Building for Linux..."
        npm run build:linux
        ;;
    *)
        log_error "Unknown platform: $PLATFORM"
        log_info "Available platforms: all, mac, win, linux"
        exit 1
        ;;
esac

       # Electron 앱 빌드 파일 업로드 (필요한 파일만)
       log_info "Uploading Electron app builds to S3..."
       
       # 필요한 파일들만 선택적으로 업로드
       aws s3 cp release/ s3://$S3_BUCKET_NAME/ \
           --recursive \
           --exclude "*" \
           --include "*.zip" \
           --include "*.dmg" \
           --include "*.exe" \
           --include "*.deb" \
           --cache-control "max-age=31536000,public"
       
       log_info "Uploaded only distribution files (zip, dmg, exe, deb)"

# 버전 정보 업데이트 및 업로드
log_info "Updating version information..."
./scripts/generate-version-info.sh



log_success "Deployment completed successfully!"
if [ -n "$CLOUDFRONT_DOMAIN" ]; then
    log_info "App downloads: https://$CLOUDFRONT_DOMAIN/"
else
    log_info "App downloads: https://$S3_BUCKET_NAME.s3.$AWS_REGION.amazonaws.com/"
fi
