# API 사용법 가이드

이 문서는 Flowsonat Frontend에서 사용하는 API의 사용법을 설명합니다.

## 🔧 API 설정

### 기본 설정
API는 `src/api/core/OpenAPI.ts`에서 설정됩니다:

```typescript
export const OpenAPI: OpenAPIConfig = {
    BASE: 'http://localhost:8000',  // API 서버 URL
    VERSION: '1.0.0',
    WITH_CREDENTIALS: false,
    CREDENTIALS: 'include',
    TOKEN: async () => {
        const token = localStorage.getItem('access_token');
        return token ? `Bearer ${token}` : '';
    },
    // ... 기타 설정
};
```

### 환경 변수로 설정 변경
프로덕션 환경에서는 환경 변수를 사용하여 API URL을 설정할 수 있습니다:

```typescript
BASE: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
```

## 🔐 인증 API

### 1. 회원가입
```typescript
import { AuthService } from '@/api/services/AuthService';
import { UserCreate } from '@/api/models/UserCreate';

const userData: UserCreate = {
    email: 'user@example.com',
    password: 'password123'
};

try {
    const user = await AuthService.registerApiV1AuthRegisterPost(userData);
    console.log('회원가입 성공:', user);
} catch (error) {
    console.error('회원가입 실패:', error);
}
```

### 2. 로그인
```typescript
import { AuthService } from '@/api/services/AuthService';
import { UserLogin } from '@/api/models/UserLogin';

const credentials: UserLogin = {
    email: 'user@example.com',
    password: 'password123'
};

try {
    const token = await AuthService.loginApiV1AuthLoginPost(credentials);
    console.log('로그인 성공:', token);
    // 토큰은 자동으로 localStorage에 저장됩니다
} catch (error) {
    console.error('로그인 실패:', error);
}
```

### 3. 토큰 갱신
```typescript
import { AuthService } from '@/api/services/AuthService';

const refreshToken = localStorage.getItem('refresh_token');
if (refreshToken) {
    try {
        const newToken = await AuthService.refreshTokenApiV1AuthRefreshPost(refreshToken);
        console.log('토큰 갱신 성공:', newToken);
    } catch (error) {
        console.error('토큰 갱신 실패:', error);
    }
}
```

### 4. 현재 사용자 정보 조회
```typescript
import { AuthService } from '@/api/services/AuthService';

try {
    const user = await AuthService.getCurrentUserInfoApiV1AuthMeGet();
    console.log('사용자 정보:', user);
} catch (error) {
    console.error('사용자 정보 조회 실패:', error);
}
```

### 5. 비밀번호 재설정 요청
```typescript
import { AuthService } from '@/api/services/AuthService';
import { PasswordReset } from '@/api/models/PasswordReset';

const resetData: PasswordReset = {
    email: 'user@example.com'
};

try {
    await AuthService.requestPasswordResetApiV1AuthPasswordResetPost(resetData);
    console.log('비밀번호 재설정 이메일 전송 완료');
} catch (error) {
    console.error('비밀번호 재설정 요청 실패:', error);
}
```

### 6. 비밀번호 재설정 확인
```typescript
import { AuthService } from '@/api/services/AuthService';
import { PasswordResetConfirm } from '@/api/models/PasswordResetConfirm';

const confirmData: PasswordResetConfirm = {
    token: 'reset_token_from_email',
    new_password: 'newpassword123'
};

try {
    await AuthService.confirmPasswordResetApiV1AuthPasswordResetConfirmPost(confirmData);
    console.log('비밀번호 재설정 완료');
} catch (error) {
    console.error('비밀번호 재설정 실패:', error);
}
```

### 7. 로그아웃
```typescript
import { AuthService } from '@/api/services/AuthService';

try {
    await AuthService.logoutApiV1AuthLogoutPost();
    console.log('로그아웃 완료');
    // 클라이언트에서 토큰을 제거해야 합니다
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
} catch (error) {
    console.error('로그아웃 실패:', error);
}
```

