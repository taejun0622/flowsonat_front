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
- **버전 정보 URL**: `https://flowsonat-release.s3.us-east-1.amazonaws.com/version-info.json`
- **업데이트 파일**: S3 버킷에 저장된 플랫폼별 설치 파일
- **최소 지원 버전**: `minSupportedVersion` 필드로 지원 중단 버전 관리

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

`.env` 파일에 다음 변수들을 설정할 수 있습니다:

```env
VITE_API_BASE_URL=https://api.flowsonat.com
VITE_APP_VERSION=0.0.1
```

## 배포

### 자동 업데이트 설정
- `electron-builder.json5`에서 S3 버킷 URL 설정
- `version-info.json` 파일을 S3에 업로드하여 버전 정보 제공
- 각 플랫폼별 설치 파일을 S3에 업로드

### 버전 관리
```bash
# 패치 버전 업데이트
npm run version:patch

# 마이너 버전 업데이트
npm run version:minor

# 메이저 버전 업데이트
npm run version:major

# 버전 정보 생성
npm run version:info
```

## 라이선스

이 프로젝트는 FlowSonat 팀에 의해 개발되었습니다.
