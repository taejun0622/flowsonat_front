import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthService } from '@/api/services/AuthService';
import { useToast } from '@/hooks/use-toast';
import { ApiError } from '@/api/core/ApiError';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordPage = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      await AuthService.requestPasswordResetApiV1AuthPasswordResetPost({
        email: data.email,
      });
      
      toast({
        title: "Verification code sent",
        description: "Please check your email for the verification code.",
      });
      
      // 인증번호 입력 페이지로 이동
      navigate(`/email-verification?email=${encodeURIComponent(data.email)}&type=password-reset`);
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      // Handle specific error types
      if (error instanceof ApiError) {
        if (error.status >= 400 && error.status < 500) {
          // Client errors (400-series)
          if (error.status === 404) {
            setErrorMessage('No account found with this email address.');
          } else if (error.status === 422) {
            setErrorMessage('Invalid email format. Please check your email address.');
          } else if (error.status === 429) {
            setErrorMessage('Too many password reset attempts. Please try again later.');
          } else {
            setErrorMessage(error.body?.detail || error.message || 'Failed to send password reset email.');
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-black/20 backdrop-blur-md border-black/30 shadow-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-white">Forgot Password</CardTitle>
          <CardDescription className="text-center text-gray-300">
            Enter your registered email address and we'll send you a password reset link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {errorMessage && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-md">
                <p className="text-sm text-red-400">{errorMessage}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  className="pl-10 bg-black/20 border-black/30 text-white placeholder:text-gray-400 focus:border-white/30"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-400">{errors.email.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full bg-white text-gray-900 hover:bg-gray-100" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send password reset email'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-300">
              <Link to="/login" className="text-white hover:underline">
                Back to login
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
