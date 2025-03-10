import { collection, addDoc, getDocs, getDoc, updateDoc, doc, query, where, onSnapshot } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { firebaseApp } from 'app';
import { ClassModel } from './classModel';
import { LessonModel } from './lessonModel';

// Initialize Firestore
const db = getFirestore(firebaseApp);

export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  score: number; // Percentage score from 0-100
  lastAccessedAt: string;
  startedAt: string;
  completedAt?: string;
  answers?: Record<string, any>; // Answers submitted by the student
}

export interface ClassProgress {
  classId: string;
  enrolledAt: string;
  lastAccessedAt: string;
  lessonProgresses: LessonProgress[];
}

export interface StudentProgress {
  id?: string;
  studentId: string;
  classProgresses: ClassProgress[];
  updatedAt: string;
}

/**
 * Initialize a student's progress record if it doesn't exist
 */
export const initializeStudentProgress = async (studentId: string): Promise<string> => {
  try {
    // Check if student progress already exists
    const progressQuery = query(collection(db, 'studentProgress'), where('studentId', '==', studentId));
    const querySnapshot = await getDocs(progressQuery);
    
    if (!querySnapshot.empty) {
      // Student progress record already exists
      return querySnapshot.docs[0].id;
    }
    
    // Create a new student progress record
    const now = new Date().toISOString();
    const studentProgress: Omit<StudentProgress, 'id'> = {
      studentId,
      classProgresses: [],
      updatedAt: now
    };
    
    const docRef = await addDoc(collection(db, 'studentProgress'), studentProgress);
    return docRef.id;
  } catch (error) {
    console.error('Error initializing student progress:', error);
    throw error;
  }
};

/**
 * Get a student's progress
 */
export const getStudentProgress = async (studentId: string): Promise<StudentProgress | null> => {
  try {
    const progressQuery = query(collection(db, 'studentProgress'), where('studentId', '==', studentId));
    const querySnapshot = await getDocs(progressQuery);
    
    if (querySnapshot.empty) {
      // No progress record found, initialize one
      const progressId = await initializeStudentProgress(studentId);
      const progressDoc = await getDoc(doc(db, 'studentProgress', progressId));
      
      if (progressDoc.exists()) {
        return {
          id: progressDoc.id,
          ...progressDoc.data()
        } as StudentProgress;
      }
      return null;
    }
    
    return {
      id: querySnapshot.docs[0].id,
      ...querySnapshot.docs[0].data()
    } as StudentProgress;
  } catch (error) {
    console.error('Error getting student progress:', error);
    return null;
  }
};

/**
 * Subscribe to a student's progress
 */
export const subscribeToStudentProgress = (
  studentId: string,
  onProgressUpdate: (progress: StudentProgress | null) => void
) => {
  const progressQuery = query(collection(db, 'studentProgress'), where('studentId', '==', studentId));
  
  return onSnapshot(progressQuery, async (querySnapshot) => {
    if (querySnapshot.empty) {
      // No progress record found, initialize one
      try {
        const progressId = await initializeStudentProgress(studentId);
        const progressDoc = await getDoc(doc(db, 'studentProgress', progressId));
        
        if (progressDoc.exists()) {
          onProgressUpdate({
            id: progressDoc.id,
            ...progressDoc.data()
          } as StudentProgress);
        } else {
          onProgressUpdate(null);
        }
      } catch (error) {
        console.error('Error initializing student progress:', error);
        onProgressUpdate(null);
      }
    } else {
      onProgressUpdate({
        id: querySnapshot.docs[0].id,
        ...querySnapshot.docs[0].data()
      } as StudentProgress);
    }
  }, (error) => {
    console.error('Error subscribing to student progress:', error);
    onProgressUpdate(null);
  });
};

/**
 * Get the classes a student is enrolled in
 */
