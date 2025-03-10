import React from 'react';
import { ClassModel } from '../utils/classModel';
import { ClassProgress } from '../utils/studentProgressModel';

interface Props {
  classData: ClassModel;
  classProgress?: ClassProgress;
  totalLessons: number;
  onContinue: (classId: string) => void;
  onViewDetails: (classId: string) => void;
  courseStatus?: 'inProgress' | 'completed' | 'notStarted' | 'revisiting';
}

export const StudentClassCard: React.FC<Props> = ({ 
  classData, 
  classProgress, 
  totalLessons, 
  onContinue, 
  onViewDetails,
  courseStatus
}) => {
  // Calculate progress percentage
  const calculateProgress = (): number => {
    if (!classProgress || !classProgress.lessonProgresses || totalLessons === 0) {
      return 0;
    }
    
    const completedLessons = classProgress.lessonProgresses.filter(lp => lp.completed).length;
    return Math.round((completedLessons / totalLessons) * 100);
  };
  
  const progressPercentage = calculateProgress();
  const completedLessons = classProgress?.lessonProgresses.filter(lp => lp.completed).length || 0;
  
  // Determine card status
  const getStatusBadge = () => {
    const status = courseStatus || (progressPercentage === 100 ? 'completed' : progressPercentage > 0 ? 'inProgress' : 'notStarted');
    
    switch (status) {
      case 'completed':
        return (
          <span className="px-3 py-1 text-xs font-bold border-2 border-black bg-[#BAFF29]">
            Completed
          </span>
        );
      case 'inProgress':
        return (
          <span className="px-3 py-1 text-xs font-bold border-2 border-black bg-[#C2CCFF]">
            In Progress
          </span>
        );
      case 'revisiting':
        return (
          <span className="px-3 py-1 text-xs font-bold border-2 border-black bg-[#FFD6F9]">
            Revisiting
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 text-xs font-bold border-2 border-black bg-[#F2F2F2]">
            Not Started
          </span>
        );
    }
  };
  
  // Get the button text based on course status
  const getButtonText = () => {
    const status = courseStatus || (progressPercentage === 100 ? 'completed' : progressPercentage > 0 ? 'inProgress' : 'notStarted');
    
    switch (status) {
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
  
  return (
    <div className="neo-card">
      {/* Card Header */}
      <div className="p-4 border-b-3 border-black flex justify-between items-center">
        <h3 className="text-lg font-bold truncate">
          {classData.name || 'Unnamed Class'}
        </h3>
        {getStatusBadge()}
      </div>
      
      {/* Card Body */}
      <div className="p-4">
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">
          {classData.description || 'No description provided'}
        </p>
        
        {/* Progress Bar */}
        <div className="mt-4 mb-3">
          <div className="flex justify-between text-xs font-bold mb-1">
            <span>Progress</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="w-full bg-[#F2F2F2] border-2 border-black h-4">
            <div 
              className={`h-3 ${courseStatus === 'revisiting' ? 'bg-[#FFD6F9]' : 'bg-[#C2CCFF]'}`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="text-xs font-medium mt-1">
            {completedLessons} of {totalLessons} lessons completed
          </div>
        </div>
        
        {/* Completion Date for completed courses */}
        {courseStatus === 'completed' && classProgress?.lessonProgresses.some(lp => lp.completedAt) && (
          <div className="mt-3 text-xs border-2 border-black inline-block px-3 py-1 bg-[#BAFF29]">
            <span className="font-bold">Completed:</span> {
              new Date(Math.max(
                ...classProgress.lessonProgresses
                  .filter(lp => lp.completedAt)
                  .map(lp => new Date(lp.completedAt!).getTime())
              )).toLocaleDateString()
            }
          </div>
        )}
        
        {/* Teacher Info */}
        <div className="flex items-center mt-4">
          <div className="flex-shrink-0 h-8 w-8 border-2 border-black bg-[#FF5C00] flex items-center justify-center">
            <span className="text-xs font-bold text-white">
              {classData.teacherName ? classData.teacherName.charAt(0).toUpperCase() : 'T'}
            </span>
          </div>
          <div className="ml-2">
            <p className="text-xs font-medium">
              Teacher: <span className="font-bold">{classData.teacherName || 'Unknown Teacher'}</span>
            </p>
          </div>
        </div>
      </div>
      
      {/* Card Footer */}
      <div className="p-4 border-t-3 border-black flex space-x-3">
        <button
          onClick={() => onContinue(classData.id!)}
          className={`neo-button flex-1 font-bold ${courseStatus === 'revisiting' ? 'bg-[#FFD6F9]' : courseStatus === 'completed' ? 'bg-[#BAFF29]' : 'neo-primary'}`}
        >
          {getButtonText()}
        </button>
        
        <button
          onClick={() => onViewDetails(classData.id!)}
          className="neo-button flex-1 bg-white"
        >
          View Details
        </button>
      </div>
    </div>
  );
};