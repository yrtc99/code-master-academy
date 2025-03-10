import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useUserGuardContext } from 'app';
import { getUserProfile, UserProfile } from '../utils/userRoles';
import { ClassModel, subscribeToTeacherClasses, getTeacherStudentCount } from '../utils/classModel';
import { LessonModel, subscribeToTeacherLessons } from '../utils/lessonModel';
import { CreateClassDialog } from '../components/CreateClassDialog';
import { CreateLessonDialog } from '../components/CreateLessonDialog';
import { ClassCard } from '../components/ClassCard';
import { LessonCard } from '../components/LessonCard';
import { StudentManagementDialog } from '../components/StudentManagementDialog';
import { ClassStudentsDialog } from '../components/ClassStudentsDialog';
import { TeacherAnalytics } from '../components/TeacherAnalytics';
import { NeoLayout } from '../components/NeoLayout';

export default function TeacherDashboard() {
  const { user } = useUserGuardContext();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassModel[]>([]);
  const [lessons, setLessons] = useState<LessonModel[]>([]);
  const [studentCount, setStudentCount] = useState<number>(0);
  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);
  const [isCreateLessonOpen, setIsCreateLessonOpen] = useState(false);
  const [isStudentManagementOpen, setIsStudentManagementOpen] = useState(false);
  const [isClassStudentsOpen, setIsClassStudentsOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassModel | null>(null);
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
  
  // Subscribe to classes and lessons when user profile is loaded
  useEffect(() => {
    if (!userProfile?.uid) return;
    
    // Subscribe to real-time updates for classes
    const unsubscribeClasses = subscribeToTeacherClasses(userProfile.uid, (classData) => {
      setClasses(classData);
    });
    
    // Subscribe to real-time updates for lessons
    const unsubscribeLessons = subscribeToTeacherLessons(userProfile.uid, (lessonData) => {
      setLessons(lessonData);
    });
    
    // Fetch student count
    const fetchStudentCount = async () => {
      const count = await getTeacherStudentCount(userProfile.uid);
      setStudentCount(count);
    };
    fetchStudentCount();
    
    return () => {
      unsubscribeClasses();
      unsubscribeLessons();
    };
  }, [userProfile?.uid]);
  
  const handleViewClassDetails = (classId: string) => {
    navigate(`/teacher-class-details?classId=${classId}`);
  };
  
  const handleViewLessonDetails = (lessonId: string) => {
    navigate(`/LessonEditor?lessonId=${lessonId}`);
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

  // Check if the user is a teacher, if not redirect to unauthorized
  if (!userProfile || userProfile.role !== 'teacher') {
    return <Navigate to="/unauthorized" />;
  }

  return (
    <NeoLayout title="Teacher Dashboard">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-lg font-bold mb-1">Manage your classes and monitor student progress</p>
          </div>
          <button
            onClick={() => setIsCreateClassOpen(true)}
            className="neo-button neo-primary"
          >
            Create New Class
          </button>
        </div>

        <div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="neo-card neo-primary">
              <div>
                <div className="flex items-center">
                  <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full border-3 border-black mr-3">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Classes</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{classes.length}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <div>
                  <button
                    onClick={() => setIsCreateClassOpen(true)}
                    className="neo-button py-2 px-3 text-sm bg-white text-black w-full"
                  >
                    Create a new class
                  </button>
                </div>
              </div>
            </div>

            <div className="neo-card neo-success">
              <div>
                <div className="flex items-center">
                  <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full border-3 border-black mr-3">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Students</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{studentCount}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <div>
                  <button 
                    onClick={() => setIsStudentManagementOpen(true)}
                    className="neo-button py-2 px-3 text-sm bg-white text-black w-full"
                  >
                    View all students
                  </button>
                </div>
              </div>
            </div>

            <div className="neo-card neo-accent">
              <div>
                <div className="flex items-center">
                  <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full border-3 border-black mr-3">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Lessons</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{lessons.length}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <div>
                  <button
                    onClick={() => setIsCreateLessonOpen(true)}
                    className="neo-button py-2 px-3 text-sm bg-white text-black w-full"
                  >
                    Create new lesson
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Class List Section */}
          <div className="mt-12">
            <h3 className="text-2xl font-bold mb-6">Your Classes</h3>
            
            {classes.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {classes.map((classItem) => (
                  <ClassCard 
                    key={classItem.id} 
                    classData={classItem} 
                    onViewDetails={handleViewClassDetails}
                    onManageStudents={(classId) => {
                      const selectedClass = classes.find(c => c.id === classId);
                      if (selectedClass) {
                        setSelectedClass(selectedClass);
                        setIsClassStudentsOpen(true);
                      }
                    }}
                  />
                ))}
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
                <h3 className="mt-2 text-sm font-medium text-gray-900">No classes yet</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new class.</p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setIsCreateClassOpen(true)}
                    className="neo-button neo-primary inline-flex items-center"
                  >
                    <svg
                      className="-ml-1 mr-2 h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Create New Class
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Analytics Section */}
          <div className="mt-12">
            <h3 className="text-2xl font-bold mb-6">Performance Analytics</h3>
            <TeacherAnalytics 
              classes={classes} 
              lessons={lessons} 
              teacherId={userProfile?.uid || ''}
            />
          </div>
          
          {/* Lessons List Section */}
          <div className="mt-12">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Your Lessons</h3>
              <button
                onClick={() => setIsCreateLessonOpen(true)}
                className="neo-button neo-accent inline-flex items-center py-2"
              >
                <svg
                  className="-ml-1 mr-1 h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Create New Lesson
              </button>
            </div>
            
            {lessons.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {lessons.map((lessonItem) => (
                  <LessonCard 
                    key={lessonItem.id} 
                    lessonData={lessonItem} 
                    onViewDetails={handleViewLessonDetails} 
                  />
                ))}
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No lessons yet</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new lesson.</p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setIsCreateLessonOpen(true)}
                    className="neo-button neo-accent inline-flex items-center"
                  >
                    <svg
                      className="-ml-1 mr-2 h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Create New Lesson
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Create Class Dialog */}
      {userProfile && (
        <CreateClassDialog
          isOpen={isCreateClassOpen}
          teacherId={userProfile.uid}
          onClose={() => setIsCreateClassOpen(false)}
          onClassCreated={() => {
            // The real-time subscription will update the classes
            // We'll also fetch the student count again
            if (userProfile.uid) {
              getTeacherStudentCount(userProfile.uid).then(count => {
                setStudentCount(count);
              });
            }
          }}
        />
      )}
      
      {/* Create Lesson Dialog */}
      {userProfile && (
        <CreateLessonDialog
          isOpen={isCreateLessonOpen}
          teacherId={userProfile.uid}
          classes={classes}
          onClose={() => setIsCreateLessonOpen(false)}
          onLessonCreated={() => {
            // The real-time subscription will update the lessons
            setIsCreateLessonOpen(false);
          }}
        />
      )}
      
      {/* Student Management Dialog */}
      {userProfile && (
        <StudentManagementDialog
          isOpen={isStudentManagementOpen}
          onClose={() => setIsStudentManagementOpen(false)}
          teacherId={userProfile.uid}
        />
      )}
      
      {/* Class Students Dialog */}
      {userProfile && selectedClass && (
        <ClassStudentsDialog
          isOpen={isClassStudentsOpen}
          onClose={() => setIsClassStudentsOpen(false)}
          classData={selectedClass}
          onStudentsUpdated={() => {
            // Refresh student count after updates
            if (userProfile.uid) {
              getTeacherStudentCount(userProfile.uid).then(count => {
                setStudentCount(count);
              });
            }
          }}
        />
      )}
    </NeoLayout>
  );
}
