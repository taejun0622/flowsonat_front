# FlowSonat Frontend

FlowSonat의 Electron 기반 프론트엔드 애플리케이션입니다.

## 주요 기능

- **Instagram 자동화**: Instagram 계정 연결 및 자동화 실행
- **대시보드**: 사용자 통계 및 설정 관리
- **자동 업데이트**: 서버에서 최신 버전 확인 및 자동 업데이트
- **크로스 플랫폼**: Windows, macOS, Linux 지원

## 자동 업데이트 시스템

FlowSonat은 자동 업데이트 시스템을 통해 사용자가 항상 최신 버전을 사용할 수 있도록 합니다:

### 기능
- **자동 버전 체크**: 앱 시작 시 및 1시간마다 서버에서 최신 버전 확인
- **스마트 업데이트**: 현재 플랫폼과 아키텍처에 맞는 업데이트 파일 자동 선택
- **사용자 알림**: 업데이트 가능 시 사용자에게 알림 및 다운로드 진행률 표시
- **강제 업데이트**: 지원 중단 버전에 대한 강제 업데이트 지원
- **자동 설치**: 업데이트 다운로드 완료 후 재시작 시 자동 설치

### 업데이트 프로세스
1. 앱 시작 시 자동으로 서버 버전 정보 확인
2. 업데이트가 필요한 경우 사용자에게 알림
3. 사용자 확인 후 업데이트 다운로드 시작
4. 다운로드 진행률 실시간 표시
5. 다운로드 완료 후 재시작 시 자동 설치

### 서버 설정
- **버전 정보 URL**: `https://d3hlgb8urc94dl.cloudfront.net/version-info.json`
- **업데이트 파일**: S3 버킷에 저장된 플랫폼별 설치 파일
- **최소 지원 버전**: `minSupportedVersion` 필드로 지원 중단 버전 관리
- **자동 생성**: `version-info.json`은 배포 스크립트에 의해 자동 생성

## 개발 환경 설정

### 필수 요구사항
- Node.js 18+
- npm 또는 yarn

### 설치
```bash
npm install
```

### 개발 서버 실행
```bash
npm run dev
```

### 빌드
```bash
# 프로덕션 빌드
npm run build

# 플랫폼별 빌드
npm run build:mac
npm run build:win
npm run build:linux
```

### API 클라이언트 생성
```bash
# API 클라이언트 생성
npm run generate-api

# API 변경사항 감시
npm run watch-api
```

## 프로젝트 구조

```
src/
├── api/           # OpenAPI로 생성된 API 클라이언트
├── components/    # 재사용 가능한 UI 컴포넌트
├── contexts/      # React Context (인증, Instagram 등)
├── features/      # 기능별 모듈
├── hooks/         # 커스텀 React Hooks
├── pages/         # 페이지 컴포넌트
├── services/      # 비즈니스 로직 서비스
└── types/         # TypeScript 타입 정의

electron/
├── main.ts        # 메인 프로세스 (자동 업데이트 포함)
└── preload.ts     # 프리로드 스크립트
```

## 환경 변수

환경별로 다른 `.env` 파일을 사용합니다:

### 개발 환경 (`.env.local`)
```env
# Development Environment (uses test.api.flowsonat.com via proxy)
VITE_API_BASE_URL=http://localhost:5174

# Stripe Configuration (Development/Test)
VITE_STRIPE_PRICE_ID=price_test_your_test_price_id_here
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key_here
VITE_STRIPE_PRODUCT_ID=prod_test_your_test_product_id_here
```

### 프로덕션 환경 (`.env.production`)
```env
# Production Environment
VITE_API_BASE_URL=https://api.flowsonat.com

```

### 환경 변수 설명

- `VITE_APP_VERSION`: 앱 버전 (package.json에서 자동 설정, 수동 설정 불필요)
- `VITE_API_BASE_URL`: API 서버 URL (필수)
- `VITE_STRIPE_PRICE_ID`: Stripe 가격 ID
- `VITE_STRIPE_PUBLISHABLE_KEY`: Stripe 공개 키
- `VITE_STRIPE_PRODUCT_ID`: Stripe 제품 ID

