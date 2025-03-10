import React from 'react';
import { ClassModel } from '../utils/classModel';

interface Props {
  classData: ClassModel;
  onViewDetails: (classId: string) => void;
  onManageStudents?: (classId: string) => void;
}

export function ClassCard({ classData, onViewDetails, onManageStudents }: Props) {
  const { id, name, description, imageUrl, studentIds = [], createdAt } = classData;
  
  // Format creation date
  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  return (
    <div className="neo-card-interactive h-full flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-bold">{name}</h3>
        <span className="neo-badge neo-accent">
          {studentIds?.length || 0} Students
        </span>
      </div>
      
      <p className="text-sm mb-4 flex-grow">{description}</p>
      
      <div className="mt-auto">
        <div className="mb-4">
          <span className="text-xs font-medium">Created: {formattedDate}</span>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => onViewDetails(id)}
            className="neo-button py-2 px-4 text-sm neo-primary flex-1"
          >
            View Details
          </button>
          <button
            onClick={() => onManageStudents(id)}
            className="neo-button py-2 px-4 text-sm bg-white text-black flex-1"
          >
            Manage Students
          </button>
        </div>
      </div>
    </div>
  );
}
