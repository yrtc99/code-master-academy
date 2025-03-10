import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useUserGuardContext } from 'app';
import brain from 'brain';
import { CodeEditor } from '../components/CodeEditor';
import { LessonModel, getLessonById } from '../utils/lessonModel';
import { StudentProgress, getStudentProgress, updateLessonProgress } from '../utils/studentProgressModel';

export default function LessonView() {
  const { user } = useUserGuardContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const classId = searchParams.get('classId');
  const lessonId = searchParams.get('lessonId');
  
  const [loading, setLoading] = useState(true);
const [isLoading, setIsLoading] = useState(false);
  const [lesson, setLesson] = useState<LessonModel | null>(null);
  const [studentProgress, setStudentProgress] = useState<StudentProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
const [latestCode, setLatestCode] = useState<string>('');
const [latestScore, setLatestScore] = useState<number | null>(null);
  
  // Fetch lesson and student progress
  useEffect(() => {
    const fetchData = async () => {
      if (!lessonId || !classId || !user?.uid) {
        setError('Missing required parameters');
        setLoading(false);
        return;
      }
      
      try {
        // Fetch lesson data
        const lessonData = await getLessonById(lessonId);
        if (!lessonData) {
          setError('Lesson not found');
          setLoading(false);
          return;
        }
        
        setLesson(lessonData);
        
        // Fetch student progress
        const progress = await getStudentProgress(user.uid);
        setStudentProgress(progress);
        
        // Mark lesson as started if it hasn't been accessed before
        if (progress?.id) {
          const classProgress = progress.classProgresses.find(cp => cp.classId === classId);
          const lessonProgress = classProgress?.lessonProgresses.find(lp => lp.lessonId === lessonId);
          
          if (!lessonProgress) {
            // This is the first time accessing this lesson
            const now = new Date().toISOString();
            await updateLessonProgress(progress.id, classId, {
              lessonId,
              completed: false,
              score: 0,
              lastAccessedAt: now,
              startedAt: now
            });
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching lesson data:', error);
        setError('Failed to load lesson data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [lessonId, classId, user?.uid]);
  
  // Handle running code
  const handleRunCode = (code: string) => {
    console.log('Running code:', code);
    // Store the latest code for submission
    setLatestCode(code);
  };
  
  // Handle saving code and marking lesson as completed
  const handleCompleteLesson = async (code: string) => {
    if (!studentProgress?.id || !classId || !lessonId) return;
    
    try {
      // If we have test cases and this is a coding assessment, test the code first
      let score = latestScore || 0;
      
      if (lesson?.assessmentType === 'coding' && lesson.testCases?.length > 0 && !latestScore) {
        setIsLoading(true);
        try {
          // Test the code using our API
          const response = await brain.test_javascript_code({
            code: latestCode || code,
            language: lesson.programmingLanguage,
            testCases: lesson.testCases
          });
          
          const data = await response.json();
          score = Math.round(data.score);
          setLatestScore(score);
        } catch (err) {
          console.error('Error testing code:', err);
          // Continue with zero score if testing fails
        } finally {
          setIsLoading(false);
        }
      }
      
      const now = new Date().toISOString();
      await updateLessonProgress(studentProgress.id, classId, {
        lessonId,
        completed: true,
        score: score,
        lastAccessedAt: now,
        completedAt: now,
        answers: { code: latestCode || code }
      });
      
      // Show success message
      alert(`Lesson completed! Your score: ${score}%`);
      
      // Navigate back to the student dashboard
      navigate('/StudentDashboard');
    } catch (error) {
      console.error('Error saving lesson progress:', error);
      alert('Failed to save your progress. Please try again.');
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error || !lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Error</h2>
          <p className="text-gray-500">{error || 'Failed to load lesson'}</p>
          <button
            onClick={() => navigate('/StudentDashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{lesson.title}</h1>
            <p className="text-sm text-gray-500">
              {lesson.difficultyLevel.charAt(0).toUpperCase() + lesson.difficultyLevel.slice(1)} • 
              {lesson.programmingLanguage}
            </p>
          </div>
          <button
            onClick={() => navigate('/StudentDashboard')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Lesson Content */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Lesson Content</h2>
            </div>
            <div className="px-4 py-5 sm:p-6 h-full flex flex-col">
              <div className="flex-grow overflow-auto">
                <p className="text-gray-700 mb-6">{lesson.description}</p>
                
                {/* Example Code Section */}
                {lesson.codeExample && (
                  <div className="mb-6">
                    <h3 className="text-md font-medium text-gray-900 mb-2">Example Code</h3>
                    <div className="bg-gray-50 p-4 rounded-md overflow-x-auto">
                      <pre className="text-sm text-gray-800 font-mono">{lesson.codeExample}</pre>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Navigation Buttons */}
              <div className="mt-auto pt-4 border-t border-gray-200">
                <button
                  onClick={() => navigate('/StudentDashboard')}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
          
          {/* Right Column - Code Editor */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Coding Exercise</h2>
            </div>
            <div className="px-4 py-5 sm:p-6 h-full flex flex-col">
              <div className="flex-grow">
                <p className="text-gray-700 mb-4">
                  {lesson.assessmentType === 'coding'
                    ? 'Write your solution in the editor below. Click "Run Code" to test your solution against the provided test cases.'
                    : 'This lesson has a different type of assessment. For this demo, you can still use the code editor to experiment.'}
                </p>
                
                <CodeEditor
                  initialCode={`// Write your ${lesson.programmingLanguage} code here\n`}
                  language={lesson.programmingLanguage}
                  testCases={lesson.testCases || []}
                  onRunCode={handleRunCode}
                  onSaveCode={handleCompleteLesson}
                />
              </div>
              
              {/* Completion Button */}
              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => handleCompleteLesson(`// Student completed the lesson without submitting code`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-blue-700"
                >
                  Mark as Completed
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
