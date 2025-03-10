import { collection, addDoc, getDocs, getDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { firebaseApp } from 'app';

// Initialize Firestore
const db = getFirestore(firebaseApp);

export type AssessmentType = 'coding' | 'dragAndDrop' | 'multipleChoice';

export interface CodingTestCase {
  input: string;
  expectedOutput: string;
  description?: string;
}

export interface DragAndDropItem {
  id: string;
  text: string;
  isBlank: boolean;
}

export interface DragAndDropTest {
  instruction: string;
  content: DragAndDropItem[];
  options: string[]; // Available options for students to drag
  correctAnswers: Record<string, string>; // Maps blank ID to correct option
}

export interface MultipleChoiceOption {
  id: string;
  text: string;
}

export interface MultipleChoiceQuestion {
  question: string;
  options: MultipleChoiceOption[];
  correctOptionId: string;
  explanation?: string;
}

export type TestCase = CodingTestCase;

export interface LessonModel {
  id?: string;
  title: string;
  description: string;
  programmingLanguage: string;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  assessmentType: AssessmentType;
  codeExample: string;
  testCases: TestCase[];
  dragAndDropTests?: DragAndDropTest[];
  multipleChoiceQuestions?: MultipleChoiceQuestion[];
  classId?: string; // Optional for lessons not tied to a specific class
  teacherId: string;
  createdAt: string;
  updatedAt: string;
  isPublished: boolean;
}

export interface LessonFormData {
  title: string;
  description: string;
  programmingLanguage: string;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  assessmentType: AssessmentType;
  codeExample: string;
  testCases: TestCase[];
  dragAndDropTests?: DragAndDropTest[];
  multipleChoiceQuestions?: MultipleChoiceQuestion[];
  classId?: string;
  isPublished?: boolean;
}

/**
 * Create a new lesson
 */
export const createLesson = async (teacherId: string, lessonData: LessonFormData): Promise<string> => {
  try {
    const now = new Date().toISOString();
    
    // Create a clean object without undefined values for Firestore
    const lessonBase = {
      ...lessonData,
      teacherId,
      createdAt: now,
      updatedAt: now,
      isPublished: lessonData.isPublished ?? false,
      assessmentType: lessonData.assessmentType || 'coding',
    };
    
    // Add the appropriate assessment data based on type
    let lessonWithMetadata: any = {
      ...lessonBase,
      // Always include empty arrays instead of undefined
      testCases: [],
      dragAndDropTests: [],
      multipleChoiceQuestions: []
    };
    
    // Then populate the correct assessment type
    if (lessonData.assessmentType === 'coding') {
      lessonWithMetadata.testCases = lessonData.testCases || [];
    } else if (lessonData.assessmentType === 'dragAndDrop') {
      lessonWithMetadata.dragAndDropTests = lessonData.dragAndDropTests || [];
    } else if (lessonData.assessmentType === 'multipleChoice') {
      lessonWithMetadata.multipleChoiceQuestions = lessonData.multipleChoiceQuestions || [];
    }
    
    const docRef = await addDoc(collection(db, 'lessons'), lessonWithMetadata);
    return docRef.id;
  } catch (error) {
    console.error('Error creating lesson:', error);
    throw error;
  }
};

/**
 * Get all lessons for a teacher
 */
export const getTeacherLessons = async (teacherId: string): Promise<LessonModel[]> => {
  try {
    const lessonsQuery = query(collection(db, 'lessons'), where('teacherId', '==', teacherId));
    const querySnapshot = await getDocs(lessonsQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as LessonModel[];
  } catch (error) {
    console.error('Error fetching teacher lessons:', error);
    return [];
  }
};

/**
 * Get all lessons for a specific class
 */
export const getClassLessons = async (classId: string): Promise<LessonModel[]> => {
  try {
    const lessonsQuery = query(collection(db, 'lessons'), where('classId', '==', classId));
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
 * Subscribe to lessons for a teacher with real-time updates
 */
export const subscribeToTeacherLessons = (
  teacherId: string,
  onLessonsUpdate: (lessons: LessonModel[]) => void
) => {
  const lessonsQuery = query(collection(db, 'lessons'), where('teacherId', '==', teacherId));
  
  return onSnapshot(lessonsQuery, (querySnapshot) => {
    const lessons = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as LessonModel[];
    
    onLessonsUpdate(lessons);
  }, (error) => {
    console.error('Error subscribing to lessons:', error);
    onLessonsUpdate([]);
  });
};

/**
 * Subscribe to lessons for a specific class with real-time updates
 */
export const subscribeToClassLessons = (
  classId: string,
  onLessonsUpdate: (lessons: LessonModel[]) => void
) => {
  const lessonsQuery = query(collection(db, 'lessons'), where('classId', '==', classId));
  
  return onSnapshot(lessonsQuery, (querySnapshot) => {
    const lessons = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as LessonModel[];
    
    onLessonsUpdate(lessons);
  }, (error) => {
    console.error('Error subscribing to class lessons:', error);
    onLessonsUpdate([]);
  });
};

/**
 * Get a lesson by ID
 */
export const getLessonById = async (lessonId: string): Promise<LessonModel | null> => {
  try {
    const lessonDoc = await getDoc(doc(db, 'lessons', lessonId));
    
    if (lessonDoc.exists()) {
      return {
        id: lessonDoc.id,
        ...lessonDoc.data()
      } as LessonModel;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching lesson:', error);
    return null;
  }
};

/**
 * Update a lesson
 */
export const updateLesson = async (lessonId: string, updates: Partial<LessonModel>): Promise<void> => {
  try {
    const lessonRef = doc(db, 'lessons', lessonId);
    
    // Add updated timestamp
    const updatedData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await updateDoc(lessonRef, updatedData);
  } catch (error) {
    console.error('Error updating lesson:', error);
    throw error;
  }
};

/**
 * Delete a lesson
 */
export const deleteLesson = async (lessonId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'lessons', lessonId));
  } catch (error) {
    console.error('Error deleting lesson:', error);
    throw error;
  }
};

/**
 * Publish or unpublish a lesson
 */
export const toggleLessonPublished = async (lessonId: string, isPublished: boolean): Promise<void> => {
  try {
    await updateLesson(lessonId, { isPublished });
  } catch (error) {
    console.error(`Error ${isPublished ? 'publishing' : 'unpublishing'} lesson:`, error);
    throw error;
  }
};
