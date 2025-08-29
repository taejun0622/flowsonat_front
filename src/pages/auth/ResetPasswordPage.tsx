import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Lock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthService } from '@/api/services/AuthService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/api/core/ApiError';

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters long.'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const ResetPasswordPage = () => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setTokens } = useAuth();

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token || !email) {
      setErrorMessage('Invalid reset link. Missing token or email.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      const response = await AuthService.confirmPasswordResetApiV1AuthPasswordResetConfirmPost({
        email: email,
        code: token,
        new_password: data.password,
      });
      
      // Response is now Token type, so we can directly use it
      await setTokens(response.access_token, response.refresh_token);
      
      toast({
        title: "Password reset successful",
        description: "Password changed and logged in successfully.",
      });
      
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      // Handle specific error types
      if (error instanceof ApiError) {
        if (error.status >= 400 && error.status < 500) {
          // Client errors (400-series)
          if (error.status === 400) {
            setErrorMessage('Invalid reset token or email. Please request a new password reset.');
          } else if (error.status === 422) {
            setErrorMessage('Invalid password format. Please ensure your password meets the requirements.');
          } else if (error.status === 429) {
            setErrorMessage('Too many password reset attempts. Please try again later.');
          } else {
            setErrorMessage(error.body?.detail || error.message || 'Password reset failed. Please try again.');
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

  if (!token || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-black/20 backdrop-blur-md border-black/30 shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-white">Invalid link</CardTitle>
            <CardDescription className="text-center text-gray-300">
              The password reset link is invalid or missing required information.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild className="w-full bg-white text-gray-900 hover:bg-gray-100">
              <Link to="/forgot-password">Request new password reset</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-black/20 backdrop-blur-md border-black/30 shadow-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-white">Set New Password</CardTitle>
          <CardDescription className="text-center text-gray-300">
            Please enter your new password
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
              <Label htmlFor="password" className="text-white">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your new password (minimum 8 characters)"
                  className="pl-10 pr-10 bg-black/20 border-black/30 text-white placeholder:text-gray-400 focus:border-white/30"
                  {...register('password')}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-8 w-8 text-gray-400 hover:text-white hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-400">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter your new password"
                  className="pl-10 pr-10 bg-black/20 border-black/30 text-white placeholder:text-gray-400 focus:border-white/30"
                  {...register('confirmPassword')}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-8 w-8 text-gray-400 hover:text-white hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-400">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full bg-white text-gray-900 hover:bg-gray-100" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Change Password'}
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
