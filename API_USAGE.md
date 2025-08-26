# API 클라이언트 사용법

이 프로젝트는 OpenAPI 스펙에서 자동으로 TypeScript API 클라이언트를 생성합니다.

## 설치 및 설정

### 1. API 클라이언트 생성

```bash
# API 클라이언트 생성 (한 번만 실행)
npm run generate-api

# API 스펙 변경 시 자동 업데이트 (개발 중)
npm run watch-api
```

### 2. 생성된 파일 구조

```
src/api/
├── index.ts          # 메인 export 파일
├── core/             # 핵심 기능 (에러 처리, 설정 등)
├── models/           # TypeScript 타입 정의
└── services/         # API 서비스 클래스들
    ├── AuthService.ts
    ├── UsersService.ts
    ├── InstagramService.ts
    ├── EmailService.ts
    ├── StripeService.ts
    └── DefaultService.ts
```

## 사용법

### 기본 설정

```typescript
import { OpenAPI } from './api';

// API 기본 URL 설정
OpenAPI.BASE = 'http://localhost:8000';
```

### 인증 (로그인)

```typescript
import { AuthService } from './api';

const login = async () => {
  try {
    const token = await AuthService.loginForAccessToken({
      username: 'user@example.com',
      password: 'password123'
    });
    
    // 토큰 저장
    localStorage.setItem('access_token', token.access_token);
    
    console.log('Login successful:', token);
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

### 사용자 정보 가져오기

```typescript
import { UsersService } from './api';

const getUserInfo = async () => {
  try {
    const user = await UsersService.readUsersMe();
    console.log('User info:', user);
    return user;
  } catch (error) {
    console.error('Failed to get user info:', error);
  }
};
```

### Instagram 데이터 가져오기

```typescript
import { InstagramService } from './api';

const getInstagramData = async () => {
  try {
    const igData = await InstagramService.readInstagramData();
    console.log('Instagram data:', igData);
    return igData;
  } catch (error) {
    console.error('Failed to get Instagram data:', error);
  }
};
```

### 이메일 전송

```typescript
import { EmailService } from './api';

const sendEmail = async () => {
  try {
    const emailResponse = await EmailService.sendEmail({
      to: 'recipient@example.com',
      subject: 'Test Email',
      body: 'This is a test email'
    });
    
    console.log('Email sent:', emailResponse);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
};
```

## React 컴포넌트에서 사용

```typescript
import React, { useState, useEffect } from 'react';
import { UsersService, OpenAPI } from './api';

// API 기본 URL 설정
OpenAPI.BASE = 'http://localhost:8000';

const UserProfile: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const userData = await UsersService.readUsersMe();
      setUser(userData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>No user data</div>;

  return (
    <div>
      <h2>User Profile</h2>
      <p>Email: {user.email}</p>
      <p>Name: {user.full_name}</p>
    </div>
  );
};
```

## 에러 처리

```typescript
import { ApiError } from './api';

try {
  const result = await SomeService.someMethod();
} catch (error) {
  if (error instanceof ApiError) {
    console.error('API Error:', error.status, error.message);
    
    // 상태 코드별 처리
    switch (error.status) {
      case 401:
        // 인증 실패 - 로그인 페이지로 리다이렉트
        break;
      case 403:
        // 권한 없음
        break;
      case 404:
        // 리소스 없음
        break;
      case 500:
        // 서버 에러
        break;
    }
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## 타입 안전성

생성된 API 클라이언트는 완전한 TypeScript 타입 지원을 제공합니다:

```typescript
import { User, UserCreate, UserUpdate } from './api';

// 타입이 보장된 사용자 생성
const createUser = async (userData: UserCreate): Promise<User> => {
  return await UsersService.createUser(userData);
};

// 타입이 보장된 사용자 업데이트
const updateUser = async (userId: number, userData: UserUpdate): Promise<User> => {
  return await UsersService.updateUser(userId, userData);
};
```

## 개발 팁

1. **API 스펙 변경 시**: `npm run generate-api`를 실행하여 클라이언트를 업데이트하세요.

2. **개발 중 자동 업데이트**: `npm run watch-api`를 사용하여 API 스펙 변경을 감지하고 자동으로 클라이언트를 업데이트할 수 있습니다.

3. **환경별 설정**: 개발/스테이징/프로덕션 환경에 따라 `OpenAPI.BASE`를 다르게 설정하세요.

4. **인증 토큰 관리**: 로그인 후 받은 토큰을 안전하게 저장하고, API 요청 시 자동으로 포함되도록 설정하세요.

## 사용 가능한 서비스

- `AuthService`: 인증 관련 API
- `UsersService`: 사용자 관리 API
- `InstagramService`: Instagram 관련 API
- `EmailService`: 이메일 전송 API
- `StripeService`: 결제 관련 API
- `DefaultService`: 기본 API

각 서비스의 구체적인 메서드는 생성된 코드를 참조하세요.
