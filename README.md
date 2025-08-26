# WebView Manager

Electron 기반의 웹뷰 관리 애플리케이션입니다. X-Frame-Options 차단을 우회하여 웹사이트를 전체 화면으로 볼 수 있습니다.

## 🏗️ 프로젝트 구조 (Clean Architecture)

```
src/
├── features/           # 기능별 모듈
│   └── webview/       # 웹뷰 기능
│       ├── components/ # 웹뷰 관련 컴포넌트
│       ├── hooks/     # 웹뷰 관련 훅
│       ├── types/     # 웹뷰 타입 정의
│       └── index.ts   # 웹뷰 모듈 export
├── shared/            # 공통 모듈
│   ├── components/    # 공통 컴포넌트
│   ├── types/         # 공통 타입 정의
│   ├── utils/         # 유틸리티 함수
│   └── index.ts       # 공통 모듈 export
└── App.tsx           # 메인 앱 컴포넌트
```

## 🚀 주요 기능

### ✅ 웹뷰 기능
- **전체 화면 웹뷰**: Electron webview 태그를 사용한 전체 화면 모드
- **X-Frame-Options 우회**: iframe 차단 문제 해결
- **네비게이션 컨트롤**: 뒤로가기, 앞으로가기, 새로고침
- **로딩 상태 표시**: 웹뷰 로딩 중 상태 표시
- **에러 처리**: 로딩 실패 시 재시도 기능

### ✅ 사용자 인터페이스
- **URL 입력**: 직접 URL 입력 가능
- **Quick Access**: 자주 사용하는 페이지 빠른 접근
- **반응형 디자인**: 다양한 화면 크기 지원
- **직관적인 UI**: 사용하기 쉬운 인터페이스

## 🛠️ 기술 스택

- **Frontend**: React 18, TypeScript
- **Desktop**: Electron 30
- **Build Tool**: Vite 7
- **Package Manager**: npm

## 📦 설치 및 실행

### 개발 환경 설정
```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 빌드
```bash
# 프로덕션 빌드
npm run build
```

## 🎯 사용 방법

1. **URL 입력**: 원하는 웹사이트 URL을 입력
2. **Quick Access**: 미리 정의된 버튼들로 빠른 접근
3. **전체 화면 실행**: "Open in Full Screen" 버튼 클릭
4. **네비게이션**: 헤더의 컨트롤 버튼 사용
5. **종료**: "Close" 버튼으로 전체 화면 모드 종료

## 🔧 개발 가이드

### 새로운 기능 추가
1. `src/features/` 폴더에 새로운 기능 모듈 생성
2. 각 모듈은 `components/`, `hooks/`, `types/` 폴더 포함
3. `index.ts` 파일로 모듈 export

### 공통 컴포넌트 추가
1. `src/shared/components/` 폴더에 추가
2. `src/shared/index.ts`에서 export

### 스타일 관리
- `src/shared/utils/styles.ts`에서 공통 스타일 정의
- 컴포넌트별 인라인 스타일 사용

## 📝 라이선스

MIT License
