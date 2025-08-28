export type Username = string;

export type Stage = 'PENDING' | 'REQUESTED' | 'UNFOLLOWED' | 'FOLLOW_BACK';

export interface Progress {
  step: string;
  detail?: string;
  count?: number;
  total?: number;
}

export interface AutomationConfig {
  myUsername: Username;
  maxUnfollowPerRun: number;
  followTargetCap: number;
}
