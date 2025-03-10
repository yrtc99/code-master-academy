import { StudentProgress, LessonProgress } from './studentProgressModel';
import { ClassModel } from './classModel';
import { LessonModel } from './lessonModel';

export interface CourseHistoryItem {
  courseId: string;
  courseName: string;
  enrollmentDate: string;
  completionDate?: string;
  lastAccessedDate: string;
  progress: number; // Percentage of course completed
  completedLessons: number;
  totalLessons: number;
  averageScore: number;
  status: 'inProgress' | 'completed' | 'notStarted' | 'revisiting';
  lessonProgresses: LessonProgress[];
}

/**
 * Convert class progress data into course history format
 */
export const getCourseHistory = (
  studentProgress: StudentProgress | null,
  enrolledClasses: ClassModel[],
  classLessonsMap: Record<string, LessonModel[]>
): CourseHistoryItem[] => {
  if (!studentProgress) return [];
  
  const courseHistory: CourseHistoryItem[] = [];
  
  // Process each enrolled class
  enrolledClasses.forEach(classItem => {
    if (!classItem.id) return;
    
    // Find the corresponding class progress
    const classProgress = studentProgress.classProgresses.find(cp => cp.classId === classItem.id);
    if (!classProgress) return;
    
    // Get lessons for this class
    const lessons = classLessonsMap[classItem.id] || [];
    const totalLessons = lessons.length;
    
    // Calculate completed lessons and average score
    const completedLessonProgresses = classProgress.lessonProgresses.filter(lp => lp.completed);
    const completedLessons = completedLessonProgresses.length;
    
    let totalScore = 0;
    let scoredLessonsCount = 0;
    
    completedLessonProgresses.forEach(lp => {
      if (lp.score !== undefined) {
        totalScore += lp.score;
        scoredLessonsCount++;
      }
    });
    
    const averageScore = scoredLessonsCount > 0 ? Math.round(totalScore / scoredLessonsCount) : 0;
    const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    
    // Determine course status
    let status: 'inProgress' | 'completed' | 'notStarted' | 'revisiting' = 'notStarted';
    
    if (classProgress.lessonProgresses.length === 0) {
      status = 'notStarted';
    } else if (completedLessons === 0) {
      status = 'inProgress';
    } else if (completedLessons === totalLessons) {
      status = 'completed';
    } else {
      // Check if the student is revisiting (has completed lessons but is still working on the course)
      const hasRecentActivity = classProgress.lessonProgresses.some(lp => {
        if (!lp.completed && lp.lastAccessedAt) {
          // Check if there has been activity in the last 7 days
          const lastAccessed = new Date(lp.lastAccessedAt);
          const now = new Date();
          const daysDiff = Math.floor(
            (now.getTime() - lastAccessed.getTime()) / (1000 * 60 * 60 * 24)
          );
          return daysDiff < 7;
        }
        return false;
      });
      
      status = hasRecentActivity && completedLessons > 0 ? 'revisiting' : 'inProgress';
    }
    
    // Determine completion date if course is completed
    let completionDate: string | undefined;
    if (status === 'completed' && completedLessonProgresses.length > 0) {
      // Find the latest completion date among all lessons
      const completionDates = completedLessonProgresses
        .map(lp => lp.completedAt)
        .filter(date => date) as string[];
      
      if (completionDates.length > 0) {
        completionDate = completionDates.reduce((latest, current) => {
          return current > latest ? current : latest;
        });
      }
    }
    
    // Create course history item
    courseHistory.push({
      courseId: classItem.id,
      courseName: classItem.name || 'Unnamed Course',
      enrollmentDate: classProgress.enrolledAt,
      completionDate,
      lastAccessedDate: classProgress.lastAccessedAt,
      progress,
      completedLessons,
      totalLessons,
      averageScore,
      status,
      lessonProgresses: classProgress.lessonProgresses
    });
  });
  
  // Sort by last accessed date (most recent first)
  return courseHistory.sort((a, b) => {
    return new Date(b.lastAccessedDate).getTime() - new Date(a.lastAccessedDate).getTime();
  });
};

/**
 * Filter course history by status
 */
export const filterCourseHistory = (
  courseHistory: CourseHistoryItem[],
  status?: 'inProgress' | 'completed' | 'notStarted' | 'revisiting' | 'all'
): CourseHistoryItem[] => {
  if (!status || status === 'all') return courseHistory;
  return courseHistory.filter(course => course.status === status);
};

/**
 * Get course details by ID from course history
 */
export const getCourseById = (
  courseHistory: CourseHistoryItem[],
  courseId: string
): CourseHistoryItem | undefined => {
  return courseHistory.find(course => course.courseId === courseId);
};
