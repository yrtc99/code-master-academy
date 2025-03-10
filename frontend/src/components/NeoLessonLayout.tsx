import React, { ReactNode } from 'react';
import { NeoLayout } from './NeoLayout';

interface Props {
  children: ReactNode;
  title: string;
  quizPanel: ReactNode;
}

export function NeoLessonLayout({ children, title, quizPanel }: Props) {
  return (
    <NeoLayout title={title}>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left side - Lesson content */}
        <div className="w-full lg:w-3/5 neo-card">
          <div className="prose max-w-none">
            {children}
          </div>
        </div>
        
        {/* Right side - Quiz and interactive elements */}
        <div className="w-full lg:w-2/5 neo-card">
          <h2 className="text-xl font-bold mb-4">Exercise</h2>
          {quizPanel}
        </div>
      </div>
    </NeoLayout>
  );
}