export const getStudentEnrolledClasses = async (studentId: string): Promise<ClassModel[]> => {
  try {
    const classesQuery = query(collection(db, 'classes'), where('studentIds', 'array-contains', studentId));
    const querySnapshot = await getDocs(classesQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ClassModel[];
  } catch (error) {
    console.error('Error fetching enrolled classes:', error);
    return [];
  }
};

/**
 * Subscribe to classes a student is enrolled in
 */
export const subscribeToStudentEnrolledClasses = (
  studentId: string,
  onClassesUpdate: (classes: ClassModel[]) => void
) => {
  const classesQuery = query(collection(db, 'classes'), where('studentIds', 'array-contains', studentId));
  
  return onSnapshot(classesQuery, (querySnapshot) => {
    const classes = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ClassModel[];
    
    onClassesUpdate(classes);
  }, (error) => {
    console.error('Error subscribing to enrolled classes:', error);
    onClassesUpdate([]);
  });
};

/**
 * Get lessons for a class
 */
export const getClassLessons = async (classId: string): Promise<LessonModel[]> => {
  try {
    const lessonsQuery = query(collection(db, 'lessons'), where('classId', '==', classId), where('isPublished', '==', true));
    const querySnapshot = await getDocs(lessonsQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as LessonModel[];
  } catch (error) {
    console.error('Error fetching class lessons:', error);
    return [];
  }
};

/**
 * Calculate a student's progress percentage for a class
 */
export const calculateClassProgress = (classProgress: ClassProgress | undefined, totalLessons: number): number => {
  if (!classProgress || !classProgress.lessonProgresses || classProgress.lessonProgresses.length === 0 || totalLessons === 0) {
    return 0;
  }
  
  const completedLessons = classProgress.lessonProgresses.filter(lp => lp.completed).length;
  return Math.round((completedLessons / totalLessons) * 100);
};

/**
 * Update a student's progress for a specific lesson
 */
export const updateLessonProgress = async (
  studentProgressId: string,
  classId: string,
  lessonProgress: LessonProgress
): Promise<void> => {
  try {
    // Get the current student progress
    const progressDoc = await getDoc(doc(db, 'studentProgress', studentProgressId));
    
    if (!progressDoc.exists()) {
      throw new Error('Student progress not found');
    }
    
    const studentProgress = progressDoc.data() as StudentProgress;
    const now = new Date().toISOString();
    
    // Find the class progress
    let classProgressIndex = studentProgress.classProgresses.findIndex(cp => cp.classId === classId);
    
    if (classProgressIndex === -1) {
      // Class progress not found, create it
      studentProgress.classProgresses.push({
        classId,
        enrolledAt: now,
        lastAccessedAt: now,
        lessonProgresses: [lessonProgress]
      });
    } else {
      // Update the class's lastAccessedAt
      studentProgress.classProgresses[classProgressIndex].lastAccessedAt = now;
      
      // Find the lesson progress
      const lessonProgressIndex = studentProgress.classProgresses[classProgressIndex].lessonProgresses
        .findIndex(lp => lp.lessonId === lessonProgress.lessonId);
      
      if (lessonProgressIndex === -1) {
        // Lesson progress not found, add it
        studentProgress.classProgresses[classProgressIndex].lessonProgresses.push(lessonProgress);
      } else {
        // Update the lesson progress
        studentProgress.classProgresses[classProgressIndex].lessonProgresses[lessonProgressIndex] = {
          ...studentProgress.classProgresses[classProgressIndex].lessonProgresses[lessonProgressIndex],
          ...lessonProgress,
          lastAccessedAt: now
        };
      }
    }
    
    // Update the student progress document
    await updateDoc(doc(db, 'studentProgress', studentProgressId), {
      classProgresses: studentProgress.classProgresses,
      updatedAt: now
    });
  } catch (error) {
    console.error('Error updating lesson progress:', error);
    throw error;
  }
};

/**
 * Find the next lesson a student should work on in a class
 */
export const findNextLessonToComplete = (
  classProgress: ClassProgress | undefined,
  lessons: LessonModel[]
): LessonModel | null => {
  if (!classProgress || lessons.length === 0) {
    return lessons[0] || null;
  }
  
  // Get IDs of completed lessons
  const completedLessonIds = new Set(
    classProgress.lessonProgresses
      .filter(lp => lp.completed)
      .map(lp => lp.lessonId)
  );
  
  // Find the first lesson that hasn't been completed
  const nextLesson = lessons.find(lesson => !completedLessonIds.has(lesson.id || ''));
  
  return nextLesson || null;
};

/**
 * Get overall student statistics
 */
export const getStudentStatistics = (studentProgress: StudentProgress | null): {
  totalClassesEnrolled: number;
  totalLessonsCompleted: number;
  averageScore: number;
} => {
  if (!studentProgress) {
    return {
      totalClassesEnrolled: 0,
      totalLessonsCompleted: 0,
      averageScore: 0
    };
  }
  
  const totalClassesEnrolled = studentProgress.classProgresses.length;
  
  let totalLessonsCompleted = 0;
  let totalScores = 0;
  let scoredLessonsCount = 0;
  
  // Iterate through all class progresses
  studentProgress.classProgresses.forEach(classProgress => {
    // Count completed lessons
    const completedLessons = classProgress.lessonProgresses.filter(lp => lp.completed);
    totalLessonsCompleted += completedLessons.length;
    
    // Sum scores for lessons with scores
    completedLessons.forEach(lesson => {
      if (lesson.score !== undefined) {
        totalScores += lesson.score;
        scoredLessonsCount++;
      }
    });
  });
  
  // Calculate average score
  const averageScore = scoredLessonsCount > 0 ? Math.round(totalScores / scoredLessonsCount) : 0;
  
  return {
    totalClassesEnrolled,
    totalLessonsCompleted,
    averageScore
  };
};