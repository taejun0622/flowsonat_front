export type UserStatus = 'TRIAL' | 'PAID' | 'TRIAL_OVER';

export interface UserWithStatus {
  id: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at?: string | null;
  status?: UserStatus | null;
}
