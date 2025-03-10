import { collection, query, where, getDocs } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import brain from 'brain';
import { firebaseApp } from 'app';
import { ClassModel } from './classModel';
import { LessonModel, getClassLessons } from './lessonModel';
import { StudentProgress, ClassProgress, getStudentProgress } from './studentProgressModel';

// Initialize Firestore
const db = getFirestore(firebaseApp);

// Interfaces for analytics data
export interface ClassStatistics {
  classId: string;
  className: string;
  studentCount: number;
  averageScore: number;
  completionRate: number;
  completedLessons: number;
  inProgressLessons: number;
  notStartedLessons: number;
  difficultyDistribution: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
}

export interface StudentStatistics {
  studentId: string;
  studentName: string;
  averageScore: number;
  completionRate: number;
  strengths: string[];
  areasForImprovement: string[];
  feedback: string;
  lastActive: string;
  totalLessonsCompleted: number;
  totalLessonsAssigned: number;
  // Enhanced feedback from AI
  aiFeedback?: {
    personalizedFeedback: string;
    improvementPlan: string[];
    conceptRecommendations: Array<{name: string; description: string}>;
    practiceExercises: string[];
    motivationalMessage: string;
  };
}

/**
 * Get all student progress records for a specific class
 */
export const getStudentProgressByClass = async (classId: string): Promise<StudentProgress[]> => {
  try {
    // Get all student IDs in the class
    const classDoc = await getDocs(query(collection(db, 'classes'), where('id', '==', classId)));
    if (classDoc.empty) {
      console.error('Class not found');
      return [];
    }
    
    const classData = classDoc.docs[0].data() as ClassModel;
    const studentIds = classData.studentIds || [];
    
    if (studentIds.length === 0) {
      return [];
    }
    
    // Get progress for all students in the class
    const progressPromises = studentIds.map(id => getStudentProgress(id));
    const progressResults = await Promise.all(progressPromises);
    
    // Filter out null results
    return progressResults.filter(progress => progress !== null) as StudentProgress[];
  } catch (error) {
    console.error('Error getting student progress by class:', error);
    return [];
  }
};

/**
 * Calculate statistics for a specific class based on student progress
 */
export const calculateClassStatistics = async (
  classData: ClassModel,
  studentProgressList: StudentProgress[]
): Promise<ClassStatistics> => {
  // Get all lessons for this class
  const lessons = await getClassLessons(classData.id || '');
  const totalLessons = lessons.length;
  
  // Default statistics
  const statistics: ClassStatistics = {
    classId: classData.id || '',
    className: classData.name || '',
    studentCount: studentProgressList.length,
    averageScore: 0,
    completionRate: 0,
    completedLessons: 0,
    inProgressLessons: 0,
    notStartedLessons: 0,
    difficultyDistribution: {
      beginner: 0,
      intermediate: 0,
      advanced: 0
    }
  };
  
  // Calculate difficulty distribution
  lessons.forEach(lesson => {
    if (lesson.difficultyLevel) {
      statistics.difficultyDistribution[lesson.difficultyLevel]++;
    }
  });
  
  // If no students or no lessons, return default stats
  if (studentProgressList.length === 0 || totalLessons === 0) {
    return statistics;
  }
  
  // Calculated aggregated stats
  let totalScores = 0;
  let totalCompletedLessons = 0;
  let totalLessonsInProgress = 0;
  let totalScoredLessons = 0;
  
  // Process student progress
  studentProgressList.forEach(progress => {
    // Find progress for this class
    const classProgress = progress.classProgresses.find(cp => cp.classId === classData.id);
    
    if (classProgress) {
      // Count completed and in-progress lessons
      const completedLessons = classProgress.lessonProgresses.filter(lp => lp.completed);
      const inProgressLessons = classProgress.lessonProgresses.filter(lp => !lp.completed && lp.startedAt);
      
      totalCompletedLessons += completedLessons.length;
      totalLessonsInProgress += inProgressLessons.length;
      
      // Accumulate scores
      completedLessons.forEach(lp => {
        if (lp.score !== undefined) {
          totalScores += lp.score;
          totalScoredLessons++;
        }
      });
    }
  });
  
  // Calculate average and completion statistics
  const totalStudentLessons = totalLessons * studentProgressList.length;
  const averageScore = totalScoredLessons > 0 ? Math.round(totalScores / totalScoredLessons) : 0;
  const completionRate = totalStudentLessons > 0 
    ? Math.round((totalCompletedLessons / totalStudentLessons) * 100) 
    : 0;
  
  const notStartedLessons = totalStudentLessons - totalCompletedLessons - totalLessonsInProgress;
  
  // Update statistics
  statistics.averageScore = averageScore;
  statistics.completionRate = completionRate;
  statistics.completedLessons = totalCompletedLessons;
  statistics.inProgressLessons = totalLessonsInProgress;
  statistics.notStartedLessons = notStartedLessons;
  
  return statistics;
};

/**
 * Get statistics for all classes for a teacher
 */
