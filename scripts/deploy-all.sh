#!/bin/bash

# FlowSonat 완전 배포 스크립트
# 버전 증가 -> 빌드 -> S3 업로드 -> 버전 정보 생성/업로드 -> CloudFront 캐시 무효화
# 사용법: ./scripts/deploy-all.sh [patch|minor|major] [platform] [--min-supported VERSION]

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
MIN_SUPPORTED_VERSION=""

# 매개변수 파싱
shift 2 2>/dev/null || true  # 첫 두 매개변수 제거
while [[ $# -gt 0 ]]; do
    case $1 in
        --min-supported)
            MIN_SUPPORTED_VERSION="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [patch|minor|major] [platform] [--min-supported VERSION]"
            echo ""
            echo "Arguments:"
            echo "  VERSION_TYPE           Version bump type: patch, minor, or major (default: patch)"
            echo "  PLATFORM              Platform to build: mac, win, linux, or all (default: all)"
            echo ""
            echo "Options:"
            echo "  --min-supported VERSION  Set minimum supported version (e.g., 0.0.15)"
            echo "  --help, -h              Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 patch all                                    # Patch version, all platforms, use new version as min supported"
            echo "  $0 minor mac --min-supported 0.0.15            # Minor version, Mac only, specific min supported"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# 유효한 버전 타입인지 확인
if [[ ! "$VERSION_TYPE" =~ ^(patch|minor|major)$ ]]; then
    log_error "Invalid version type. Use: patch, minor, or major"
    echo "Usage: ./scripts/deploy-all.sh [patch|minor|major] [platform] [--min-supported VERSION]"
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

# 2. Electron 앱 빌드 및 퍼블리시
log_info "Step 2: Building and publishing Electron app..."
case $PLATFORM in
    "all")
        log_info "Building for all platforms with code signing..."
        dotenv -f .env.deploy run npm run build:all
        ;;
    "mac")
        log_info "Building for macOS with code signing and notarization..."
        npm run build:mac
        ;;
    "win")
        log_info "Building for Windows with code signing..."
        dotenv -f .env.deploy run npm run build:win
        ;;
    "linux")
        log_info "Building for Linux..."
        dotenv -f .env.deploy run npm run build:linux
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

# Fix naming inconsistency: create x64 symlinks for amd64/x86_64 files
log_info "Creating x64 named files for consistent naming..."
if [ -d "release/$UPLOAD_VERSION" ]; then
    cd "release/$UPLOAD_VERSION"

    # Create x64 version of amd64 deb file if it exists
    if [ -f "FlowSonat-Linux-amd64-$UPLOAD_VERSION.deb" ]; then
        cp "FlowSonat-Linux-amd64-$UPLOAD_VERSION.deb" "FlowSonat-Linux-x64-$UPLOAD_VERSION.deb"
        log_info "Created FlowSonat-Linux-x64-$UPLOAD_VERSION.deb"
    fi

    # Create x64 version of x86_64 AppImage file if it exists
    if [ -f "FlowSonat-Linux-x86_64-$UPLOAD_VERSION.AppImage" ]; then
        cp "FlowSonat-Linux-x86_64-$UPLOAD_VERSION.AppImage" "FlowSonat-Linux-x64-$UPLOAD_VERSION.AppImage"
        log_info "Created FlowSonat-Linux-x64-$UPLOAD_VERSION.AppImage"
    fi

    cd ../..
fi

# release/{VERSION}/ 폴더에서 배포 파일만 업로드
if [ -d "release/$UPLOAD_VERSION" ]; then
    aws s3 cp release/$UPLOAD_VERSION/ s3://$S3_BUCKET_NAME/$UPLOAD_VERSION/ \
        --recursive \
        --exclude "*" \
        --include "*.zip" \
        --include "*.exe" \
        --include "*.deb" \
        --cache-control "max-age=31536000,public"
    
    log_success "Version $UPLOAD_VERSION files uploaded to S3"
    
    # 업데이트 메타데이터 파일들 수정 및 업로드 (electron-updater용)
    log_info "Updating metadata files with version paths..."
    
    # 각 metadata 파일의 URL을 버전 경로를 포함하도록 수정
    for yml_file in latest-mac.yml latest.yml latest-linux.yml latest-linux-arm.yml latest-linux-arm64.yml; do
        if [ -f "release/$UPLOAD_VERSION/$yml_file" ]; then
            # 임시 파일 생성하여 URL에 버전 경로 추가
            sed "s|url: |url: $UPLOAD_VERSION/|g" "release/$UPLOAD_VERSION/$yml_file" > "/tmp/$yml_file"
            # path 필드도 버전 경로 포함하도록 수정
            sed -i "" "s|^path: |path: $UPLOAD_VERSION/|g" "/tmp/$yml_file"
            log_info "Updated $yml_file with version paths"
        fi
    done
    
    log_info "Uploading update metadata files..."
    aws s3 cp /tmp/latest-mac.yml s3://$S3_BUCKET_NAME/latest-mac.yml --cache-control "no-cache,no-store,must-revalidate" 2>/dev/null || log_warning "latest-mac.yml not found"
    aws s3 cp /tmp/latest.yml s3://$S3_BUCKET_NAME/latest.yml --cache-control "no-cache,no-store,must-revalidate" 2>/dev/null || log_warning "latest.yml not found"
    aws s3 cp /tmp/latest-linux.yml s3://$S3_BUCKET_NAME/latest-linux.yml --cache-control "no-cache,no-store,must-revalidate" 2>/dev/null || log_warning "latest-linux.yml not found"
    aws s3 cp /tmp/latest-linux-arm.yml s3://$S3_BUCKET_NAME/latest-linux-arm.yml --cache-control "no-cache,no-store,must-revalidate" 2>/dev/null || log_warning "latest-linux-arm.yml not found"
    aws s3 cp /tmp/latest-linux-arm64.yml s3://$S3_BUCKET_NAME/latest-linux-arm64.yml --cache-control "no-cache,no-store,must-revalidate" 2>/dev/null || log_warning "latest-linux-arm64.yml not found"
    
    # 임시 파일 정리
    rm -f /tmp/latest-*.yml
    log_success "Update metadata files uploaded to S3"
else
    log_error "Build folder release/$UPLOAD_VERSION not found"
    exit 1
fi

# 4. 버전 정보 생성 및 업로드
log_info "Step 4: Generating and uploading version info..."

# 버전 정보 생성 및 업로드
log_info "Generating version info..."

# generate-version-info.sh 스크립트 호출
if [ -n "$MIN_SUPPORTED_VERSION" ]; then
    ./scripts/generate-version-info.sh --min-supported "$MIN_SUPPORTED_VERSION"
else
    ./scripts/generate-version-info.sh
fi

# 5. CloudFront 캐시 무효화
if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    log_info "Step 5: Invalidating CloudFront cache..."
    
    # 버전별 파일들과 업데이트 메타데이터 파일들 무효화
    aws cloudfront create-invalidation \
        --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
        --paths "/$UPLOAD_VERSION/*" "/latest-mac.yml" "/latest.yml" "/latest-linux.yml" "/latest-linux-arm.yml" "/latest-linux-arm64.yml" "/version-info.json" > /dev/null
    
    log_success "CloudFront cache invalidated for version $UPLOAD_VERSION and update metadata files"
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