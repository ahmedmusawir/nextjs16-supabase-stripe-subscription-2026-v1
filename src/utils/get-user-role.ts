import { createClient } from './supabase/server';

// Define the possible application roles as an enum for strict type checking
export enum AppRole {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  MEMBER = 'member'
}

/**
 * Fetches the user's role from the user_roles table in the database.
 * This is the canonical source of truth for authorization.
 * 
 * @param userId - The authenticated user's ID from auth.users
 * @returns The user's role or null if not found
 */
export const getUserRole = async (userId: string): Promise<AppRole | null> => {
  if (!userId) return null;

  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    console.error('Error fetching user role:', error);
    return null;
  }

  return data.role as AppRole;
};
