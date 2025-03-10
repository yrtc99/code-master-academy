import { getUserProfile } from './userRoles';
import type { UserRole } from './userRoles';

/**
 * Get a user's role from Firestore
 * @param uid The user's ID
 * @returns The user's role or null if not found
 */
export const getUserRole = async (uid: string): Promise<UserRole | null> => {
  try {
    const userProfile = await getUserProfile(uid);
    return userProfile ? userProfile.role : null;
  } catch (error) {
    console.error('Error fetching user role:', error);
    return null;
  }
};
