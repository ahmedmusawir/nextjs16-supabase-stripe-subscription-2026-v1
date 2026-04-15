import type { Subscription } from './subscription';

export type UserRole = 'superadmin' | 'admin' | 'member';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  subscription: Subscription;
}
