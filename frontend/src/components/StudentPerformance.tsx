import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { StudentProgress } from '../utils/studentProgressModel';
import { LessonModel } from '../utils/lessonModel';
import { ClassModel } from '../utils/classModel';
import { generateStudentFeedback, getAIFeedback, StudentStatistics } from '../utils/analyticsHelpers';

interface Props {
  studentProgress: StudentProgress | null;
  enrolledClasses: ClassModel[];
  classLessonsMap: Record<string, LessonModel[]>;
}

export const StudentPerformance: React.FC<Props> = ({ studentProgress, enrolledClasses, classLessonsMap }) => {
  const [allLessons, setAllLessons] = useState<LessonModel[]>([]);
  const [feedback, setFeedback] = useState<{ feedback: string; strengths: string[]; areasForImprovement: string[] }>(
    { feedback: '', strengths: [], areasForImprovement: [] }
  );
  const [aiFeedback, setAIFeedback] = useState<StudentStatistics['aiFeedback']>(undefined);
  const [isLoadingAIFeedback, setIsLoadingAIFeedback] = useState<boolean>(false);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [skillsData, setSkillsData] = useState<any[]>([]);

  useEffect(() => {
    // Combine all lessons from all classes
    const lessons: LessonModel[] = [];
    Object.values(classLessonsMap).forEach(classLessons => {
      lessons.push(...classLessons);
    });
    setAllLessons(lessons);

    // Generate feedback if we have progress and lessons
    if (studentProgress && lessons.length > 0) {
      const generatedFeedback = generateStudentFeedback(studentProgress, lessons);
      setFeedback(generatedFeedback);
      
      // Prepare performance data for charts
      preparePerformanceData();
      prepareSkillsData(lessons);
      
      // Fetch AI-powered feedback
      fetchAIFeedback();
    }
  }, [studentProgress, classLessonsMap, enrolledClasses]);

  // Prepare data for the performance chart
  const preparePerformanceData = () => {
    if (!studentProgress) return;

    const classProgressData = enrolledClasses.map(cls => {
      // Find the corresponding class progress
      const classProgress = studentProgress.classProgresses.find(cp => cp.classId === cls.id);
      
      // Get lessons for this class
      const lessons = cls.id ? classLessonsMap[cls.id] || [] : [];
      const totalLessons = lessons.length;
      
      // Calculate class completion and average score
      let completedLessons = 0;
      let totalScore = 0;
      let scoredLessons = 0;
      
      if (classProgress) {
        completedLessons = classProgress.lessonProgresses.filter(lp => lp.completed).length;
        
        classProgress.lessonProgresses.forEach(lp => {
          if (lp.completed && lp.score !== undefined) {
            totalScore += lp.score;
            scoredLessons++;
          }
        });
      }
      
      const completionRate = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
      const averageScore = scoredLessons > 0 ? Math.round(totalScore / scoredLessons) : 0;
      
      return {
        name: cls.name || 'Unnamed Class',
        completion: completionRate,
        score: averageScore
      };
    });
    
    setPerformanceData(classProgressData);
  };

  // Fetch AI-powered feedback for the student
  const fetchAIFeedback = async () => {
    if (!studentProgress) return;
    
    try {
      setIsLoadingAIFeedback(true);
      
      // Get all the lessons across all classes
      const allClassLessons = Object.values(classLessonsMap).flat();
      
      // Calculate basic stats for AI feedback request
      let totalScore = 0;
      let completedLessons = 0;
      let scoredLessons = 0;
      
      studentProgress.classProgresses.forEach(cp => {
        cp.lessonProgresses.forEach(lp => {
          if (lp.completed) {
            completedLessons++;
            if (lp.score !== undefined) {
              totalScore += lp.score;
              scoredLessons++;
            }
          }
        });
      });
      
      const averageScore = scoredLessons > 0 ? Math.round(totalScore / scoredLessons) : 0;
      const totalLessons = allClassLessons.length * enrolledClasses.length;  // Approximation
      const completionRate = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
      
      // Get programming languages and difficulty levels from lessons
      const programmingLanguages = Array.from(new Set(allClassLessons.map(l => l.programmingLanguage || "").filter(Boolean)));
      const difficultyLevels = Array.from(new Set(allClassLessons.map(l => l.difficultyLevel || "").filter(Boolean)));
      
      // Prepare stats object for AI feedback
      const studentStats: StudentStatistics = {
        studentId: studentProgress.studentId,
        studentName: studentProgress.studentName || "Student",
        averageScore,
        completionRate,
        strengths: feedback.strengths,
        areasForImprovement: feedback.areasForImprovement,
        feedback: feedback.feedback,
        lastActive: studentProgress.classProgresses[0]?.lastAccessedAt || "",
        totalLessonsCompleted: completedLessons,
        totalLessonsAssigned: totalLessons
      };
      
      // Call the LLM API to get AI feedback
      const aiResponse = await getAIFeedback(studentStats);
      
      if (aiResponse) {
        setAIFeedback(aiResponse);
      }
    } catch (error) {
      console.error("Error fetching AI feedback:", error);
    } finally {
      setIsLoadingAIFeedback(false);
    }
  };
  
  // Prepare data for the skills radar chart
  const prepareSkillsData = (lessons: LessonModel[]) => {
    if (!studentProgress) return;
    
    // Count lessons by language and difficulty
    const languageMap = new Map<string, { total: number; completed: number; score: number }>();
    const difficultyMap = new Map<string, { total: number; completed: number; score: number }>();
    
    // Initialize maps with lessons data
    lessons.forEach(lesson => {
      // Track by programming language
      if (lesson.programmingLanguage) {
        if (!languageMap.has(lesson.programmingLanguage)) {
          languageMap.set(lesson.programmingLanguage, { total: 0, completed: 0, score: 0 });
        }
        languageMap.get(lesson.programmingLanguage)!.total++;
      }
      
      // Track by difficulty level
      if (lesson.difficultyLevel) {
        if (!difficultyMap.has(lesson.difficultyLevel)) {
          difficultyMap.set(lesson.difficultyLevel, { total: 0, completed: 0, score: 0 });
        }
        difficultyMap.get(lesson.difficultyLevel)!.total++;
      }
    });
    
    // Update with completion data
    studentProgress.classProgresses.forEach(cp => {
      cp.lessonProgresses.forEach(lp => {
        if (lp.lessonId) {
          // Find the lesson
          const lesson = lessons.find(l => l.id === lp.lessonId);
          if (lesson) {
            // Update language stats
            if (lesson.programmingLanguage && languageMap.has(lesson.programmingLanguage)) {
              const langStats = languageMap.get(lesson.programmingLanguage)!;
              if (lp.completed) {
                langStats.completed++;
                if (lp.score !== undefined) {
                  langStats.score += lp.score;
                }
              }
            }
            
            // Update difficulty stats
            if (lesson.difficultyLevel && difficultyMap.has(lesson.difficultyLevel)) {
              const diffStats = difficultyMap.get(lesson.difficultyLevel)!;
              if (lp.completed) {
                diffStats.completed++;
                if (lp.score !== undefined) {
                  diffStats.score += lp.score;
                }
              }
            }
          }
        }
      });
    });
    
    // Convert maps to radar chart data
    const skillsChartData: { subject: string; score: number; fullMark: 100 }[] = [];
    
    // Add language skills
    languageMap.forEach((stats, language) => {
      const averageScore = stats.completed > 0 ? Math.round(stats.score / stats.completed) : 0;
      skillsChartData.push({
        subject: `${language}`,
        score: averageScore,
        fullMark: 100
      });
    });
    
    // Add difficulty levels
    difficultyMap.forEach((stats, difficulty) => {
      const averageScore = stats.completed > 0 ? Math.round(stats.score / stats.completed) : 0;
      skillsChartData.push({
        subject: `${difficulty}`,
        score: averageScore,
        fullMark: 100
      });
    });
    
    setSkillsData(skillsChartData);
  };

  if (!studentProgress) {
    return (
      <div className="neo-card">
        <h2 className="text-xl font-bold mb-4">Your Performance</h2>
        <p className="font-medium">Complete lessons to see your performance analytics.</p>
      </div>
    );
  }

  return (
    <div className="neo-card">
      <h2 className="text-xl font-bold mb-4">Your Performance Dashboard</h2>
      
      {/* AI Feedback Section */}
      <div className="mb-8 neo-card neo-primary">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Learning Assistant Feedback</h3>
          {isLoadingAIFeedback && (
            <div className="font-medium text-sm flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating personalized feedback...
            </div>
          )}
        </div>
        
        {aiFeedback ? (
          <div className="space-y-6">
            {/* Personalized Feedback */}
            <div className="prose max-w-none mb-2">
              <p>{aiFeedback.personalizedFeedback}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Improvement Plan */}
              <div className="neo-card p-4">
                <h4 className="text-md font-bold mb-3">Your Improvement Plan</h4>
                <ul className="list-disc list-inside space-y-2">
                  {aiFeedback.improvementPlan.map((item, index) => (
                    <li key={`plan-${index}`} className="leading-snug">{item}</li>
                  ))}
                </ul>
              </div>
              
              {/* Concept Recommendations */}
              <div className="neo-card p-4">
                <h4 className="text-md font-bold mb-3">Recommended Concepts</h4>
                <div className="space-y-3">
                  {aiFeedback.conceptRecommendations.map((concept, index) => (
                    <div key={`concept-${index}`} className="border-l-3 border-black pl-3">
                      <h5 className="font-bold">{concept.name}</h5>
                      <p className="text-sm">{concept.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Practice Exercises */}
            <div className="neo-card neo-accent p-4">
              <h4 className="text-md font-bold mb-3">Suggested Practice Exercises</h4>
              <ul className="list-decimal list-inside space-y-2">
                {aiFeedback.practiceExercises.map((exercise, index) => (
                  <li key={`exercise-${index}`} className="leading-snug">{exercise}</li>
                ))}
              </ul>
            </div>
            
            {/* Motivational Message */}
            <div className="neo-card neo-success p-4 mt-4">
              <p className="text-center italic font-medium">"{aiFeedback.motivationalMessage}"</p>
            </div>
          </div>
        ) : (
          <div>
            <p className="mb-4">{feedback.feedback}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strengths */}
              <div className="neo-card neo-success p-4">
                <h4 className="text-md font-bold mb-2">Your Strengths</h4>
                {feedback.strengths.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {feedback.strengths.map((strength, index) => (
                      <li key={`strength-${index}`}>{strength}</li>
                    ))}
                  </ul>
                ) : (
                  <p>Complete more lessons to identify your strengths.</p>
                )}
              </div>
              
              {/* Areas for Improvement */}
              <div className="neo-card neo-warning p-4">
                <h4 className="text-md font-bold mb-2">Areas for Improvement</h4>
                {feedback.areasForImprovement.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {feedback.areasForImprovement.map((area, index) => (
                      <li key={`area-${index}`}>{area}</li>
                    ))}
                  </ul>
                ) : (
                  <p>Great job! Keep practicing to maintain your progress.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Class Performance Chart */}
        <div className="neo-card p-4">
          <h3 className="text-lg font-bold mb-4">Class Performance</h3>
          {performanceData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={performanceData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completion" name="Completion Rate (%)" fill="#0088FE" />
                  <Bar dataKey="score" name="Average Score (%)" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-80 font-medium">
              No class performance data available yet.
            </div>
          )}
        </div>
        
        {/* Skills Radar Chart */}
        <div className="neo-card p-4">
          <h3 className="text-lg font-bold mb-4">Skills Assessment</h3>
          {skillsData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillsData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar name="Score" dataKey="score" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-80 font-medium">
              Complete lessons to see your skills assessment.
            </div>
          )}
        </div>
      </div>
      
      
    </div>
  );
};
