# FlowSonat 앱 배포 가이드

## 🚀 멀티 플랫폼 앱 빌드 및 S3 배포

### 지원 플랫폼
- **macOS**: Intel (x64) + Apple Silicon (arm64)
- **Windows**: x64 + x86 (ia32)
- **Linux**: x64 + ARM (armv7l, arm64)

## 📋 사전 요구사항

### 1. AWS CLI 설치
```bash
brew install awscli
```

### 2. 환경 설정
```bash
# .env.deploy 파일 생성
cp .env.deploy.example .env.deploy

# .env.deploy 파일 편집하여 실제 값 입력
# - AWS_ACCESS_KEY_ID: IAM 사용자의 액세스 키
# - AWS_SECRET_ACCESS_KEY: IAM 사용자의 시크릿 키
# - AWS_REGION: S3 버킷 리전 (예: ap-northeast-2)
# - S3_BUCKET_NAME: S3 버킷 이름 (예: flowsonat-release)

# 예시:
# AWS_ACCESS_KEY_ID=AKIA...
# AWS_SECRET_ACCESS_KEY=...
# AWS_REGION=ap-northeast-2
# S3_BUCKET_NAME=flowsonat-release
```

## 🔧 빌드 명령어

### 웹 버전만 빌드
```bash
npm run build:web
```

### 특정 플랫폼 빌드
```bash
npm run build:mac      # macOS용
npm run build:win      # Windows용
npm run build:linux    # Linux용
```

### 모든 플랫폼 빌드
```bash
npm run build:all
```

## 📦 자동 업데이트 시스템

### 버전 정보 자동 생성
배포할 때마다 자동으로 `version-info.json` 파일이 생성되어 S3에 업로드됩니다.

### 버전 정보 포함 내용
- 현재 앱 버전
- 플랫폼별 다운로드 링크
- 빌드 시간 및 Git 커밋 정보
- 업데이트 노트 및 최소 지원 버전

### 자동 업데이트 워크플로우
1. **코드 수정** → Git 커밋
2. **배포 실행** → `./scripts/deploy.sh [platform]`
3. **자동 생성** → 버전 정보 JSON 생성 및 S3 업로드
4. **GitHub 릴리스** → 수동으로 태그 생성 및 릴리스 노트 작성

## 🚀 배포 명령어

### 기본 사용법
```bash
./scripts/deploy.sh [environment] [platform]
```

### 예시
```bash
# 스테이징에 웹만 배포
./scripts/deploy.sh staging web-only

# 프로덕션에 맥용 빌드 배포
./scripts/deploy.sh production mac

# 스테이징에 모든 플랫폼 배포
./scripts/deploy.sh staging all

# 기본값 (스테이징, 모든 플랫폼)
./scripts/deploy.sh
```

## 🌍 환경별 설정

### 스테이징 환경
- S3 버킷: `{S3_BUCKET_NAME}-staging`
- URL: `https://{S3_BUCKET_NAME}-staging.s3.{AWS_REGION}.amazonaws.com/`

### 프로덕션 환경
- S3 버킷: `{S3_BUCKET_NAME}-production`
- URL: `https://{S3_BUCKET_NAME}-production.s3.{AWS_REGION}.amazonaws.com/`

## 📁 빌드 출력물

### 웹 버전
- 위치: `dist/` 폴더
- S3에 직접 업로드

### Electron 앱
- 위치: `release/{version}/` 폴더
- S3 releases 폴더에 업로드

## 🔐 AWS 설정

### IAM 사용자
- 사용자: `flowsonat_release_s3_access`
- 액세스 키와 시크릿 키를 직접 사용

### 필요한 권한
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::flowsonat-frontend-*",
        "arn:aws:s3:::flowsonat-frontend-*/*"
      ]
    }
  ]
}
```

## 🎯 S3 버킷 설정

### 정적 웹사이트 호스팅
- 인덱스 문서: `index.html`
- 오류 문서: `index.html` (SPA 라우팅)

### CORS 설정
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```



## 📝 환경 변수

### 배포용 (.env.deploy)
- `AWS_ACCESS_KEY_ID`: AWS 액세스 키
- `AWS_SECRET_ACCESS_KEY`: AWS 시크릿 키
- `AWS_REGION`: AWS 리전  
- `S3_BUCKET_NAME`: S3 버킷 이름

### 앱용 (.env)
- `VITE_API_BASE_URL`: API 기본 URL

## 🔍 문제 해결

### 빌드 실패
```bash
# 의존성 재설치
rm -rf node_modules package-lock.json
npm install

# TypeScript 타입 체크
npm run typecheck
```

### 배포 실패
```bash
# AWS 자격 증명 확인
aws sts get-caller-identity --profile flowsonat

# S3 버킷 접근 확인
aws s3 ls s3://{S3_BUCKET_NAME}-staging --profile flowsonat
```

### 권한 오류
- IAM 사용자에 적절한 S3 권한 부여
- S3 버킷 정책 확인

## 📚 추가 리소스

- [Electron Builder 문서](https://www.electron.build/)
- [AWS CLI 사용법](https://docs.aws.amazon.com/cli/)
- [S3 정적 웹사이트 호스팅](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