## 🎯 인증 컨텍스트 사용법

### AuthContext 훅 사용
```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
    const { user, token, isLoading, login, register, logout } = useAuth();

    const handleLogin = async () => {
        try {
            await login({
                email: 'user@example.com',
                password: 'password123'
            });
            // 로그인 성공 후 처리
        } catch (error) {
            // 에러 처리
        }
    };

    if (isLoading) {
        return <div>로딩 중...</div>;
    }

    return (
        <div>
            {user ? (
                <div>
                    <p>환영합니다, {user.email}님!</p>
                    <button onClick={logout}>로그아웃</button>
                </div>
            ) : (
                <button onClick={handleLogin}>로그인</button>
            )}
        </div>
    );
}
```

## 🛡️ 보호된 라우트

### ProtectedRoute 컴포넌트 사용
```typescript
import { ProtectedRoute } from '@/components/ProtectedRoute';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <DashboardPage />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </Router>
    );
}
```

## 📝 에러 처리

### API 에러 타입
```typescript
import { ApiError } from '@/api/core/ApiError';

try {
    await AuthService.loginApiV1AuthLoginPost(credentials);
} catch (error) {
    if (error instanceof ApiError) {
        console.error('API 에러:', error.message);
        console.error('상태 코드:', error.status);
        console.error('에러 데이터:', error.data);
    } else {
        console.error('네트워크 에러:', error);
    }
}
```

### 토스트 알림과 함께 사용
```typescript
import { useToast } from '@/hooks/use-toast';

function LoginComponent() {
    const { toast } = useToast();

    const handleLogin = async () => {
        try {
            await login(credentials);
            toast({
                title: "로그인 성공",
                description: "성공적으로 로그인되었습니다.",
            });
        } catch (error) {
            toast({
                title: "로그인 실패",
                description: error.message || "로그인에 실패했습니다.",
                variant: "destructive",
            });
        }
    };
}
```

## 🔄 자동 토큰 갱신

API 클라이언트는 자동으로 토큰을 요청 헤더에 포함시킵니다. 토큰이 만료되면 `refreshToken` 함수를 호출하여 새로운 토큰을 받아올 수 있습니다.

```typescript
// AuthContext에서 자동으로 처리됩니다
const refreshToken = async () => {
    const refreshTokenValue = localStorage.getItem('refresh_token');
    if (!refreshTokenValue) {
        throw new Error('No refresh token available');
    }

    try {
        const tokenData = await AuthService.refreshTokenApiV1AuthRefreshPost(refreshTokenValue);
        localStorage.setItem('access_token', tokenData.access_token);
        localStorage.setItem('refresh_token', tokenData.refresh_token);
        setToken(tokenData.access_token);
    } catch (error) {
        logout(); // 토큰 갱신 실패 시 로그아웃
        throw error;
    }
};
```

## 📊 API 모델 타입

### User 타입
```typescript
export type User = {
    email: string;
    id: string;
    is_active: boolean;
    is_superuser: boolean;
    created_at: string;
    updated_at?: (string | null);
};
```

### Token 타입
```typescript
export type Token = {
    access_token: string;
    refresh_token: string;
    token_type: string;
};
```

### UserCreate 타입
```typescript
export type UserCreate = {
    email: string;
    password: string;
};
```

### UserLogin 타입
```typescript
export type UserLogin = {
    email: string;
    password: string;
};
```

## 🚀 모범 사례

1. **에러 처리**: 모든 API 호출에 try-catch 블록 사용
2. **로딩 상태**: 사용자에게 로딩 상태 표시
3. **토큰 관리**: 토큰 만료 시 자동 갱신 처리
4. **사용자 피드백**: 토스트 알림으로 사용자에게 피드백 제공
5. **타입 안전성**: TypeScript 타입을 활용한 타입 안전한 코드 작성
