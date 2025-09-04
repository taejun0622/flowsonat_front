#!/bin/bash

# Environment Variables Debug Script
# Usage: ./scripts/debug-env.sh [mode]

set -e

MODE=${1:-development}

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 ENVIRONMENT VARIABLES DEBUG REPORT${NC}"
echo "========================================"
echo "Timestamp: $(date)"
echo "Mode: $MODE"
echo "PWD: $PWD"
echo ""

# Node.js 환경 변수
echo -e "${YELLOW}📦 Node.js Environment:${NC}"
echo "  Node Version: $(node --version 2>/dev/null || echo 'Not available')"
echo "  NPM Version: $(npm --version 2>/dev/null || echo 'Not available')"
echo "  NODE_ENV: ${NODE_ENV:-'not set'}"
echo ""

# Process 환경 변수 (일부)
echo -e "${YELLOW}⚙️  Process Environment:${NC}"
echo "  USER: ${USER:-'not set'}"
echo "  HOME: ${HOME:-'not set'}"
echo "  SHELL: ${SHELL:-'not set'}"
echo ""

# .env 파일들 존재 확인
echo -e "${YELLOW}📄 Environment Files Status:${NC}"
env_files=(".env" ".env.local" ".env.$MODE" ".env.$MODE.local" ".env.deploy" ".env.production")
for file in "${env_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ✅ $file ($(wc -l < "$file") lines)"
        # 권한 확인
        if [ ! -r "$file" ]; then
            echo -e "    ${RED}⚠️  File exists but is not readable${NC}"
        fi
    else
        echo -e "  ❌ $file (missing)"
    fi
done
echo ""

# VITE 환경 변수들 표시 (from .env files)
echo -e "${YELLOW}🔧 VITE Environment Variables (from files):${NC}"
for file in "${env_files[@]}"; do
    if [ -f "$file" ] && [ -r "$file" ]; then
        echo "  From $file:"
        while IFS= read -r line; do
            if [[ $line =~ ^VITE_.+=.+ ]] && [[ ! $line =~ ^# ]]; then
                var_name=$(echo $line | cut -d'=' -f1)
                var_value=$(echo $line | cut -d'=' -f2-)
                if [[ $var_name == *"KEY"* ]] || [[ $var_name == *"SECRET"* ]] || [[ $var_name == *"STRIPE"* ]]; then
                    echo "    $var_name=[REDACTED]"
                else
                    echo "    $var_name=$var_value"
                fi
            fi
        done < "$file"
    fi
done
echo ""

# Runtime 환경 변수 (실제로 설정된 것들)
echo -e "${YELLOW}🚀 Runtime Environment Variables:${NC}"
echo "  VITE environment variables currently set:"
env | grep "^VITE_" | while IFS= read -r line; do
    var_name=$(echo $line | cut -d'=' -f1)
    if [[ $var_name == *"KEY"* ]] || [[ $var_name == *"SECRET"* ]] || [[ $var_name == *"STRIPE"* ]]; then
        echo "    $var_name=[REDACTED]"
    else
        echo "    $line"
    fi
done
echo ""

# AWS 관련 환경 변수 (배포용)
echo -e "${YELLOW}☁️  AWS Environment (for deployment):${NC}"
aws_vars=("AWS_ACCESS_KEY_ID" "AWS_SECRET_ACCESS_KEY" "AWS_REGION" "S3_BUCKET_NAME" "CLOUDFRONT_DOMAIN")
for var in "${aws_vars[@]}"; do
    if [ ! -z "${!var}" ]; then
        if [[ $var == *"KEY"* ]] || [[ $var == *"SECRET"* ]]; then
            echo "  $var=[SET]"
        else
            echo "  $var=${!var}"
        fi
    else
        echo "  $var=[NOT SET]"
    fi
done
echo ""

# package.json에서 버전 정보
echo -e "${YELLOW}📋 Package Information:${NC}"
if [ -f "package.json" ]; then
    PACKAGE_VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "unable to read")
    PACKAGE_NAME=$(node -p "require('./package.json').name" 2>/dev/null || echo "unable to read")
    echo "  Name: $PACKAGE_NAME"
    echo "  Version: $PACKAGE_VERSION"
else
    echo "  package.json not found"
fi
echo ""

# Vite config 파일 확인
echo -e "${YELLOW}⚡ Vite Configuration:${NC}"
if [ -f "vite.config.ts" ]; then
    echo "  ✅ vite.config.ts found"
    # define 섹션에서 VITE_APP_VERSION 확인
    if grep -q "VITE_APP_VERSION" vite.config.ts; then
        echo "  ✅ VITE_APP_VERSION is defined in vite.config.ts"
    else
        echo "  ⚠️  VITE_APP_VERSION not found in vite.config.ts"
    fi
else
    echo "  ❌ vite.config.ts not found"
fi
echo ""

# 잠재적인 문제 진단
echo -e "${RED}🩺 Potential Issues Diagnosis:${NC}"
issues_found=0

# .env files 충돌 확인
conflicting_files=()
vite_api_urls=()
for file in ".env.production" ".env.local" ".env"; do
    if [ -f "$file" ] && [ -r "$file" ]; then
        api_url=$(grep "^VITE_API_BASE_URL=" "$file" 2>/dev/null | cut -d'=' -f2-)
        if [ ! -z "$api_url" ]; then
            vite_api_urls+=("$file:$api_url")
        fi
    fi
done

if [ ${#vite_api_urls[@]} -gt 1 ]; then
    echo "  ⚠️  Multiple VITE_API_BASE_URL definitions found:"
    for entry in "${vite_api_urls[@]}"; do
        echo "    $entry"
    done
    issues_found=$((issues_found + 1))
fi

# 필수 변수 확인
if [ -z "${VITE_API_BASE_URL:-}" ]; then
    echo "  ⚠️  VITE_API_BASE_URL is not set in environment"
    issues_found=$((issues_found + 1))
fi

if [ $issues_found -eq 0 ]; then
    echo -e "  ${GREEN}✅ No obvious issues detected${NC}"
fi

echo ""
echo -e "${BLUE}Debug report completed.${NC}"
echo "========================================"

# 추가 디버깅을 위한 제안
echo ""
echo -e "${YELLOW}💡 Additional Debugging Steps:${NC}"
echo "1. Run 'npm run dev' and check browser console for environment logs"
echo "2. Run 'npm run build:prod' and check build output for environment debug logs"
echo "3. Check the built files in 'dist/' to see what values were actually embedded"
echo "4. Use browser dev tools to inspect window.__initialEnvState after app loads"