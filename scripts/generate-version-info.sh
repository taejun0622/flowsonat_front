#!/bin/bash

# FlowSonat 버전 정보 생성 스크립트
# 자동 업데이트를 위한 버전 정보 JSON 생성
# 사용법: ./scripts/generate-version-info.sh [--min-supported VERSION]

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

log_error() {
    echo -e "\033[0;31m[ERROR]\033[0m $1"
}

# 매개변수 파싱
MIN_SUPPORTED_VERSION=""
while [[ $# -gt 0 ]]; do
    case $1 in
        --min-supported)
            MIN_SUPPORTED_VERSION="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [--min-supported VERSION]"
            echo ""
            echo "Options:"
            echo "  --min-supported VERSION  Set minimum supported version (e.g., 0.0.15)"
            echo "  --help, -h              Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                                    # Use current version as min supported version"
            echo "  $0 --min-supported 0.0.15            # Set specific min supported version"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# .env.deploy 파일이 있으면 로드
if [ -f ".env.deploy" ]; then
    export $(cat .env.deploy | grep -v '^#' | xargs)
fi

# 현재 버전 정보 가져오기
CURRENT_VERSION=$(node -p "require('./package.json').version")
PRODUCT_NAME=$(node -p "require('./package.json').productName || 'FlowSonat'")

# 최소 지원 버전 설정
if [ -z "$MIN_SUPPORTED_VERSION" ]; then
    # 매개변수가 제공되지 않으면 현재 버전을 최소 지원 버전으로 설정
    MIN_SUPPORTED_VERSION="$CURRENT_VERSION"
    log_info "Using current version as min supported version: $MIN_SUPPORTED_VERSION"
else
    log_info "Using specified min supported version: $MIN_SUPPORTED_VERSION"
fi

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
  "minSupportedVersion": "$MIN_SUPPORTED_VERSION",
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
