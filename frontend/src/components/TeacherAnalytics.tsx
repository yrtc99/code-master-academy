import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ClassModel } from '../utils/classModel';
import { LessonModel } from '../utils/lessonModel';
import { getStudentProgressByClass, getClassStatistics, ClassStatistics } from '../utils/analyticsHelpers';

interface Props {
  classes: ClassModel[];
  lessons: LessonModel[];
  teacherId: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export const TeacherAnalytics: React.FC<Props> = ({ classes, lessons, teacherId }) => {
  const [classStats, setClassStats] = useState<ClassStatistics[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<'completion' | 'scores'>('completion');
  const [selectedView, setSelectedView] = useState<'chart' | 'summary'>('chart');
  const [selectedClass, setSelectedClass] = useState<string | 'all'>('all');

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const stats = await getClassStatistics(classes, teacherId);
        setClassStats(stats);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    if (classes.length > 0) {
      fetchAnalytics();
    } else {
      setLoading(false);
    }
  }, [classes, teacherId]);

  // Filter stats based on selected class
  const filteredStats = selectedClass === 'all' 
    ? classStats 
    : classStats.filter(stat => stat.classId === selectedClass);

  // Prepare data for charts
  const chartData = filteredStats.map(stat => ({
    name: stat.className,
    completion: stat.completionRate,
    averageScore: stat.averageScore,
    students: stat.studentCount,
  }));

  // Prepare data for completion distribution pie chart
  const completionDistribution = [
    { name: 'Complete', value: 0 },
    { name: 'In Progress', value: 0 },
    { name: 'Not Started', value: 0 },
  ];

  filteredStats.forEach(stat => {
    completionDistribution[0].value += Math.round(stat.completedLessons);
    completionDistribution[1].value += Math.round(stat.inProgressLessons);
    completionDistribution[2].value += Math.round(stat.notStartedLessons);
  });

  // Calculate overall stats for summary view
  const calculateOverallStats = () => {
    if (filteredStats.length === 0) return { completion: 0, score: 0, students: 0 };
    
    const totalStudents = filteredStats.reduce((sum, stat) => sum + stat.studentCount, 0);
    const weightedCompletionSum = filteredStats.reduce(
      (sum, stat) => sum + (stat.completionRate * stat.studentCount), 0
    );
    const weightedScoreSum = filteredStats.reduce(
      (sum, stat) => sum + (stat.averageScore * stat.studentCount), 0
    );
    
    return {
      completion: totalStudents > 0 ? Math.round(weightedCompletionSum / totalStudents) : 0,
      score: totalStudents > 0 ? Math.round(weightedScoreSum / totalStudents) : 0,
      students: totalStudents
    };
  };

  const overallStats = calculateOverallStats();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Class Performance Analytics</h2>
      
      {/* Control panel */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label htmlFor="class-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Class
          </label>
          <select
            id="class-filter"
            className="border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="all">All Classes</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="metric-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Metric
          </label>
          <select
            id="metric-filter"
            className="border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as 'completion' | 'scores')}
          >
            <option value="completion">Completion Rate</option>
            <option value="scores">Average Scores</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="view-filter" className="block text-sm font-medium text-gray-700 mb-1">
            View
          </label>
          <select
            id="view-filter"
            className="border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedView}
            onChange={(e) => setSelectedView(e.target.value as 'chart' | 'summary')}
          >
            <option value="chart">Charts</option>
            <option value="summary">Summary</option>
          </select>
        </div>
      </div>

      {/* Summary View */}
      {selectedView === 'summary' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-blue-800 mb-2">Overall Completion</h3>
            <div className="text-3xl font-bold text-blue-600">{overallStats.completion}%</div>
            <p className="text-sm text-blue-600 mt-1">
              {completionDistribution[0].value} of {completionDistribution[0].value + completionDistribution[1].value + completionDistribution[2].value} lessons completed
            </p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-green-800 mb-2">Average Score</h3>
            <div className="text-3xl font-bold text-green-600">{overallStats.score}%</div>
            <p className="text-sm text-green-600 mt-1">
              Across {filteredStats.length} classes
            </p>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-purple-800 mb-2">Total Students</h3>
            <div className="text-3xl font-bold text-purple-600">{overallStats.students}</div>
            <p className="text-sm text-purple-600 mt-1">
              Enrolled in {filteredStats.length} classes
            </p>
          </div>
        </div>
      )}

      {/* Charts View */}
      {selectedView === 'chart' && chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Bar Chart - Class Performance */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-4">
              {selectedMetric === 'completion' ? 'Class Completion Rates' : 'Class Average Scores'}
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey={selectedMetric === 'completion' ? 'completion' : 'averageScore'}
                    name={selectedMetric === 'completion' ? 'Completion Rate (%)' : 'Average Score (%)'}
                    fill={selectedMetric === 'completion' ? '#0088FE' : '#00C49F'}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Pie Chart - Completion Distribution */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Lesson Completion Status</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={completionDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {completionDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} lessons`, null]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* No data message */}
      {chartData.length === 0 && (
        <div className="text-center py-10">
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
          <h3 className="mt-2 text-sm font-medium text-gray-900">No performance data available</h3>
          <p className="mt-1 text-sm text-gray-500">
            {classes.length === 0 
              ? 'Create a class and add students to see performance analytics.'
              : 'Students need to complete lessons for performance data to appear.'}
          </p>
        </div>
      )}
      
      {/* Class-specific tips based on analytics */}
      {filteredStats.length > 0 && selectedClass !== 'all' && (
        <div className="mt-8 bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-blue-800 mb-2">Teaching Insights</h3>
          <ul className="text-blue-700 list-disc list-inside space-y-2">
            {filteredStats[0].averageScore < 70 && (
              <li>The average score is below 70%. Consider providing additional resources or review sessions.</li>
            )}
            {filteredStats[0].completionRate < 50 && (
              <li>Less than half of assigned lessons are completed. Check if lesson difficulty is appropriate.</li>
            )}
            {filteredStats[0].averageScore > 90 && (
              <li>Students are scoring very well! Consider introducing more challenging material.</li>
            )}
            <li>Regularly remind students about incomplete lessons to increase completion rates.</li>
          </ul>
        </div>
      )}
    </div>
  );
};
