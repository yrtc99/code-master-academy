import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUserGuardContext } from 'app';
import { ClassModel, getClassById } from '../utils/classModel';
import { LessonModel, getClassLessons } from '../utils/lessonModel';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getStudentProgress } from '../utils/studentProgressModel';

interface ParamTypes {
  classId: string;
}

export default function ClassDetails() {
  const navigate = useNavigate();
  const { user } = useUserGuardContext();
  const { classId } = useParams<ParamTypes>();
  const [classData, setClassData] = useState<ClassModel | null>(null);
  const [lessons, setLessons] = useState<LessonModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Track completed lessons
  const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    const fetchData = async () => {
      if (!classId || !user?.uid) {
        setError('Missing required parameters');
        setLoading(false);
        return;
      }
      
      try {
        // Fetch class data
        const fetchedClassData = await getClassById(classId);
        if (!fetchedClassData) {
          setError('Class not found');
          setLoading(false);
          return;
        }
        
        setClassData(fetchedClassData);
        
        // Fetch lessons for this class
        const fetchedLessons = await getClassLessons(classId);
        setLessons(fetchedLessons);
        
        // Fetch student progress to determine completed lessons
        const progress = await getStudentProgress(user.uid);
        const classProgress = progress?.classProgresses.find(cp => cp.classId === classId);
        
        if (classProgress?.lessonProgresses) {
          const completed: Record<string, boolean> = {};
          classProgress.lessonProgresses.forEach(lp => {
            if (lp.lessonId) {
              completed[lp.lessonId] = lp.completed || false;
            }
          });
          setCompletedLessons(completed);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching class details:', error);
        setError('Failed to load class data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [classId, user?.uid]);
  
  const handleStartLesson = (lessonId: string) => {
    navigate(`/LessonView?classId=${classId}&lessonId=${lessonId}`);
  };
  
  const handleBack = () => {
    navigate('/course-history');
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error || !classData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Error</h2>
          <p className="text-gray-500">{error || 'Failed to load class'}</p>
          <Button
            onClick={handleBack}
            className="mt-4"
          >
            Back
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header with back button */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <Button variant="outline" onClick={handleBack} className="mb-4">
              ← Back to Courses
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">{classData.name}</h1>
            <p className="text-gray-500 mt-2">{classData.description}</p>
          </div>
          <div>
            <Badge variant="outline" className="text-gray-700 bg-gray-100">
              Teacher: {classData.teacherName}
            </Badge>
          </div>
        </div>
        
        {/* Course Progress */}
        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-xl font-semibold">Progress Overview</h2>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Course Completion</span>
                <span>
                  {Object.values(completedLessons).filter(Boolean).length} of {lessons.length} lessons completed
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${lessons.length > 0 ? (Object.values(completedLessons).filter(Boolean).length / lessons.length) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Lessons List */}
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Course Content</h2>
        <div className="space-y-4">
          {lessons.length > 0 ? (
            lessons.map((lesson, index) => (
              <Card key={lesson.id} className="overflow-hidden">
                <div className="flex items-center p-6">
                  <div className="flex-shrink-0 mr-4 flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 text-gray-700 font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{lesson.title}</h3>
                    <p className="text-gray-500 text-sm truncate">{lesson.description}</p>
                    <div className="mt-2 flex items-center">
                      <Badge className={`${lesson.difficultyLevel === 'easy' ? 'bg-green-100 text-green-800' : lesson.difficultyLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'} mr-2`}>
                        {lesson.difficultyLevel.charAt(0).toUpperCase() + lesson.difficultyLevel.slice(1)}
                      </Badge>
                      <Badge className="bg-blue-100 text-blue-800">
                        {lesson.programmingLanguage}
                      </Badge>
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0 flex items-center">
                    {completedLessons[lesson.id!] ? (
                      <div className="flex items-center">
                        <span className="bg-green-100 text-green-800 text-xs py-1 px-2 rounded-full mr-3">
                          Completed
                        </span>
                        <Button 
                          onClick={() => handleStartLesson(lesson.id!)}
                          variant="outline"
                        >
                          Review
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        onClick={() => handleStartLesson(lesson.id!)}
                      >
                        Start
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-10 bg-white rounded-lg shadow">
              <p className="text-gray-500">No lessons available for this course.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
