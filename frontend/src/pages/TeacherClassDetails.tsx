import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useUserGuardContext } from 'app';
import { getClassById, ClassModel } from '../utils/classModel';
import { LessonModel, getClassLessons } from '../utils/lessonModel';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getStudentProgressByClass, calculateClassStatistics, ClassStatistics } from '../utils/analyticsHelpers';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ParamTypes {
  classId: string;
}

interface LessonWithStats {
  lesson: LessonModel;
  stats: {
    completionRate: number;
    averageScore: number;
    attentionNeeded: boolean;
    studentsCompleted: number;
    studentsInProgress: number;
    studentsNotStarted: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function TeacherClassDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUserGuardContext();
  
  // Get classId from either params or query params
  const { classId: paramClassId } = useParams<ParamTypes>();
  const queryParams = new URLSearchParams(location.search);
  const queryClassId = queryParams.get('classId');
  const classId = paramClassId || queryClassId;
  const [classData, setClassData] = useState<ClassModel | null>(null);
  const [lessons, setLessons] = useState<LessonWithStats[]>([]);
  const [classStats, setClassStats] = useState<ClassStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'completion' | 'score' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  
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
        
        // Fetch student progress data for this class
        const progressList = await getStudentProgressByClass(classId);
        
        // Calculate class statistics
        const statistics = await calculateClassStatistics(fetchedClassData, progressList);
        setClassStats(statistics);
        
        // For each lesson, calculate performance metrics
        const lessonsWithStats: LessonWithStats[] = fetchedLessons.map(lesson => {
          const lessonStats = {
            completionRate: 0,
            averageScore: 0,
            attentionNeeded: false,
            studentsCompleted: 0,
            studentsInProgress: 0,
            studentsNotStarted: 0
          };
          
          if (progressList.length > 0) {
            let completedCount = 0;
            let inProgressCount = 0;
            let totalScore = 0;
            let scoredCount = 0;
            
            progressList.forEach(progress => {
              // Find progress for this class
              const classProgress = progress.classProgresses.find(cp => cp.classId === classId);
              if (classProgress) {
                // Find progress for this lesson
                const lessonProgress = classProgress.lessonProgresses.find(lp => lp.lessonId === lesson.id);
                if (lessonProgress) {
                  if (lessonProgress.completed) {
                    completedCount++;
                    if (lessonProgress.score !== undefined) {
                      totalScore += lessonProgress.score;
                      scoredCount++;
                    }
                  } else if (lessonProgress.startedAt) {
                    inProgressCount++;
                  }
                }
              }
            });
            
            // Calculate statistics
            const totalStudents = fetchedClassData.studentIds?.length || 0;
            lessonStats.studentsCompleted = completedCount;
            lessonStats.studentsInProgress = inProgressCount;
            lessonStats.studentsNotStarted = totalStudents - completedCount - inProgressCount;
            lessonStats.completionRate = totalStudents > 0 ? Math.round((completedCount / totalStudents) * 100) : 0;
            lessonStats.averageScore = scoredCount > 0 ? Math.round(totalScore / scoredCount) : 0;
            
            // Flag lessons needing attention (low completion or scores)
            lessonStats.attentionNeeded = 
              (lessonStats.completionRate < 50 && totalStudents > 0) || 
              (lessonStats.averageScore < 70 && scoredCount > 0);
          }
          
          return {
            lesson,
            stats: lessonStats
          };
        });
        
        setLessons(lessonsWithStats);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching class details:', error);
        setError('Failed to load class data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [classId, user?.uid]);
  
  const handleBack = () => {
    navigate('/TeacherDashboard');
  };

  const getSortedLessons = () => {
    if (!lessons.length) return [];
    
    return [...lessons].sort((a, b) => {
      if (sortBy === 'completion') {
        return sortOrder === 'asc' 
          ? a.stats.completionRate - b.stats.completionRate
          : b.stats.completionRate - a.stats.completionRate;
      } else if (sortBy === 'score') {
        return sortOrder === 'asc' 
          ? a.stats.averageScore - b.stats.averageScore
          : b.stats.averageScore - a.stats.averageScore;
      } else { // date
        const dateA = new Date(a.lesson.createdAt).getTime();
        const dateB = new Date(b.lesson.createdAt).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
    });
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
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

  const sortedLessons = getSortedLessons();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header with back button */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <Button variant="outline" onClick={handleBack} className="mb-4">
              ← Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">{classData.name}</h1>
            <p className="text-gray-500 mt-2">{classData.description}</p>
          </div>
          <div className="flex flex-col items-end">
            <Badge variant="outline" className="text-gray-700 bg-gray-100 mb-2">
              {classData.studentIds?.length || 0} Students Enrolled
            </Badge>
            <Badge variant="outline" className="text-gray-700 bg-gray-100">
              {lessons.length} Lessons
            </Badge>
          </div>
        </div>
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full md:w-[400px] grid-cols-2">
            <TabsTrigger value="overview">Class Overview</TabsTrigger>
            <TabsTrigger value="lessons">Lessons</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6">
            {/* Class Overview Tab */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-blue-50">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-blue-700">{classStats?.completionRate || 0}%</div>
                  <p className="text-blue-600">Overall Completion</p>
                </CardContent>
              </Card>
              
              <Card className="bg-green-50">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-700">{classStats?.averageScore || 0}%</div>
                  <p className="text-green-600">Average Score</p>
                </CardContent>
              </Card>
              
              <Card className="bg-purple-50">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-purple-700">{classStats?.studentCount || 0}</div>
                  <p className="text-purple-600">Students</p>
                </CardContent>
              </Card>
            </div>
            
            {/* Performance Charts */}
            {classStats && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Pie Chart - Lesson Status Distribution */}
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">Lesson Completion Status</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Completed', value: classStats.completedLessons },
                              { name: 'In Progress', value: classStats.inProgressLessons },
                              { name: 'Not Started', value: classStats.notStartedLessons }
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            <Cell key="cell-0" fill="#4caf50" />
                            <Cell key="cell-1" fill="#ffb74d" />
                            <Cell key="cell-2" fill="#e57373" />
                          </Pie>
                          <Tooltip formatter={(value) => [`${value} lessons`, null]} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Bar Chart - Average Scores by Difficulty */}
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">Performance by Difficulty</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            {
                              name: 'Beginner',
                              count: sortedLessons.filter(l => l.lesson.difficultyLevel === 'beginner').length,
                              avgScore: Math.round(sortedLessons
                                .filter(l => l.lesson.difficultyLevel === 'beginner')
                                .reduce((sum, l) => sum + l.stats.averageScore, 0) / 
                                  Math.max(1, sortedLessons.filter(l => l.lesson.difficultyLevel === 'beginner').length))
                            },
                            {
                              name: 'Intermediate',
                              count: sortedLessons.filter(l => l.lesson.difficultyLevel === 'intermediate').length,
                              avgScore: Math.round(sortedLessons
                                .filter(l => l.lesson.difficultyLevel === 'intermediate')
                                .reduce((sum, l) => sum + l.stats.averageScore, 0) / 
                                  Math.max(1, sortedLessons.filter(l => l.lesson.difficultyLevel === 'intermediate').length))
                            },
                            {
                              name: 'Advanced',
                              count: sortedLessons.filter(l => l.lesson.difficultyLevel === 'advanced').length,
                              avgScore: Math.round(sortedLessons
                                .filter(l => l.lesson.difficultyLevel === 'advanced')
                                .reduce((sum, l) => sum + l.stats.averageScore, 0) / 
                                  Math.max(1, sortedLessons.filter(l => l.lesson.difficultyLevel === 'advanced').length))
                            },
                          ]}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          <Legend />
                          <Bar name="Average Score" dataKey="avgScore" fill="#8884d8" />
                          <Bar name="Lesson Count" dataKey="count" fill="#82ca9d" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Lessons Needing Attention */}
            <Card className="mb-8">
              <CardHeader>
                <h3 className="text-lg font-semibold">Lessons Needing Attention</h3>
              </CardHeader>
              <CardContent>
                {sortedLessons.filter(l => l.stats.attentionNeeded).length > 0 ? (
                  <div className="space-y-4">
                    {sortedLessons
                      .filter(l => l.stats.attentionNeeded)
                      .map(({ lesson, stats }) => (
                        <div key={lesson.id} className="p-4 border rounded-lg flex items-center bg-red-50">
                          <div className="flex-1">
                            <h4 className="font-medium">{lesson.title}</h4>
                            <div className="flex items-center mt-1">
                              <Badge variant="outline" className="mr-2 bg-red-100 text-red-800 border-none">
                                {stats.completionRate}% Completion
                              </Badge>
                              <Badge variant="outline" className="bg-red-100 text-red-800 border-none">
                                {stats.averageScore}% Avg. Score
                              </Badge>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedLesson(lesson.id || null)}
                          >
                            View Details
                          </Button>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No lessons currently need attention. Great job!
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="lessons" className="mt-6">
            {/* Lessons Tab */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                  <h3 className="text-lg font-semibold">All Lessons</h3>
                  <div className="flex gap-2">
                    <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">Date Created</SelectItem>
                        <SelectItem value="completion">Completion Rate</SelectItem>
                        <SelectItem value="score">Average Score</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button variant="outline" size="icon" onClick={toggleSortOrder}>
                      {sortOrder === 'asc' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path fillRule="evenodd" d="M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5A.5.5 0 0 1 8 1z"/>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path fillRule="evenodd" d="M8 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L7.5 2.707V14.5a.5.5 0 0 0 .5.5z"/>
                        </svg>
                      )}
                    </Button>
                  </div>
                </div>
                
                <Separator className="mb-4" />
                
                <div className="space-y-4">
                  {sortedLessons.length > 0 ? (
                    sortedLessons.map(({ lesson, stats }) => (
                      <div key={lesson.id} className={`p-4 border rounded-lg ${stats.attentionNeeded ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className="flex-1">
                            <h4 className="font-medium">{lesson.title}</h4>
                            <p className="text-sm text-gray-500 line-clamp-1">{lesson.description}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <Badge className={`
                                ${lesson.difficultyLevel === 'beginner' ? 'bg-green-100 text-green-800' : 
                                  lesson.difficultyLevel === 'intermediate' ? 'bg-yellow-100 text-yellow-800' : 
                                  'bg-red-100 text-red-800'} mr-2
                              `}>
                                {lesson.difficultyLevel && typeof lesson.difficultyLevel === 'string' ? lesson.difficultyLevel.charAt(0).toUpperCase() + lesson.difficultyLevel.slice(1) : 'Unknown'}
                              </Badge>
                              <Badge className="bg-blue-100 text-blue-800">
                                {lesson.programmingLanguage || 'Unknown'}
                              </Badge>
                              <Badge className="bg-purple-100 text-purple-800">
                                {lesson.assessmentType && typeof lesson.assessmentType === 'string' ? `${lesson.assessmentType.charAt(0).toUpperCase() + lesson.assessmentType.slice(1)} Assessment` : 'Unknown Assessment'}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
                            <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
                              <div className="text-center px-2 py-1 bg-green-100 rounded-md">
                                <div className="text-sm font-semibold text-green-800">{stats.studentsCompleted}</div>
                                <div className="text-xs text-green-600">Completed</div>
                              </div>
                              <div className="text-center px-2 py-1 bg-yellow-100 rounded-md">
                                <div className="text-sm font-semibold text-yellow-800">{stats.studentsInProgress}</div>
                                <div className="text-xs text-yellow-600">In Progress</div>
                              </div>
                              <div className="text-center px-2 py-1 bg-gray-100 rounded-md">
                                <div className="text-sm font-semibold text-gray-800">{stats.studentsNotStarted}</div>
                                <div className="text-xs text-gray-600">Not Started</div>
                              </div>
                            </div>
                            <div className="flex justify-between w-full sm:w-auto gap-4 mt-2">
                              <div className="flex flex-col">
                                <div className="text-sm font-semibold">{stats.completionRate}%</div>
                                <div className="text-xs text-gray-500">Completion</div>
                              </div>
                              <div className="flex flex-col">
                                <div className="text-sm font-semibold">{stats.averageScore}%</div>
                                <div className="text-xs text-gray-500">Avg. Score</div>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  // This would navigate to a detailed lesson view
                                  alert(`View details for lesson: ${lesson.title}`);
                                }}
                              >
                                Details
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-500">No lessons have been added to this class yet.</p>
                      <Button 
                        className="mt-4"
                        onClick={() => navigate('/AddLesson', { state: { classId } })}
                      >
                        Add First Lesson
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