export const getClassStatistics = async (
  classes: ClassModel[],
  teacherId: string
): Promise<ClassStatistics[]> => {
  if (classes.length === 0) {
    return [];
  }
  
  const statisticsPromises = classes.map(async (classData) => {
    // Get all student progress for this class
    const progressList = await getStudentProgressByClass(classData.id || '');
    
    // Calculate statistics for this class
    return calculateClassStatistics(classData, progressList);
  });
  
  const statistics = await Promise.all(statisticsPromises);
  return statistics;
};

/**
 * Generate AI-like feedback based on student performance
 */
export const generateStudentFeedback = (
  studentProgress: StudentProgress,
  lessons: LessonModel[]
): {
  feedback: string;
  strengths: string[];
  areasForImprovement: string[];
} => {
  // Default return structure
  const result = {
    feedback: '',
    strengths: [] as string[],
    areasForImprovement: [] as string[]
  };
  
  // Map of lesson IDs to lesson objects
  const lessonMap = new Map<string, LessonModel>();
  lessons.forEach(lesson => {
    if (lesson.id) {
      lessonMap.set(lesson.id, lesson);
    }
  });
  
  // Get all completed lessons with their scores
  const completedLessons: { lessonId: string; score: number; difficulty: string; language: string }[] = [];
  
  studentProgress.classProgresses.forEach(cp => {
    cp.lessonProgresses.forEach(lp => {
      if (lp.completed && lp.lessonId && lessonMap.has(lp.lessonId)) {
        const lesson = lessonMap.get(lp.lessonId)!;
        completedLessons.push({
          lessonId: lp.lessonId,
          score: lp.score || 0,
          difficulty: lesson.difficultyLevel,
          language: lesson.programmingLanguage
        });
      }
    });
  });
  
  // Not enough data for feedback
  if (completedLessons.length === 0) {
    result.feedback = 'Complete more lessons to receive personalized feedback on your progress.';
    return result;
  }
  
  // Calculate average score
  const totalScore = completedLessons.reduce((sum, lesson) => sum + lesson.score, 0);
  const averageScore = Math.round(totalScore / completedLessons.length);
  
  // Identify strengths and areas for improvement
  const languagePerformance = new Map<string, { count: number; totalScore: number }>();
  const difficultyPerformance = new Map<string, { count: number; totalScore: number }>();
  
  completedLessons.forEach(lesson => {
    // Track performance by language
    if (!languagePerformance.has(lesson.language)) {
      languagePerformance.set(lesson.language, { count: 0, totalScore: 0 });
    }
    const langPerf = languagePerformance.get(lesson.language)!;
    langPerf.count++;
    langPerf.totalScore += lesson.score;
    
    // Track performance by difficulty
    if (!difficultyPerformance.has(lesson.difficulty)) {
      difficultyPerformance.set(lesson.difficulty, { count: 0, totalScore: 0 });
    }
    const diffPerf = difficultyPerformance.get(lesson.difficulty)!;
    diffPerf.count++;
    diffPerf.totalScore += lesson.score;
  });
  
  // Identify strengths (languages/difficulties with above average performance)
  const strengths: string[] = [];
  languagePerformance.forEach((perf, language) => {
    const langAvg = Math.round(perf.totalScore / perf.count);
    if (langAvg >= 80 && perf.count >= 2) {
      strengths.push(`Strong understanding of ${language} concepts`);
    }
  });
  
  difficultyPerformance.forEach((perf, difficulty) => {
    const diffAvg = Math.round(perf.totalScore / perf.count);
    if (diffAvg >= 80 && perf.count >= 2) {
      strengths.push(`Excels at ${difficulty} level challenges`);
    }
  });
  
  // If no specific strengths identified but overall score is good
  if (strengths.length === 0 && averageScore >= 70) {
    strengths.push('Consistent performance across different lesson types');
  }
  
  // If very few lessons completed but doing well
  if (completedLessons.length < 3 && averageScore >= 80) {
    strengths.push('Strong start with initial lessons');
  }
  
  // Identify areas for improvement
  const areasForImprovement: string[] = [];
  languagePerformance.forEach((perf, language) => {
    const langAvg = Math.round(perf.totalScore / perf.count);
    if (langAvg < 70 && perf.count >= 2) {
      areasForImprovement.push(`Additional practice with ${language} concepts`);
    }
  });
  
  difficultyPerformance.forEach((perf, difficulty) => {
    const diffAvg = Math.round(perf.totalScore / perf.count);
    if (diffAvg < 70 && perf.count >= 2) {
      areasForImprovement.push(`More review needed for ${difficulty} level challenges`);
    }
  });
  
  // If no specific areas identified but overall score needs improvement
  if (areasForImprovement.length === 0 && averageScore < 70) {
    areasForImprovement.push('Review fundamental concepts across lessons');
  }
  
  // If very few lessons completed
  if (completedLessons.length < 3) {
    areasForImprovement.push('Complete more lessons to build a stronger foundation');
  }
  
  // Generate overall feedback
  let feedback = '';
  if (averageScore >= 90) {
    feedback = 'Excellent work! You are demonstrating a strong grasp of programming concepts. '
      + 'Keep challenging yourself with more advanced lessons.';
  } else if (averageScore >= 80) {
    feedback = 'Great progress! You are showing good understanding of the material. '
      + 'Focus on the areas for improvement to further enhance your skills.';
  } else if (averageScore >= 70) {
    feedback = 'Good job! You are making steady progress. '
      + 'Continue practicing and review the concepts in your areas for improvement.';
  } else if (averageScore >= 60) {
    feedback = 'You are on the right track. With more practice and review of core concepts, '
      + 'you can improve your understanding and scores.';
  } else {
    feedback = 'Don\'t worry if you\'re finding these lessons challenging - programming takes practice. '
      + 'Focus on reviewing the fundamentals and consider reaching out to your teacher for additional help.';
  }
  
  result.feedback = feedback;
  result.strengths = strengths;
  result.areasForImprovement = areasForImprovement;
  
  return result;
};