### 환경별 실행

- **개발**: `npm run dev` → `.env.local` 사용 (프록시로 test.api.flowsonat.com)
- **프로덕션 빌드**: `npm run build` → `.env.production` 사용 (api.flowsonat.com)

## 배포

### 자동 업데이트 설정
- `electron-builder.json5`에서 S3 버킷 URL 설정
- `version-info.json` 파일을 S3에 업로드하여 버전 정보 제공
- 각 플랫폼별 설치 파일을 S3에 업로드
- CloudFront를 통한 CDN 배포로 빠른 업데이트 다운로드

### 배포 스크립트

#### 전체 배포 (권장)
```bash
# 모든 플랫폼에 대해 버전 업데이트, 빌드, 배포
./scripts/deploy-all.sh patch all

# 특정 플랫폼만 배포
./scripts/deploy-all.sh minor mac
./scripts/deploy-all.sh patch win
```

#### 개별 배포
```bash
# 버전 정보만 생성/업로드
./scripts/generate-version-info.sh

# 특정 플랫폼 빌드 및 배포
./scripts/deploy.sh mac
./scripts/deploy.sh win
./scripts/deploy.sh linux
```

### 배포 환경 설정
`.env.deploy` 파일에 다음 환경 변수를 설정해야 합니다:
```env
# AWS 설정
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=flowsonat-release

# CloudFront 설정 (선택사항)
CLOUDFRONT_DOMAIN=d3hlgb8urc94dl.cloudfront.net
CLOUDFRONT_DISTRIBUTION_ID=your_distribution_id
```

### 버전 관리

#### 기본 버전 업데이트
```bash
# 패치 버전 업데이트 (이전 버전 지원 중단)
npm run version:patch

# 마이너 버전 업데이트 (이전 버전 지원 중단)
npm run version:minor

# 메이저 버전 업데이트 (이전 버전 지원 중단)
npm run version:major

# 버전 정보 생성 (현재 버전을 최소 지원 버전으로 설정)
npm run version:info
```

#### 고급 버전 관리
```bash
# 특정 최소 지원 버전 설정
./scripts/generate-version-info.sh --min-supported 0.0.15

# 버전 업데이트와 함께 최소 지원 버전 설정
./scripts/version-bump.sh patch --min-supported 0.0.15

# 전체 배포와 함께 최소 지원 버전 설정
./scripts/deploy-all.sh minor all --min-supported 0.0.15
```

#### 버전 관리 정책
- **기본 동작**: 새 버전 배포 시 이전 버전들은 자동으로 지원 중단
- **유연한 제어**: `--min-supported` 매개변수로 특정 버전까지 지원 가능
- **보안 고려**: 중요한 보안 업데이트 시 이전 버전 지원 중단 권장

### 스크립트 사용법

#### generate-version-info.sh
```bash
# 현재 버전을 최소 지원 버전으로 설정
./scripts/generate-version-info.sh

# 특정 최소 지원 버전 설정
./scripts/generate-version-info.sh --min-supported 0.0.15

# 도움말 보기
./scripts/generate-version-info.sh --help
```

#### version-bump.sh
```bash
# 패치 버전 업데이트 (이전 버전 지원 중단)
./scripts/version-bump.sh patch

# 마이너 버전 업데이트 (특정 버전까지 지원)
./scripts/version-bump.sh minor --min-supported 0.0.15

# 도움말 보기
./scripts/version-bump.sh --help
```

#### deploy-all.sh
```bash
# 모든 플랫폼 배포 (이전 버전 지원 중단)
./scripts/deploy-all.sh patch all

# 특정 플랫폼 배포 (특정 버전까지 지원)
./scripts/deploy-all.sh minor mac --min-supported 0.0.15

# 도움말 보기
./scripts/deploy-all.sh --help
```

## 라이선스

이 프로젝트는 FlowSonat 팀에 의해 개발되었습니다.
