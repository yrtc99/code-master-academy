import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { firebaseApp } from 'app';

export type UserRole = 'teacher' | 'student';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  createdAt: string;
}

// Initialize Firestore
const db = getFirestore(firebaseApp);

/**
 * Save a user's role to Firestore
 */
export const saveUserRole = async (uid: string, userProfile: Omit<UserProfile, 'uid'>): Promise<void> => {
  try {
    await setDoc(doc(db, 'users', uid), userProfile);
  } catch (error) {
    console.error('Error saving user role:', error);
    throw error;
  }
};

/**
 * Get a user's profile from Firestore
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data() as Omit<UserProfile, 'uid'>;
      return {
        uid,
        ...userData
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

/**
 * Get all users with a specific role
 */
export const getUsersByRole = async (role: UserRole): Promise<UserProfile[]> => {
  try {
    const usersQuery = query(collection(db, 'users'), where('role', '==', role));
    const querySnapshot = await getDocs(usersQuery);
    
    return querySnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    })) as UserProfile[];
  } catch (error) {
    console.error(`Error fetching ${role} users:`, error);
    return [];
  }
};

/**
 * Get all student users
 */
export const getAllStudents = async (): Promise<UserProfile[]> => {
  return getUsersByRole('student');
};

/**
 * Get all users by their IDs
 */
/**
 * Get a user's role from Firestore
 * Returns the user's role or null if not found
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

/**
 * Get multiple users by their IDs
 */
export const getUsersByIds = async (userIds: string[]): Promise<UserProfile[]> => {
  try {
    if (!userIds.length) return [];
    
    // Create an array of promises for each user fetching operation
    const userPromises = userIds.map(uid => getUserProfile(uid));
    
    // Resolve all promises and filter out any null results
    const users = await Promise.all(userPromises);
    return users.filter((user): user is UserProfile => user !== null);
  } catch (error) {
    console.error('Error fetching users by IDs:', error);
    return [];
  }
};