/**
 * Get detailed statistics for a student
 */
/**
 * Get AI-powered personalized feedback for a student using the LLM API
 */
export const getAIFeedback = async (studentStats: StudentStatistics): Promise<{
  personalizedFeedback: string;
  improvementPlan: string[];
  conceptRecommendations: Array<{name: string; description: string}>;
  practiceExercises: string[];
  motivationalMessage: string;
} | null> => {
  try {
    // Prepare the request payload
    const payload = {
      studentName: studentStats.studentName,
      averageScore: studentStats.averageScore,
      completionRate: studentStats.completionRate,
      strengths: studentStats.strengths || [],
      areasForImprovement: studentStats.areasForImprovement || [],
      programmingLanguages: ["JavaScript", "Python"], // This should come from actual student data
      difficultyLevels: ["beginner", "intermediate"], // This should come from actual student data
      totalLessonsCompleted: studentStats.totalLessonsCompleted,
      totalLessonsAssigned: studentStats.totalLessonsAssigned
    };
    
    // Call the API
    const response = await brain.generate_feedback(payload);
    const data = await response.json();
    
    return {
      personalizedFeedback: data.personalizedFeedback,
      improvementPlan: data.improvementPlan,
      conceptRecommendations: data.conceptRecommendations,
      practiceExercises: data.practiceExercises,
      motivationalMessage: data.motivationalMessage
    };
  } catch (error) {
    console.error('Error getting AI feedback:', error);
    return null;
  }
};

export const getStudentDetailedStatistics = async (
  studentId: string,
  studentName: string
): Promise<StudentStatistics | null> => {
  try {
    // Get student progress
    const progress = await getStudentProgress(studentId);
    if (!progress) {
      return null;
    }
    
    // Get all classes the student is enrolled in
    const classesQuery = query(collection(db, 'classes'), where('studentIds', 'array-contains', studentId));
    const classesSnapshot = await getDocs(classesQuery);
    const classes = classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ClassModel[];
    
    // Get all lessons for these classes
    const lessonPromises = classes.map(cls => getClassLessons(cls.id || ''));
    const lessonResults = await Promise.all(lessonPromises);
    const allLessons = lessonResults.flat();
    
    // Calculate base statistics
    const classesWithLessons = new Map<string, number>();
    classes.forEach((cls, index) => {
      if (cls.id) {
        classesWithLessons.set(cls.id, lessonResults[index].length);
      }
    });
    
    let totalLessonsAssigned = 0;
    let totalLessonsCompleted = 0;
    let totalScore = 0;
    let scoredLessonsCount = 0;
    let lastActiveDate = '';
    
    // Process class progresses
    progress.classProgresses.forEach(cp => {
      // Count assigned lessons
      const lessonsInClass = classesWithLessons.get(cp.classId) || 0;
      totalLessonsAssigned += lessonsInClass;
      
      // Count completed lessons and scores
      const completedLessons = cp.lessonProgresses.filter(lp => lp.completed);
      totalLessonsCompleted += completedLessons.length;
      
      completedLessons.forEach(lp => {
        if (lp.score !== undefined) {
          totalScore += lp.score;
          scoredLessonsCount++;
        }
      });
      
      // Track last active date
      if (cp.lastAccessedAt && (!lastActiveDate || cp.lastAccessedAt > lastActiveDate)) {
        lastActiveDate = cp.lastAccessedAt;
      }
    });
    
    // Calculate averages
    const averageScore = scoredLessonsCount > 0 ? Math.round(totalScore / scoredLessonsCount) : 0;
    const completionRate = totalLessonsAssigned > 0 
      ? Math.round((totalLessonsCompleted / totalLessonsAssigned) * 100) 
      : 0;
    
    // Generate personalized feedback
    const feedbackData = generateStudentFeedback(progress, allLessons);
    
    return {
      studentId,
      studentName,
      averageScore,
      completionRate,
      strengths: feedbackData.strengths,
      areasForImprovement: feedbackData.areasForImprovement,
      feedback: feedbackData.feedback,
      lastActive: lastActiveDate,
      totalLessonsCompleted,
      totalLessonsAssigned
    };
  } catch (error) {
    console.error('Error getting student detailed statistics:', error);
    return null;
  }
};
