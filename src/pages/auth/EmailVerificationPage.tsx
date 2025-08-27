import React, { useState, useEffect } from 'react';
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

const emailVerificationSchema = z.object({
  code: z.string().min(6, 'Verification code must be at least 6 characters.').max(10, 'Verification code must be 10 characters or less.'),
});

type EmailVerificationForm = z.infer<typeof emailVerificationSchema>;

interface EmailVerificationPageProps {
  verificationType?: 'register' | 'password-reset' | 'email-change';
  redirectTo?: string;
}

export const EmailVerificationPage: React.FC<EmailVerificationPageProps> = ({
  verificationType = 'register',
  redirectTo = '/dashboard'
}) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
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
      toast({
        title: 'Error',
        description: 'Email information is missing.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await AuthService.verifyEmailApiV1AuthEmailVerificationPost({
        email,
        code: data.code,
      });

      toast({
        title: 'Verification Successful',
        description: 'Email verification completed successfully.',
      });

      // Redirect based on verification type
      if (type === 'password-reset') {
        navigate(`/reset-password?email=${email}&verified=true`);
      } else {
        navigate(redirectTo);
      }
    } catch (error: any) {
      toast({
        title: 'Verification Failed',
        description: error.message || 'Invalid verification code.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      toast({
        title: 'Error',
        description: 'Email information is missing.',
        variant: 'destructive',
      });
      return;
    }

    setIsResending(true);
    try {
      if (type === 'password-reset') {
        await EmailService.sendPasswordResetEmailApiV1EmailPasswordResetPost({ 
          to_email: email,
          username: email.split('@')[0],
          reset_url: `${window.location.origin}/reset-password?email=${email}`
        });
      } else {
        await EmailService.sendWelcomeEmailApiV1EmailWelcomePost({ 
          to_email: email,
          username: email.split('@')[0],
          verification_url: `${window.location.origin}/email-verification?email=${email}`,
          created_at: new Date().toISOString()
        });
      }

      toast({
        title: 'Code Resent',
        description: 'A new verification code has been sent to your email.',
      });

      setCountdown(60);
    } catch (error: any) {
      toast({
        title: 'Resend Failed',
        description: error.message || 'Failed to resend verification code.',
        variant: 'destructive',
      });
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            {getPageTitle()}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {getPageDescription()}
          </CardDescription>
          {email && (
            <div className="text-sm text-gray-500 mt-2">
              Verification code has been sent to {email}.
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                type="text"
                placeholder="Enter verification code"
                {...register('code')}
                className={errors.code ? 'border-red-500' : ''}
                maxLength={10}
              />
              {errors.code && (
                <p className="text-sm text-red-500">{errors.code.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="outline"
                onClick={handleResendCode}
                disabled={isResending || countdown > 0}
                className="w-full"
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
                className="text-sm text-gray-500 hover:text-gray-700"
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
