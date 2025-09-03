#!/bin/bash

# FlowSonat 버전 정보 생성 스크립트
# 자동 업데이트를 위한 버전 정보 JSON 생성

set -e

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# 현재 버전 정보 가져오기
CURRENT_VERSION=$(node -p "require('./package.json').version")
PRODUCT_NAME=$(node -p "require('./package.json').productName || 'FlowSonat'")

# 빌드 시간
BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Git 커밋 정보
GIT_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
GIT_BRANCH=$(git branch --show-current 2>/dev/null || echo "main")

log_info "Generating version info for $PRODUCT_NAME v$CURRENT_VERSION"

# 플랫폼별 빌드 정보 생성
generate_platform_info() {
    local platform=$1
    local arch=$2
    local extension=$3
    
    local filename="${PRODUCT_NAME}-${platform}-${arch}-${CURRENT_VERSION}.${extension}"
    
    cat << EOF
    {
      "platform": "$platform",
      "arch": "$arch",
      "version": "$CURRENT_VERSION",
      "filename": "$filename",
      "url": "https://flowsonat-release.s3.us-east-1.amazonaws.com/$CURRENT_VERSION/$filename",
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

# S3에 업로드 (환경 변수가 설정된 경우)
if [ -n "$S3_BUCKET_NAME" ] && [ -n "$AWS_REGION" ]; then
    log_info "Uploading version info to S3..."
    
    # .env.deploy 파일이 있으면 로드
    if [ -f ".env.deploy" ]; then
        export $(cat .env.deploy | grep -v '^#' | xargs)
    fi
    
    if [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
        aws s3 cp version-info.json s3://$S3_BUCKET_NAME/version-info.json \
            --cache-control "no-cache,no-store,must-revalidate"
        
        log_success "Version info uploaded to S3: s3://$S3_BUCKET_NAME/version-info.json"
    else
        log_info "AWS credentials not found. Skipping S3 upload."
    fi
else
    log_info "S3 configuration not found. Skipping S3 upload."
fi

echo ""
log_info "Version info file created: version-info.json"
log_info "You can now build and deploy your app with: ./scripts/deploy.sh [platform]"
