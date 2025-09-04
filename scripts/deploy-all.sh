#!/bin/bash

# FlowSonat 완전 배포 스크립트
# 버전 증가 -> 빌드 -> S3 업로드 -> 버전 정보 생성/업로드 -> CloudFront 캐시 무효화
# 사용법: ./scripts/deploy-all.sh [patch|minor|major] [platform]

set -e

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

# 파라미터 설정
VERSION_TYPE=${1:-patch}
PLATFORM=${2:-all}

# 유효한 버전 타입인지 확인
if [[ ! "$VERSION_TYPE" =~ ^(patch|minor|major)$ ]]; then
    log_error "Invalid version type. Use: patch, minor, or major"
    echo "Usage: ./scripts/deploy-all.sh [patch|minor|major] [platform]"
    exit 1
fi

# .env.deploy 파일 로드
if [ -f ".env.deploy" ]; then
    log_info "Loading deployment environment variables..."
    export $(cat .env.deploy | grep -v '^#' | xargs)
fi

# 환경 변수 확인
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    log_error "AWS credentials not found. Please set up your AWS credentials first."
    exit 1
fi

if [ -z "$S3_BUCKET_NAME" ]; then
    export S3_BUCKET_NAME=flowsonat-release
fi

if [ -z "$AWS_REGION" ]; then
    export AWS_REGION=us-east-1
fi

log_info "=== FlowSonat Complete Deployment ==="
log_info "Version bump: $VERSION_TYPE"
log_info "Platform: $PLATFORM"

# 1. 버전 증가
log_info "Step 1: Bumping version..."
CURRENT_VERSION=$(node -p "require('./package.json').version")
log_info "Current version: $CURRENT_VERSION"

NEW_VERSION=$(npm version $VERSION_TYPE --no-git-tag-version)
log_success "New version: $NEW_VERSION"

# Git에 변경사항 커밋
if git status --porcelain | grep -q "package.json"; then
    log_info "Committing version bump to git..."
    git add package.json package-lock.json
    git commit -m "chore: bump version to $NEW_VERSION"
    git tag "v$NEW_VERSION"
    log_success "Version $NEW_VERSION committed and tagged"
else
    log_warning "No changes to commit"
fi

# 2. Electron 앱 빌드
log_info "Step 2: Building Electron app..."
case $PLATFORM in
    "all")
        log_info "Building for all platforms..."
        dotenv -e .env.deploy -- npm run build:all
        ;;
    "mac")
        log_info "Building for macOS with code signing and notarization..."
        npm run build:mac:env
        ;;
    "win")
        log_info "Building for Windows..."
        dotenv -e .env.deploy -- npm run build:win
        ;;
    "linux")
        log_info "Building for Linux..."
        dotenv -e .env.deploy -- npm run build:linux
        ;;
    *)
        log_error "Unknown platform: $PLATFORM"
        log_info "Available platforms: all, mac, win, linux"
        exit 1
        ;;
esac

# 3. S3에 빌드 파일 업로드 (현재 버전만)
log_info "Step 3: Uploading build files to S3..."
UPLOAD_VERSION=$(echo $NEW_VERSION | sed 's/^v//')

# release/{VERSION}/ 폴더에서 배포 파일만 업로드
if [ -d "release/$UPLOAD_VERSION" ]; then
    aws s3 cp release/$UPLOAD_VERSION/ s3://$S3_BUCKET_NAME/$UPLOAD_VERSION/ \
        --recursive \
        --exclude "*" \
        --include "*.zip" \
        --include "*.dmg" \
        --include "*.exe" \
        --include "*.deb" \
        --cache-control "max-age=31536000,public"
    
    log_success "Version $UPLOAD_VERSION files uploaded to S3"
else
    log_error "Build folder release/$UPLOAD_VERSION not found"
    exit 1
fi

# 4. 버전 정보 생성 및 업로드
log_info "Step 4: Generating and uploading version info..."

# 버전 정보 가져오기
CURRENT_VERSION=$(node -p "require('./package.json').version")
PRODUCT_NAME=$(node -p "require('./package.json').productName || 'FlowSonat'")
BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
GIT_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
GIT_BRANCH=$(git branch --show-current 2>/dev/null || echo "main")

# 플랫폼별 빌드 정보 생성
generate_platform_info() {
    local platform=$1
    local arch=$2
    local extension=$3
    
    local filename="${PRODUCT_NAME}-${platform}-${arch}-${CURRENT_VERSION}.${extension}"
    
    # Use CloudFront domain if available, otherwise fall back to S3 URL
    local base_url
    if [ -n "$CLOUDFRONT_DOMAIN" ]; then
        base_url="https://$CLOUDFRONT_DOMAIN"
    else
        base_url="https://$S3_BUCKET_NAME.s3.$AWS_REGION.amazonaws.com"
    fi
    
    cat << EOF
    {
      "platform": "$platform",
      "arch": "$arch",
      "version": "$CURRENT_VERSION",
      "filename": "$filename",
      "url": "$base_url/$CURRENT_VERSION/$filename",
      "size": 0,
      "checksum": "",
      "buildTime": "$BUILD_TIME"
    }
EOF
}

# 메인 버전 정보 JSON 생성
cat > version-info.json << EOF
{
  "productName": "$PRODUCT_NAME",
  "currentVersion": "$CURRENT_VERSION", 
  "buildTime": "$BUILD_TIME",
  "gitCommit": "$GIT_COMMIT",
  "gitBranch": "$GIT_BRANCH",
  "downloads": [
$(generate_platform_info "Mac" "x64" "zip"),
$(generate_platform_info "Mac" "arm64" "zip"),
$(generate_platform_info "Mac" "x64" "dmg"),
$(generate_platform_info "Mac" "arm64" "dmg"),
$(generate_platform_info "Windows" "x64" "exe"),
$(generate_platform_info "Windows" "ia32" "exe"),
$(generate_platform_info "Linux" "x64" "deb"),
$(generate_platform_info "Linux" "arm64" "deb")
  ],
  "updateNotes": "Bug fixes and improvements",
  "minSupportedVersion": "0.1.0",
  "forceUpdate": false
}
EOF

log_success "Version info generated: version-info.json"

# S3에 버전 정보 업로드
aws s3 cp version-info.json s3://$S3_BUCKET_NAME/version-info.json \
    --cache-control "no-cache,no-store,must-revalidate"

log_success "Version info uploaded to S3"

# 5. CloudFront 캐시 무효화
if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    log_info "Step 5: Invalidating CloudFront cache..."
    aws cloudfront create-invalidation \
        --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
        --paths "/version-info.json" > /dev/null
    log_success "CloudFront cache invalidated"
else
    log_warning "CloudFront distribution ID not found. Skipping cache invalidation."
fi

# 완료
log_success "=== Deployment completed successfully! ==="
if [ -n "$CLOUDFRONT_DOMAIN" ]; then
    log_info "App downloads: https://$CLOUDFRONT_DOMAIN/"
    log_info "Version info: https://$CLOUDFRONT_DOMAIN/version-info.json"
else
    log_info "App downloads: https://$S3_BUCKET_NAME.s3.$AWS_REGION.amazonaws.com/"
    log_info "Version info: https://$S3_BUCKET_NAME.s3.$AWS_REGION.amazonaws.com/version-info.json"
fi
log_info "New version: $NEW_VERSION"