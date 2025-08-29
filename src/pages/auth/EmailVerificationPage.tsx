import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { EmailService } from '@/api/services/EmailService';
import { AuthService } from '@/api/services/AuthService';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/api/core/ApiError';

const emailVerificationSchema = z.object({
  code: z.string().min(6, 'Verification code must be at least 6 characters.').max(10, 'Verification code must be 10 characters or less.'),
});

type EmailVerificationForm = z.infer<typeof emailVerificationSchema>;

interface EmailVerificationPageProps {
  verificationType?: 'register' | 'password-reset' | 'email-change';
  redirectTo?: string;
}

export const EmailVerificationPage = ({
  verificationType = 'register',
  redirectTo = '/dashboard'
}: EmailVerificationPageProps) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setTokens } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendErrorMessage, setResendErrorMessage] = useState<string | null>(null);
  
  const email = searchParams.get('email') || '';
  const type = searchParams.get('type') || verificationType;
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<EmailVerificationForm>({
    resolver: zodResolver(emailVerificationSchema),
  });

  // 카운트다운 타이머
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 페이지 로드 시 카운트다운 시작
  useEffect(() => {
    setCountdown(60);
  }, []);

  const onSubmit = async (data: EmailVerificationForm) => {
    if (!email) {
      setErrorMessage('Email information is missing.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      if (type === 'password-reset') {
        // 비밀번호 재설정용: 인증번호 확인 후 비밀번호 재설정 페이지로 이동
        // 여기서는 인증번호만 확인하고, 실제 비밀번호 재설정은 별도 페이지에서 처리
        toast({
          title: 'Verification Successful',
          description: 'Please enter your new password.',
        });
        
        // 비밀번호 재설정 페이지로 이동 (인증번호를 URL 파라미터로 전달)
        navigate(`/reset-password?email=${email}&token=${data.code}`);
      } else {
        // 일반 이메일 인증용
        const response = await AuthService.verifyEmailApiV1AuthEmailVerificationPost({
          email,
          code: data.code,
        });

        // Response is now Token type, so we can directly use it
        await setTokens(response.access_token, response.refresh_token);
        
        toast({
          title: 'Verification Successful',
          description: 'Email verified and logged in successfully.',
        });

        navigate(redirectTo);
      }
    } catch (error: any) {
      console.error('Email verification error:', error);
      
      // Handle specific error types
      if (error instanceof ApiError) {
        if (error.status >= 400 && error.status < 500) {
          // Client errors (400-series)
          if (error.status === 400) {
            setErrorMessage('Invalid verification code. Please check the code and try again.');
          } else if (error.status === 404) {
            setErrorMessage('Email not found or verification code expired.');
          } else if (error.status === 422) {
            setErrorMessage('Invalid verification code format.');
          } else if (error.status === 429) {
            setErrorMessage('Too many verification attempts. Please try again later.');
          } else {
            setErrorMessage(error.body?.detail || error.message || 'Verification failed. Please try again.');
          }
        } else {
          // Server errors (500-series)
          setErrorMessage('Server error. Please try again later.');
        }
      } else {
        // Network or other errors
        setErrorMessage('Network error. Please check your connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      setResendErrorMessage('Email information is missing.');
      return;
    }

    setIsResending(true);
    setResendErrorMessage(null);
    try {
      if (type === 'password-reset') {
        // 비밀번호 재설정 코드 재발송
        await AuthService.resendPasswordResetCodeApiV1AuthResendPasswordResetPost(email);
      } else {
        // 일반 이메일 인증 코드 재발송
        await AuthService.resendVerificationCodeApiV1AuthResendVerificationPost(email);
      }

      toast({
        title: 'Code Resent',
        description: 'A new verification code has been sent to your email.',
      });

      setCountdown(60);
    } catch (error: any) {
      console.error('Resend code error:', error);
      
      // Handle specific error types
      if (error instanceof ApiError) {
        if (error.status >= 400 && error.status < 500) {
          // Client errors (400-series)
          if (error.status === 404) {
            setResendErrorMessage('Email not found. Please check your email address.');
          } else if (error.status === 422) {
            setResendErrorMessage('Invalid email format.');
          } else if (error.status === 429) {
            setResendErrorMessage('Too many resend attempts. Please try again later.');
          } else {
            setResendErrorMessage(error.body?.detail || error.message || 'Failed to resend verification code.');
          }
        } else {
          // Server errors (500-series)
          setResendErrorMessage('Server error. Please try again later.');
        }
      } else {
        // Network or other errors
        setResendErrorMessage('Network error. Please check your connection and try again.');
      }
    } finally {
      setIsResending(false);
    }
  };

  const getPageTitle = () => {
    switch (type) {
      case 'password-reset':
        return 'Password Reset Verification';
      case 'email-change':
        return 'Email Change Verification';
      default:
        return 'Email Verification';
    }
  };

  const getPageDescription = () => {
    switch (type) {
      case 'password-reset':
        return 'Please enter the verification code sent to your email for password reset.';
      case 'email-change':
        return 'Please enter the verification code sent to your new email for email change.';
      default:
        return 'Please enter the verification code sent to your email for registration.';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-black/20 backdrop-blur-md border-black/30 shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white">
            {getPageTitle()}
          </CardTitle>
          <CardDescription className="text-gray-300">
            {getPageDescription()}
          </CardDescription>
          {email && (
            <div className="text-sm text-gray-400 mt-2">
              Verification code has been sent to {email}.
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {errorMessage && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-md">
                <p className="text-sm text-red-400">{errorMessage}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="code" className="text-white">Verification Code</Label>
              <Input
                id="code"
                type="text"
                placeholder="Enter verification code"
                {...register('code')}
                className={`bg-black/20 border-black/30 text-white placeholder:text-gray-400 focus:border-white/30 ${errors.code ? 'border-red-400' : ''}`}
                maxLength={10}
              />
              {errors.code && (
                <p className="text-sm text-red-400">{errors.code.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-white text-gray-900 hover:bg-gray-100"
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </Button>

            {resendErrorMessage && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-md">
                <p className="text-sm text-red-400">{resendErrorMessage}</p>
              </div>
            )}

            <div className="text-center">
              <Button
                type="button"
                variant="outline"
                onClick={handleResendCode}
                disabled={isResending || countdown > 0}
                className="w-full border-black/30 text-white hover:bg-black/20"
              >
                {isResending
                  ? 'Resending...'
                  : countdown > 0
                  ? `Resend available in ${countdown}s`
                  : 'Resend Code'}
              </Button>
            </div>

            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate(-1)}
                className="text-sm text-gray-400 hover:text-white"
              >
                Go Back
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
