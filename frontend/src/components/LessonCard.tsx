import React from 'react';
import { LessonModel } from '../utils/lessonModel';

interface Props {
  lessonData: LessonModel;
  onViewDetails: (lessonId: string) => void;
}

export function LessonCard({ lessonData, onViewDetails }: Props) {
  const { id, title, description, programmingLanguage, difficultyLevel, testCases = [], createdAt, isPublished } = lessonData;
  
  // Format date for display
  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  // Generate language badge colors for neobrutalism design
  const getLangColor = (lang: string) => {
    const colors: Record<string, string> = {
      javascript: 'bg-[#FFDE59] text-black',
      python: 'bg-[#00BFFF] text-black',
      java: 'bg-[#FF5C00] text-white',
      csharp: 'bg-[#00FF85] text-black',
      cpp: 'bg-[#D580FF] text-black',
      ruby: 'bg-[#FF0055] text-white',
      php: 'bg-[#6C5CE7] text-white',
      swift: 'bg-[#FF8700] text-black',
    };
    return colors[lang] || 'bg-[#F2F2F2] text-black';
  };
  
  // Generate difficulty badge color
  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      beginner: 'bg-[#00FF85] text-black',
      intermediate: 'bg-[#FFDE59] text-black',
      advanced: 'bg-[#FF0055] text-white',
    };
    return colors[difficulty] || 'bg-[#F2F2F2] text-black';
  };
  
  return (
    <div className="neo-card-interactive h-full flex flex-col">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-bold truncate">{title}</h3>
        <div>
          {isPublished ? (
            <span className="neo-badge neo-success">
              Published
            </span>
          ) : (
            <span className="neo-badge bg-[#F2F2F2] text-black">
              Draft
            </span>
          )}
        </div>
      </div>
      
      <div className="flex flex-wrap gap-1 mb-3">
        <span className={`neo-badge ${getLangColor(programmingLanguage)}`}>
          {programmingLanguage.charAt(0).toUpperCase() + programmingLanguage.slice(1)}
        </span>
        <span className={`neo-badge ${getDifficultyColor(difficultyLevel)}`}>
          {difficultyLevel.charAt(0).toUpperCase() + difficultyLevel.slice(1)}
        </span>
      </div>
      
      <p className="text-sm line-clamp-2 h-10 mb-3">
        {description || "No description provided."}
      </p>
      
      <div className="mt-auto">
        <div className="flex items-center mb-4">
          <div className="flex items-center mr-4">
            <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-bold">{testCases.length} test(s)</span>
          </div>
          <span className="text-xs">{formattedDate}</span>
        </div>
        
        <button
          onClick={() => id && onViewDetails(id)}
          className="neo-button py-2 px-4 text-sm neo-primary w-full"
        >
          View Details
        </button>
      </div>
    </div>
  );
}
