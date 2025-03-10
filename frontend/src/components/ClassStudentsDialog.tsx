import React, { useState, useEffect } from 'react';
import { UserProfile, getAllStudents } from '../utils/userRoles';
import { ClassModel, getStudentsForClass, enrollStudentInClass, removeStudentFromClass } from '../utils/classModel';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  classData: ClassModel;
  onStudentsUpdated?: () => void;
}

export function ClassStudentsDialog({ isOpen, onClose, classData, onStudentsUpdated }: Props) {
  const [enrolledStudents, setEnrolledStudents] = useState<UserProfile[]>([]);
  const [allStudents, setAllStudents] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'enrolled' | 'available'>('enrolled');
  const [processingStudents, setProcessingStudents] = useState<Set<string>>(new Set());
  
  // Load data when dialog opens
  useEffect(() => {
    if (isOpen && classData.id) {
      loadData();
    }
  }, [isOpen, classData.id]);
  
  const loadData = async () => {
    if (!classData.id) return;
    
    setLoading(true);
    try {
      // Load enrolled students
      const enrolled = await getStudentsForClass(classData.id);
      setEnrolledStudents(enrolled);
      
      // Load all students
      const all = await getAllStudents();
      setAllStudents(all);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Enroll a student
  const handleEnrollStudent = async (studentId: string) => {
    if (!classData.id) return;
    
    setProcessingStudents(prev => new Set(prev).add(studentId));
    
    try {
      await enrollStudentInClass(classData.id, studentId);
      await loadData(); // Reload data
      if (onStudentsUpdated) onStudentsUpdated();
    } catch (error) {
      console.error('Error enrolling student:', error);
    } finally {
      setProcessingStudents(prev => {
        const updated = new Set(prev);
        updated.delete(studentId);
        return updated;
      });
    }
  };
  
  // Remove a student
  const handleRemoveStudent = async (studentId: string) => {
    if (!classData.id) return;
    
    setProcessingStudents(prev => new Set(prev).add(studentId));
    
    try {
      await removeStudentFromClass(classData.id, studentId);
      await loadData(); // Reload data
      if (onStudentsUpdated) onStudentsUpdated();
    } catch (error) {
      console.error('Error removing student:', error);
    } finally {
      setProcessingStudents(prev => {
        const updated = new Set(prev);
        updated.delete(studentId);
        return updated;
      });
    }
  };
  
  // Get available students (not enrolled)
  const availableStudents = allStudents.filter(student => 
    !enrolledStudents.some(enrolled => enrolled.uid === student.uid)
  );
  
  // Filter students based on search term
  const filterStudents = (students: UserProfile[]) => {
    if (!searchTerm) return students;
    
    const searchLower = searchTerm.toLowerCase();
    return students.filter(student => {
      return (
        (student.displayName?.toLowerCase().includes(searchLower) || false) ||
        (student.email?.toLowerCase().includes(searchLower) || false)
      );
    });
  };
  
  const filteredEnrolledStudents = filterStudents(enrolledStudents);
  const filteredAvailableStudents = filterStudents(availableStudents);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Manage Students for {classData.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('enrolled')}
              className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm ${activeTab === 'enrolled' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Enrolled Students ({enrolledStudents.length})
            </button>
            <button
              onClick={() => setActiveTab('available')}
              className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm ${activeTab === 'available' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Available Students ({availableStudents.length})
            </button>
          </nav>
        </div>
        
        <div className="p-6">
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search students..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="overflow-auto max-h-[calc(90vh-250px)]">
            {loading ? (
              <div className="py-20 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-3 text-gray-600">Loading students...</p>
              </div>
            ) : activeTab === 'enrolled' ? (
              /* Enrolled Students */
              filteredEnrolledStudents.length === 0 ? (
                <div className="py-20 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="mt-2 text-lg font-medium text-gray-900">No students enrolled</p>
                  <p className="mt-1 text-gray-500">
                    {searchTerm ? 'Try a different search term' : 'Add students to this class to get started'}
                  </p>
                </div>
              ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {filteredEnrolledStudents.map((student) => (
                      <li key={student.uid} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                        <div className="min-w-0 flex-1 flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                              {student.displayName ? student.displayName.charAt(0).toUpperCase() : 'S'}
                            </div>
                          </div>
                          <div className="min-w-0 flex-1 px-4">
                            <div>
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {student.displayName || 'Unnamed Student'}
                              </p>
                              <p className="text-sm text-gray-500 truncate">{student.email}</p>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveStudent(student.uid)}
                          disabled={processingStudents.has(student.uid)}
                          className="ml-4 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processingStudents.has(student.uid) ? (
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : 'Remove'}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            ) : (
              /* Available Students */
              filteredAvailableStudents.length === 0 ? (
                <div className="py-20 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="mt-2 text-lg font-medium text-gray-900">No available students</p>
                  <p className="mt-1 text-gray-500">
                    {searchTerm ? 'Try a different search term' : 'All students are already enrolled in this class'}
                  </p>
                </div>
              ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {filteredAvailableStudents.map((student) => (
                      <li key={student.uid} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                        <div className="min-w-0 flex-1 flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                              {student.displayName ? student.displayName.charAt(0).toUpperCase() : 'S'}
                            </div>
                          </div>
                          <div className="min-w-0 flex-1 px-4">
                            <div>
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {student.displayName || 'Unnamed Student'}
                              </p>
                              <p className="text-sm text-gray-500 truncate">{student.email}</p>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleEnrollStudent(student.uid)}
                          disabled={processingStudents.has(student.uid)}
                          className="ml-4 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processingStudents.has(student.uid) ? (
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : 'Enroll'}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            )}
          </div>
        </div>
        
        <div className="px-6 py-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
