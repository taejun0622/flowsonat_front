// API 클라이언트 사용 예제
import { 
  AuthService, 
  UsersService, 
  InstagramService, 
  EmailService,
  OpenAPI 
} from './api';

// API 기본 URL 설정 (환경변수에서 자동으로 설정됨)
// OpenAPI.BASE는 자동으로 import.meta.env.VITE_API_BASE_URL 또는 기본값을 사용

// 인증 예제
async function loginExample() {
  try {
    const token = await AuthService.loginForAccessToken({
      username: 'user@example.com',
      password: 'password123'
    });
    console.log('Login successful:', token);
    return token;
  } catch (error) {
    console.error('Login failed:', error);
  }
}

// 사용자 정보 가져오기 예제
async function getUserInfo() {
  try {
    const user = await UsersService.readUsersMe();
    console.log('User info:', user);
    return user;
  } catch (error) {
    console.error('Failed to get user info:', error);
  }
}

// Instagram 관련 API 예제
async function getInstagramData() {
  try {
    const igData = await InstagramService.readInstagramData();
    console.log('Instagram data:', igData);
    return igData;
  } catch (error) {
    console.error('Failed to get Instagram data:', error);
  }
}

// 이메일 전송 예제
async function sendEmail() {
  try {
    const emailResponse = await EmailService.sendEmail({
      to: 'recipient@example.com',
      subject: 'Test Email',
      body: 'This is a test email'
    });
    console.log('Email sent:', emailResponse);
    return emailResponse;
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}

// React 컴포넌트에서 사용하는 예제
export function useApiExample() {
  const handleLogin = async () => {
    const token = await loginExample();
    if (token) {
      // 로그인 성공 후 처리
      console.log('Login successful, token:', token.access_token);
    }
  };

  const handleGetUserInfo = async () => {
    const user = await getUserInfo();
    if (user) {
      // 사용자 정보 사용
      console.log('User:', user.email);
    }
  };

  return {
    handleLogin,
    handleGetUserInfo,
    getInstagramData,
    sendEmail
  };
}
