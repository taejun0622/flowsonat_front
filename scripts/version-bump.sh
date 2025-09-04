#!/bin/bash

# FlowSonat 자동 버전 증가 스크립트
# 사용법: ./scripts/version-bump.sh [patch|minor|major] [--min-supported VERSION]

set -e

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# 매개변수 파싱
VERSION_TYPE=""
MIN_SUPPORTED_VERSION=""

while [[ $# -gt 0 ]]; do
    case $1 in
        patch|minor|major)
            VERSION_TYPE="$1"
            shift
            ;;
        --min-supported)
            MIN_SUPPORTED_VERSION="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [patch|minor|major] [--min-supported VERSION]"
            echo ""
            echo "Arguments:"
            echo "  VERSION_TYPE           Version bump type: patch, minor, or major (default: patch)"
            echo ""
            echo "Options:"
            echo "  --min-supported VERSION  Set minimum supported version (e.g., 0.0.15)"
            echo "  --help, -h              Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 patch                                    # Patch version bump, use new version as min supported"
            echo "  $0 minor --min-supported 0.0.15            # Minor version bump, specific min supported"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# 기본값 설정
VERSION_TYPE=${VERSION_TYPE:-patch}

# 유효한 버전 타입인지 확인
if [[ ! "$VERSION_TYPE" =~ ^(patch|minor|major)$ ]]; then
    echo "Error: Invalid version type. Use: patch, minor, or major"
    echo "Usage: ./scripts/version-bump.sh [patch|minor|major] [--min-supported VERSION]"
    exit 1
fi

log_info "Bumping version type: $VERSION_TYPE"

# 현재 버전 가져오기
CURRENT_VERSION=$(node -p "require('./package.json').version")
log_info "Current version: $CURRENT_VERSION"

# 새 버전 생성
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

# 버전 정보 파일 업데이트
log_info "Updating version-info.json..."
if [ -n "$MIN_SUPPORTED_VERSION" ]; then
    ./scripts/generate-version-info.sh --min-supported "$MIN_SUPPORTED_VERSION"
else
    ./scripts/generate-version-info.sh
fi

log_success "Version bumped successfully to $NEW_VERSION"
log_info "Next steps:"
log_info "1. Run: npm run build"
log_info "2. Run: ./scripts/deploy.sh [platform]"
