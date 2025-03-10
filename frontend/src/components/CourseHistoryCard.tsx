import React from 'react';
import { CourseHistoryItem } from '../utils/courseHistoryModel';
import { Badge } from '@/components/ui/badge';

interface Props {
  course: CourseHistoryItem;
  onContinue: (courseId: string) => void;
  onViewDetails: (courseId: string) => void;
}

export const CourseHistoryCard: React.FC<Props> = ({ 
  course,
  onContinue,
  onViewDetails
}) => {
  const formatDate = (isoDate: string) => {
    return new Date(isoDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const getStatusBadge = () => {
    switch (course.status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Completed</Badge>;
      case 'inProgress':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">In Progress</Badge>;
      case 'revisiting':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">Revisiting</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Not Started</Badge>;
    }
  };
  
  const getButtonText = () => {
    switch (course.status) {
      case 'completed':
        return 'Review Course';
      case 'revisiting':
        return 'Continue Review';
      case 'inProgress':
        return 'Continue';
      default:
        return 'Start';
    }
  };
  
  const getButtonClass = () => {
    return course.status === 'revisiting' 
      ? 'bg-purple-600 hover:bg-purple-700 text-white' 
      : 'bg-blue-600 hover:bg-blue-700 text-white';
  };
  
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 truncate">{ course.courseName }</h3>
        { getStatusBadge() }
      </div>
      
      <div className="p-4 space-y-3">
        {/* Progress display */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Completion</span>
            <span>{course.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${course.status === 'revisiting' ? 'bg-purple-600' : 'bg-blue-600'}`}
              style={{ width: `${course.progress}%` }}
            ></div>
          </div>
        </div>
        
        {/* Course stats */}
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 pt-1">
          <div>
            <span className="font-medium">Enrolled:</span> {formatDate(course.enrollmentDate)}
          </div>
          
          {course.completionDate && (
            <div>
              <span className="font-medium">Completed:</span> {formatDate(course.completionDate)}
            </div>
          )}
          
          <div>
            <span className="font-medium">Lessons:</span> {course.completedLessons}/{course.totalLessons}
          </div>
          
          <div>
            <span className="font-medium">Average Score:</span> {course.averageScore}%
          </div>
          
          <div>
            <span className="font-medium">Last Accessed:</span> {formatDate(course.lastAccessedDate)}
          </div>
        </div>
      </div>
      
      {/* Card actions */}
      <div className="p-4 bg-gray-50 border-t border-gray-200 flex space-x-2">
        <button
          onClick={() => onContinue(course.courseId)}
          className={`flex-1 px-4 py-2 rounded text-sm font-medium ${getButtonClass()}`}
        >
          {getButtonText()}
        </button>
        
        <button
          onClick={() => onViewDetails(course.courseId)}
          className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded text-sm font-medium hover:bg-gray-50"
        >
          View Details
        </button>
      </div>
    </div>
  );
};
