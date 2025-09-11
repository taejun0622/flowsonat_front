#!/bin/bash

# Test script to verify update server accessibility
# This script checks if the update files are accessible from CloudFront

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

# .env.deploy 파일 로드
if [ -f ".env.deploy" ]; then
    export $(cat .env.deploy | grep -v '^#' | xargs)
fi

# CloudFront 도메인 설정
CLOUDFRONT_DOMAIN=${CLOUDFRONT_DOMAIN:-"d3hlgb8urc94dl.cloudfront.net"}
BASE_URL="https://$CLOUDFRONT_DOMAIN"

log_info "Testing update server accessibility..."
log_info "Base URL: $BASE_URL"

# 테스트할 파일들
declare -a FILES=(
    "latest-mac.yml"
    "latest.yml"
    "latest-mac.json"
    "latest.json"
)

# 각 파일에 대해 접근성 테스트
for file in "${FILES[@]}"; do
    url="$BASE_URL/$file"
    log_info "Testing: $url"
    
    # HTTP 상태 코드 확인
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
    
    if [ "$status_code" = "200" ]; then
        log_success "✅ $file is accessible (HTTP $status_code)"
        
        # 파일 내용 일부 출력
        echo "Content preview:"
        curl -s "$url" | head -10 | sed 's/^/  /'
        echo ""
    elif [ "$status_code" = "403" ]; then
        log_error "❌ $file access denied (HTTP $status_code)"
    elif [ "$status_code" = "404" ]; then
        log_warning "⚠️  $file not found (HTTP $status_code)"
    else
        log_error "❌ $file failed with HTTP $status_code"
    fi
done

# 버전 정보 파일도 테스트
log_info "Testing version-info.json..."
version_url="$BASE_URL/version-info.json"
status_code=$(curl -s -o /dev/null -w "%{http_code}" "$version_url" || echo "000")

if [ "$status_code" = "200" ]; then
    log_success "✅ version-info.json is accessible (HTTP $status_code)"
    echo "Content preview:"
    curl -s "$version_url" | jq '.' 2>/dev/null || curl -s "$version_url" | head -10 | sed 's/^/  /'
    echo ""
else
    log_error "❌ version-info.json failed with HTTP $status_code"
fi

# CloudFront 캐시 상태 확인
log_info "Testing CloudFront cache headers..."
test_url="$BASE_URL/latest-mac.yml"
headers=$(curl -s -I "$test_url" 2>/dev/null || echo "")

if echo "$headers" | grep -q "x-cache"; then
    cache_status=$(echo "$headers" | grep "x-cache" | cut -d: -f2 | tr -d ' \r\n')
    log_info "CloudFront cache status: $cache_status"
fi

if echo "$headers" | grep -q "x-amz-cf-id"; then
    log_success "✅ CloudFront is serving the request"
else
    log_warning "⚠️  CloudFront headers not found - may be direct S3 access"
fi

echo ""
log_info "Test completed. If you see 403 errors, the files may not be published yet."
log_info "Run 'npm run publish:mac' to publish the update files."
