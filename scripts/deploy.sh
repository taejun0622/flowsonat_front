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
    
    # 로드된 환경 변수 디버그 출력
    log_info "Loaded environment variables from .env.deploy:"
    echo "========================"
    while IFS= read -r line; do
        if [[ $line =~ ^[^#].+=.+ ]]; then
            var_name=$(echo $line | cut -d'=' -f1)
            if [[ $var_name == *"KEY"* ]] || [[ $var_name == *"SECRET"* ]] || [[ $var_name == *"PASSWORD"* ]]; then
                echo "  $var_name=[REDACTED]"
            else
                echo "  $line"
            fi
        fi
    done < .env.deploy
    echo "========================"
else
    log_warning ".env.deploy file not found - some environment variables may not be set"
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
    export AWS_REGION=us-east-1
fi

# 버전 정보 표시
CURRENT_VERSION=$(node -p "require('./package.json').version")
log_info "Building and deploying FlowSonat app v$CURRENT_VERSION using AWS credentials"
log_info "Target platform: $PLATFORM"

# 현재 활성화된 모든 환경 변수 검증
log_info "Environment Variables Validation:"
echo "================================"
echo "🔍 Build Environment:"
echo "  NODE_ENV: ${NODE_ENV:-'not set'}"
echo "  CURRENT_VERSION: $CURRENT_VERSION"
echo "  PWD: $PWD"

echo ""
echo "🔍 AWS Configuration:"
echo "  AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID:+[SET]} ${AWS_ACCESS_KEY_ID:-[NOT SET]}"
echo "  AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY:+[SET]} ${AWS_SECRET_ACCESS_KEY:-[NOT SET]}"
echo "  S3_BUCKET_NAME: ${S3_BUCKET_NAME:-[NOT SET]}"
echo "  AWS_REGION: ${AWS_REGION:-[NOT SET]}"
echo "  CLOUDFRONT_DOMAIN: ${CLOUDFRONT_DOMAIN:-[NOT SET]}"

echo ""
echo "🔍 Application Environment (will be embedded in build):"
# Check for .env files and their contents
for env_file in ".env.deploy" ".env.production" ".env.local" ".env"; do
    if [ -f "$env_file" ]; then
        echo "  📄 Found: $env_file"
        while IFS= read -r line; do
            if [[ $line =~ ^VITE_.+=.+ ]] && [[ ! $line =~ ^# ]]; then
                var_name=$(echo $line | cut -d'=' -f1)
                var_value=$(echo $line | cut -d'=' -f2-)
                if [[ $var_name == *"KEY"* ]] || [[ $var_name == *"SECRET"* ]]; then
                    echo "    $var_name=[REDACTED]"
                else
                    echo "    $var_name=$var_value"
                fi
            fi
        done < "$env_file"
    else
        echo "  📄 Missing: $env_file"
    fi
done
echo "================================"

# 플랫폼별 Electron 빌드 및 퍼블리시
case $PLATFORM in
    "all")
        log_info "Building and publishing for all platforms..."
        npm run publish:all
        ;;
    "mac")
        log_info "Building and publishing for macOS with code signing and notarization..."
        npm run publish:mac
        ;;
    "win")
        log_info "Building and publishing for Windows..."
        npm run publish:win
        ;;
    "linux")
        log_info "Building and publishing for Linux..."
        npm run publish:linux
        ;;
    *)
        log_error "Unknown platform: $PLATFORM"
        log_info "Available platforms: all, mac, win, linux"
        exit 1
        ;;
esac

# 빌드 후 환경 변수 검증
log_info "Verifying environment variables in build..."
if node scripts/verify-build-env.js; then
    log_success "Build environment verification passed"
else
    log_error "Build environment verification failed"
    log_error "Build may have incorrect environment variables embedded"
    read -p "Continue with deployment anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_error "Deployment aborted due to environment verification failure"
        exit 1
    fi
fi

       # Electron-builder가 자동으로 S3에 업로드하므로 수동 업로드는 생략
       log_info "Electron-builder automatically uploaded files to S3 with publish=always"
       
       # Update metadata files 수동 업로드 (electron-builder가 완전하지 않을 수 있음)
       log_info "Uploading update metadata files..."
       aws s3 cp release/$CURRENT_VERSION/latest-mac.yml s3://$S3_BUCKET_NAME/latest-mac.yml --cache-control "no-cache,no-store,must-revalidate" --region $AWS_REGION
       aws s3 cp release/$CURRENT_VERSION/latest.yml s3://$S3_BUCKET_NAME/latest.yml --cache-control "no-cache,no-store,must-revalidate" --region $AWS_REGION
       aws s3 cp release/$CURRENT_VERSION/latest-linux.yml s3://$S3_BUCKET_NAME/latest-linux.yml --cache-control "no-cache,no-store,must-revalidate" --region $AWS_REGION
       aws s3 cp release/$CURRENT_VERSION/latest-linux-arm.yml s3://$S3_BUCKET_NAME/latest-linux-arm.yml --cache-control "no-cache,no-store,must-revalidate" --region $AWS_REGION
       aws s3 cp release/$CURRENT_VERSION/latest-linux-arm64.yml s3://$S3_BUCKET_NAME/latest-linux-arm64.yml --cache-control "no-cache,no-store,must-revalidate" --region $AWS_REGION
       log_success "Update metadata files uploaded to S3"

# 버전 정보 업데이트 및 업로드
log_info "Updating version information..."
./scripts/generate-version-info.sh



log_success "Deployment completed successfully!"
if [ -n "$CLOUDFRONT_DOMAIN" ]; then
    log_info "App downloads: https://$CLOUDFRONT_DOMAIN/"
else
    log_info "App downloads: https://$S3_BUCKET_NAME.s3.$AWS_REGION.amazonaws.com/"
fi
