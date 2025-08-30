# Flowsonat Frontend

현대적인 디자인 시스템과 인증 기능을 갖춘 React + TypeScript + Electron 애플리케이션입니다.

## 🚀 주요 기능

- **현대적인 디자인 시스템**: Tailwind CSS와 Radix UI를 기반으로 한 일관된 디자인
- **완전한 인증 시스템**: 로그인, 회원가입, 비밀번호 재설정 기능
- **타입 안전성**: TypeScript로 작성된 타입 안전한 코드
- **반응형 디자인**: 모든 디바이스에서 최적화된 사용자 경험
- **토스트 알림**: 사용자 친화적인 알림 시스템

## 🛠 기술 스택

- **Frontend**: React 18, TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, shadcn/ui
- **Forms**: React Hook Form, Zod
- **Routing**: React Router DOM
- **Desktop**: Electron
- **Build Tool**: Vite

## 📦 설치 및 실행

### 필수 요구사항
- Node.js 18+ 
- npm 또는 yarn

### 설치
```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# Electron 빌드
npm run build && electron-builder
```

## 🏗 프로젝트 구조

```
src/
├── api/                    # API 관련 코드
│   ├── core/              # API 핵심 설정
│   ├── models/            # API 모델 타입
│   └── services/          # API 서비스
├── components/            # 재사용 가능한 컴포넌트
│   ├── ui/               # 기본 UI 컴포넌트
│   └── ProtectedRoute.tsx # 보호된 라우트
├── contexts/             # React Context
│   └── AuthContext.tsx   # 인증 컨텍스트
├── hooks/                # 커스텀 훅
│   └── use-toast.ts      # 토스트 훅
├── lib/                  # 유틸리티 함수
│   └── utils.ts          # 공통 유틸리티
├── pages/                # 페이지 컴포넌트
│   ├── auth/             # 인증 관련 페이지
│   └── DashboardPage.tsx # 대시보드
└── App.tsx               # 메인 앱 컴포넌트
```

## 🔐 인증 기능

### 사용 가능한 페이지
- **로그인** (`/login`): 기존 사용자 로그인
- **회원가입** (`/register`): 새 사용자 등록
- **비밀번호 찾기** (`/forgot-password`): 비밀번호 재설정 요청
- **비밀번호 재설정** (`/reset-password`): 새 비밀번호 설정
- **대시보드** (`/dashboard`): 인증된 사용자 전용 페이지

### API 엔드포인트
- `POST /api/v1/auth/register` - 회원가입
- `POST /api/v1/auth/login` - 로그인
- `POST /api/v1/auth/refresh` - 토큰 갱신
- `POST /api/v1/auth/password-reset` - 비밀번호 재설정 요청
- `POST /api/v1/auth/password-reset/confirm` - 비밀번호 재설정 확인
- `GET /api/v1/auth/me` - 현재 사용자 정보
- `POST /api/v1/auth/logout` - 로그아웃

### 🔄 자동 토큰 갱신 시스템

프로젝트는 401 Unauthorized 에러 발생 시 자동으로 토큰을 갱신하는 시스템을 포함합니다:

#### 주요 기능
- **자동 토큰 갱신**: 401 에러 발생 시 refresh token을 사용하여 자동으로 새로운 access token 발급
- **요청 재시도**: 토큰 갱신 후 실패한 요청을 자동으로 재시도
- **동시 요청 처리**: 토큰 갱신 중 발생하는 다른 요청들을 큐에 저장하고 순차 처리
- **자동 로그아웃**: 토큰 갱신 실패 시 자동으로 로그아웃하고 로그인 페이지로 리다이렉트
- **사용자 알림**: 토큰 갱신 성공/실패 시 적절한 알림 표시

#### 동작 방식
1. API 요청 시 401 에러 발생
2. API 인터셉터가 에러를 감지
3. Refresh token을 사용하여 새로운 access token 발급
4. 새로운 토큰으로 실패한 요청 재시도
5. 토큰 갱신 실패 시 로그아웃 및 로그인 페이지 리다이렉트

#### 관련 파일
- `src/api/core/apiInterceptor.ts` - API 인터셉터 및 토큰 갱신 로직
- `src/api/core/request.ts` - 요청 처리 및 에러 핸들링
- `src/contexts/AuthContext.tsx` - 인증 상태 관리
- `src/hooks/useTokenRefresh.ts` - 토큰 갱신 훅

## 🎨 디자인 시스템

### 색상 팔레트
- **Primary**: 파란색 계열 (#3B82F6)
- **Secondary**: 회색 계열
- **Destructive**: 빨간색 계열 (#EF4444)
- **Muted**: 연한 회색 계열

### 컴포넌트
- Button (다양한 variant 지원)
- Input (아이콘 포함)
- Card (헤더, 콘텐츠, 푸터)
- Toast (알림 시스템)
- Label

## 🔧 개발 가이드

### 새로운 컴포넌트 추가
1. `src/components/ui/` 디렉토리에 컴포넌트 생성
2. TypeScript 타입 정의
3. Tailwind CSS 스타일링
4. 필요한 경우 Radix UI 프리미티브 사용

### 새로운 페이지 추가
1. `src/pages/` 디렉토리에 페이지 생성
2. `src/App.tsx`에 라우트 추가
3. 필요한 경우 `ProtectedRoute`로 보호

### API 통합
1. `src/api/services/`에 서비스 함수 추가
2. `src/api/models/`에 타입 정의
3. React Hook Form과 Zod로 폼 검증


### Instagram 자동화 사용법
- Instagram 자동화 기능은 현재 제거되었습니다.
- 향후 업데이트에서 다시 추가될 예정입니다.

## 📝 환경 변수

```env
# API 서버 URL (기본값: http://localhost:8000)
VITE_API_BASE_URL=http://localhost:8000
```

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.
