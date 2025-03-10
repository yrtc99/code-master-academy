import { collection, addDoc, getDocs, getDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { firebaseApp } from 'app';

// Initialize Firestore
const db = getFirestore(firebaseApp);

export interface ClassModel {
  id?: string;
  name: string;
  description: string;
  teacherId: string;
  createdAt: string;
  updatedAt: string;
  // Optional fields
  enrollmentCode?: string;
  imageUrl?: string;
  studentIds?: string[];
  isArchived?: boolean;
}

export interface ClassFormData {
  name: string;
  description: string;
  enrollmentCode?: string;
  imageUrl?: string;
}

/**
 * Create a new class
 */
export const createClass = async (teacherId: string, classData: ClassFormData): Promise<string> => {
  try {
    const now = new Date().toISOString();
    
    const classWithMetadata: Omit<ClassModel, 'id'> = {
      ...classData,
      teacherId,
      createdAt: now,
      updatedAt: now,
      studentIds: [],
      isArchived: false
    };
    
    const docRef = await addDoc(collection(db, 'classes'), classWithMetadata);
    return docRef.id;
  } catch (error) {
    console.error('Error creating class:', error);
    throw error;
  }
};

/**
 * Get all classes for a teacher
 */
export const getTeacherClasses = async (teacherId: string): Promise<ClassModel[]> => {
  try {
    const classesQuery = query(collection(db, 'classes'), where('teacherId', '==', teacherId));
    const querySnapshot = await getDocs(classesQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ClassModel[];
  } catch (error) {
    console.error('Error fetching teacher classes:', error);
    return [];
  }
};

/**
 * Subscribe to classes for a teacher with real-time updates
 */
export const subscribeToTeacherClasses = (
  teacherId: string,
  onClassesUpdate: (classes: ClassModel[]) => void
) => {
  const classesQuery = query(collection(db, 'classes'), where('teacherId', '==', teacherId));
  
  return onSnapshot(classesQuery, (querySnapshot) => {
    const classes = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ClassModel[];
    
    onClassesUpdate(classes);
  }, (error) => {
    console.error('Error subscribing to classes:', error);
    onClassesUpdate([]);
  });
};

/**
 * Get a class by ID
 */
export const getClassById = async (classId: string): Promise<ClassModel | null> => {
  try {
    const classDoc = await getDoc(doc(db, 'classes', classId));
    
    if (classDoc.exists()) {
      return {
        id: classDoc.id,
        ...classDoc.data()
      } as ClassModel;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching class:', error);
    return null;
  }
};

/**
 * Update a class
 */
export const updateClass = async (classId: string, updates: Partial<ClassModel>): Promise<void> => {
  try {
    const classRef = doc(db, 'classes', classId);
    
    // Add updated timestamp
    const updatedData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await updateDoc(classRef, updatedData);
  } catch (error) {
    console.error('Error updating class:', error);
    throw error;
  }
};

/**
 * Delete a class
 */
export const deleteClass = async (classId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'classes', classId));
  } catch (error) {
    console.error('Error deleting class:', error);
    throw error;
  }
};

/**
 * Archive a class (soft delete)
 */
export const archiveClass = async (classId: string): Promise<void> => {
  try {
    await updateClass(classId, { isArchived: true });
  } catch (error) {
    console.error('Error archiving class:', error);
    throw error;
  }
};

/**
 * Get student count for a teacher
 */
export const getTeacherStudentCount = async (teacherId: string): Promise<number> => {
  try {
    const classes = await getTeacherClasses(teacherId);
    
    // Calculate total unique students across all classes
    const uniqueStudentIds = new Set<string>();
    
    classes.forEach(cls => {
      cls.studentIds?.forEach(studentId => uniqueStudentIds.add(studentId));
    });
    
    return uniqueStudentIds.size;
  } catch (error) {
    console.error('Error counting students:', error);
    return 0;
  }
};

/**
 * Enroll a student in a class
 */
export const enrollStudentInClass = async (classId: string, studentId: string): Promise<void> => {
  try {
    const classData = await getClassById(classId);
    if (!classData) throw new Error('Class not found');
    
    // Create a new array with existing students and the new one, avoiding duplicates
    const currentStudentIds = classData.studentIds || [];
    if (!currentStudentIds.includes(studentId)) {
      const updatedStudentIds = [...currentStudentIds, studentId];
      await updateClass(classId, { studentIds: updatedStudentIds });
    }
  } catch (error) {
    console.error('Error enrolling student:', error);
    throw error;
  }
};

/**
 * Remove a student from a class
 */
export const removeStudentFromClass = async (classId: string, studentId: string): Promise<void> => {
  try {
    const classData = await getClassById(classId);
    if (!classData) throw new Error('Class not found');
    
    const currentStudentIds = classData.studentIds || [];
    const updatedStudentIds = currentStudentIds.filter(id => id !== studentId);
    
    await updateClass(classId, { studentIds: updatedStudentIds });
  } catch (error) {
    console.error('Error removing student:', error);
    throw error;
  }
};

/**
 * Get all students enrolled in a specific class with their full profile information
 */
export const getStudentsForClass = async (classId: string): Promise<import('./userRoles').UserProfile[]> => {
  try {
    const classData = await getClassById(classId);
    if (!classData) return [];
    
    const studentIds = classData.studentIds || [];
    if (studentIds.length === 0) return [];
    
    // Import directly here to avoid circular dependency issues
    const { getUsersByIds } = await import('./userRoles');
    return getUsersByIds(studentIds);
  } catch (error) {
    console.error('Error fetching class students:', error);
    return [];
  }
};
