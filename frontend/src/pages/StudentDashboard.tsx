import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useUserGuardContext } from 'app';
import { getUserProfile, UserProfile, UserRole } from '../utils/userRoles';
import { ClassModel, getClassById } from '../utils/classModel';
import { LessonModel, getClassLessons } from '../utils/lessonModel';
import { 
  StudentProgress, 
  subscribeToStudentProgress, 
  subscribeToStudentEnrolledClasses,
  calculateClassProgress,
  getStudentStatistics,
  findNextLessonToComplete,
  updateLessonProgress
} from '../utils/studentProgressModel';
import { StudentClassCard } from '../components/StudentClassCard';
import { StudentPerformance } from '../components/StudentPerformance';
import { Button } from '@/components/ui/button';
import { NeoLayout } from '../components/NeoLayout';


export default function StudentDashboard() {
  const { user } = useUserGuardContext();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolledClasses, setEnrolledClasses] = useState<ClassModel[]>([]);
  const [studentProgress, setStudentProgress] = useState<StudentProgress | null>(null);
  const [classLessonsMap, setClassLessonsMap] = useState<Record<string, LessonModel[]>>({});
  const [classLessonsLoading, setClassLessonsLoading] = useState<Record<string, boolean>>({});
  const [isBrowseClassesOpen, setIsBrowseClassesOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.uid) {
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user?.uid]);
  
  // Subscribe to student progress and enrolled classes
  useEffect(() => {
    if (!userProfile?.uid) return;
    
    // Subscribe to real-time updates for student progress
    const unsubscribeProgress = subscribeToStudentProgress(
      userProfile.uid,
      (progress) => {
        setStudentProgress(progress);
      }
    );
    
    // Subscribe to real-time updates for enrolled classes
    const unsubscribeClasses = subscribeToStudentEnrolledClasses(
      userProfile.uid,
      (classes) => {
        setEnrolledClasses(classes);
        
        // Initialize lesson loading state for each class
        const newClassLessonsLoading: Record<string, boolean> = {};
        classes.forEach(cls => {
          if (cls.id && !classLessonsMap[cls.id]) {
            newClassLessonsLoading[cls.id] = true;
          }
        });
        setClassLessonsLoading(prev => ({ ...prev, ...newClassLessonsLoading }));
        
        // Fetch lessons for each class
        classes.forEach(async (cls) => {
          if (cls.id && !classLessonsMap[cls.id]) {
            try {
              const lessons = await getClassLessons(cls.id);
              setClassLessonsMap(prev => ({
                ...prev,
                [cls.id!]: lessons
              }));
            } catch (error) {
              console.error(`Error fetching lessons for class ${cls.id}:`, error);
            } finally {
              setClassLessonsLoading(prev => ({
                ...prev,
                [cls.id!]: false
              }));
            }
          }
        });
      }
    );
    
    return () => {
      unsubscribeProgress();
      unsubscribeClasses();
    };
  }, [userProfile?.uid, classLessonsMap]);
  
  const handleContinueClass = async (classId: string) => {
    // Find the class progress
    const classProgress = studentProgress?.classProgresses.find(cp => cp.classId === classId);
    
    // Get the lessons for this class
    const lessons = classLessonsMap[classId] || [];
    
    // Find the next lesson to complete
    const nextLesson = findNextLessonToComplete(classProgress, lessons);
    
    if (nextLesson?.id) {
      // Navigate to the lesson view with classId and lessonId as query parameters
      navigate(`/LessonView?classId=${classId}&lessonId=${nextLesson.id}`);
    } else {
      alert('You have completed all lessons in this class!');
    }
  };
  
  const handleViewClassDetails = (classId: string) => {
    // For now, just show an alert. Later this will navigate to class detail page
    alert(`Viewing class details for ID: ${classId}`);
    // Future implementation: navigate(`/class/${classId}`);
  };
  
  // Handle class enrollment
  const handleEnroll = (classId: string) => {
    // The actual enrollment is handled in the BrowseClassesDialog component
    // This function is called after successful enrollment
    console.log(`Successfully enrolled in class: ${classId}`);
    
    // For testing purposes, let's create some fake progress data
    if (studentProgress?.id) {
      const createTestProgressData = async () => {
        try {
          // Get lessons for this class
          const lessons = await getClassLessons(classId);
          
          // If there are lessons, mark the first one as started
          if (lessons.length > 0 && lessons[0].id) {
            const now = new Date().toISOString();
            
            // Create test progress for the first lesson
            await updateLessonProgress(
              studentProgress.id!,
              classId,
              {
                lessonId: lessons[0].id,
                completed: false,
                score: 0,
                lastAccessedAt: now,
                startedAt: now
              }
            );
            
            console.log('Created test progress data for newly enrolled class');
          }
        } catch (error) {
          console.error('Error creating test progress data:', error);
        }
      };
      
      createTestProgressData();
    }
  };

  if (loading) {
    return (
      <NeoLayout>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-3 border-b-3 border-black"></div>
        </div>
      </NeoLayout>
    );
  }

  // Check if the user is a student, if not redirect to unauthorized
  if (!userProfile || userProfile.role !== 'student') {
    return <Navigate to="/unauthorized" />;
  }

  return (
    <NeoLayout title="Student Dashboard">
      <div className="mb-8">
        <p className="text-lg font-bold mb-6">Track your progress and access your courses</p>
        <div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="neo-card neo-primary">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full border-3 border-black mr-3">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Enrolled Courses</dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">{enrolledClasses.length}</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-sm">
                    <button 
                      onClick={() => {
                        const coursesSection = document.getElementById('courses');
                        if (coursesSection) {
                          coursesSection.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className="neo-button py-2 px-3 text-sm bg-white text-black w-full"
                    >
                      View all courses
                    </button>
                  </div>
                </div>
              </div>

              <div className="neo-card neo-success">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full border-3 border-black mr-3">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Completed Lessons</dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {getStudentStatistics(studentProgress).totalLessonsCompleted}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-sm">
                    <button 
                      onClick={() => {
                        alert('Progress details view will be implemented in a future update.');
                        // Future implementation: navigate('/progress-details');
                      }}
                      className="neo-button py-2 px-3 text-sm bg-white text-black w-full"
                    >
                      View progress details
                    </button>
                  </div>
                </div>
              </div>

              <div className="neo-card neo-accent">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full border-3 border-black mr-3">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Average Score</dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {getStudentStatistics(studentProgress).averageScore}%
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-sm">
                    <button 
                      onClick={() => {
                        alert('Detailed score analysis will be implemented in a future update.');
                        // Future implementation: navigate('/score-details');
                      }}
                      className="neo-button py-2 px-3 text-sm bg-white text-black w-full"
                    >
                      View detailed scores
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Performance Analytics Section */}
            <div className="mt-12">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Your Performance</h3>
                <button
                  onClick={() => navigate("/course-history")}
                  className="neo-button bg-white text-black"
                >
                  <span>View Learning History</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
                    <path d="M4 11v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8" />
                    <path d="M4 11V7a1 1 0 0 1 .293-.707l3.414-3.414A1 1 0 0 1 8.414 2.586L12 6.172l3.586-3.586a1 1 0 0 1 .707-.293 1 1 0 0 1 .707.293l3.414 3.414A1 1 0 0 1 20.707 7v4" />
                    <line x1="12" x2="12" y1="22" y2="11" />
                  </svg>
                </button>
              </div>
              <StudentPerformance
                studentProgress={studentProgress}
                enrolledClasses={enrolledClasses}
                classLessonsMap={classLessonsMap}
              />
            </div>

            {/* Enrolled Courses Section */}
            <div className="mt-12" id="courses">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Your Courses</h3>
                <button
                  onClick={() => setIsBrowseClassesOpen(true)}
                  className="neo-button neo-primary"
                >
                  Browse & Enroll in Classes
                </button>
              </div>
              
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-3 border-b-3 border-black"></div>
                </div>
              ) : enrolledClasses.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {enrolledClasses.map((classItem) => {
                    // Find the corresponding class progress
                    const classProgress = studentProgress?.classProgresses.find(
                      cp => cp.classId === classItem.id
                    );
                    
                    // Get total lessons for this class
                    const totalLessons = classItem.id ? classLessonsMap[classItem.id]?.length || 0 : 0;
                    
                    // Show loading indicator while lessons are being fetched
                    if (classItem.id && classLessonsLoading[classItem.id]) {
                      return (
                        <div key={classItem.id} className="neo-card flex justify-center items-center h-56">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-3 border-b-3 border-black"></div>
                        </div>
                      );
                    }
                    
                    return (
                      <StudentClassCard
                        key={classItem.id}
                        classData={classItem}
                        classProgress={classProgress}
                        totalLessons={totalLessons}
                        onContinue={handleContinueClass}
                        onViewDetails={handleViewClassDetails}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="neo-card text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No courses yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    You are not enrolled in any courses yet. Contact your teacher for enrollment details.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      
      {/* BrowseClassesDialog would be added here */}
      
    </NeoLayout>
  );
}