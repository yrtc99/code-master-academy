import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserGuardContext } from 'app';
import { getCourseHistory, CourseHistoryItem, filterCourseHistory } from '../utils/courseHistoryModel';
import { CourseHistoryCard } from '../components/CourseHistoryCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CardHeader, CardContent, Card } from '@/components/ui/card';
import { getStudentProgress } from '../utils/studentProgressModel';
import { getTeacherClasses } from '../utils/classModel';
import { getClassLessons } from '../utils/lessonModel';

export default function CourseHistory() {
  const navigate = useNavigate();
  const { user } = useUserGuardContext();
  const [loading, setLoading] = useState(true);
  const [courseHistory, setCourseHistory] = useState<CourseHistoryItem[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<CourseHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'inProgress' | 'completed' | 'revisiting'>('all');
  const [classLessonsMap, setClassLessonsMap] = useState<Record<string, any>>({});
  
  useEffect(() => {
    const loadCourseHistory = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Get student's progress data
        const studentProgress = await getStudentProgress(user.uid);
        
        // Get all classes the student is enrolled in
        const enrolledClasses = await getTeacherClasses(null, user.uid);
        
        // Get lessons for each class
        const lessonsMap: Record<string, any> = {};
        const lessonsPromises = enrolledClasses.map(async (cls) => {
          if (cls.id) {
            const lessons = await getClassLessons(cls.id);
            lessonsMap[cls.id] = lessons;
          }
        });
        
        await Promise.all(lessonsPromises);
        setClassLessonsMap(lessonsMap);
        
        // Generate course history
        const history = getCourseHistory(studentProgress, enrolledClasses, lessonsMap);
        setCourseHistory(history);
        setFilteredCourses(history);
      } catch (error) {
        console.error('Error loading course history:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadCourseHistory();
  }, [user]);
  
  // Filter courses when tab changes
  useEffect(() => {
    if (activeTab === 'all') {
      setFilteredCourses(courseHistory);
    } else {
      setFilteredCourses(filterCourseHistory(courseHistory, activeTab));
    }
  }, [activeTab, courseHistory]);
  
  const handleContinueCourse = (courseId: string) => {
    navigate(`/classroom/${courseId}`);
  };
  
  const handleViewCourseDetails = (courseId: string) => {
    navigate(`/ClassDetails/${courseId}`);
  };
  
  const handleBackToDashboard = () => {
    navigate('/student-dashboard');
  };
  
  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-12"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-80 bg-gray-100 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Learning History</h1>
          <p className="text-gray-600 mt-2">Review your past and current courses</p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleBackToDashboard}
        >
          Back to Dashboard
        </Button>
      </div>
      
      {courseHistory.length === 0 ? (
        <Card className="bg-gray-50 border border-gray-200">
          <CardHeader>
            <h2 className="text-xl font-semibold">No Course History</h2>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">You haven't enrolled in any courses yet. Visit the dashboard to enroll in courses.</p>
            <Button 
              className="mt-4" 
              onClick={handleBackToDashboard}
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Tabs defaultValue="all" onValueChange={(value) => setActiveTab(value as any)} className="mb-8">
            <TabsList className="mb-6">
              <TabsTrigger value="all">All Courses ({courseHistory.length})</TabsTrigger>
              <TabsTrigger value="inProgress">
                In Progress ({filterCourseHistory(courseHistory, 'inProgress').length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({filterCourseHistory(courseHistory, 'completed').length})
              </TabsTrigger>
              <TabsTrigger value="revisiting">
                Revisiting ({filterCourseHistory(courseHistory, 'revisiting').length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                  <CourseHistoryCard
                    key={course.courseId}
                    course={course}
                    onContinue={handleContinueCourse}
                    onViewDetails={handleViewCourseDetails}
                  />
                ))}
              </div>
              
              {filteredCourses.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No courses match the selected filter.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="inProgress" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                  <CourseHistoryCard
                    key={course.courseId}
                    course={course}
                    onContinue={handleContinueCourse}
                    onViewDetails={handleViewCourseDetails}
                  />
                ))}
              </div>
              
              {filteredCourses.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">You don't have any courses in progress.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="completed" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                  <CourseHistoryCard
                    key={course.courseId}
                    course={course}
                    onContinue={handleContinueCourse}
                    onViewDetails={handleViewCourseDetails}
                  />
                ))}
              </div>
              
              {filteredCourses.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">You haven't completed any courses yet.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="revisiting" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                  <CourseHistoryCard
                    key={course.courseId}
                    course={course}
                    onContinue={handleContinueCourse}
                    onViewDetails={handleViewCourseDetails}
                  />
                ))}
              </div>
              
              {filteredCourses.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">You aren't currently revisiting any courses.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
