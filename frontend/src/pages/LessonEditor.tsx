import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUserGuardContext } from 'app';
import { LessonModel, getLessonById, updateLesson, toggleLessonPublished } from '../utils/lessonModel';
import { ClassModel, getTeacherClasses } from '../utils/classModel';
import { getUserProfile } from '../utils/userRoles';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export default function LessonEditor() {
  const { user } = useUserGuardContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lessonId = searchParams.get('lessonId');
  
  const [lesson, setLesson] = useState<LessonModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [classes, setClasses] = useState<ClassModel[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('general');
  
  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedLesson, setEditedLesson] = useState<LessonModel | null>(null);
  
  // Version history state
  const [versionHistory, setVersionHistory] = useState<{ updatedAt: string, changes: string }[]>([]);
  
  // Fetch lesson data
  useEffect(() => {
    const fetchData = async () => {
      if (!lessonId || !user?.uid) {
        setError('Missing required parameters');
        setIsLoading(false);
        return;
      }
      
      try {
        // Fetch lesson
        const lessonData = await getLessonById(lessonId);
        if (!lessonData) {
          setError('Lesson not found');
          setIsLoading(false);
          return;
        }
        
        // Verify this lesson belongs to the current user
        const userProfile = await getUserProfile(user.uid);
        if (userProfile?.role !== 'teacher' || lessonData.teacherId !== user.uid) {
          setError('You do not have permission to edit this lesson');
          setIsLoading(false);
          return;
        }
        
        // Fetch classes for class selection
        const teacherClasses = await getTeacherClasses(user.uid);
        setClasses(teacherClasses);
        
        // Set lesson data
        setLesson(lessonData);
        setEditedLesson(lessonData);
        
        // For demonstration, we'll create mock version history
        // In a real app, this would be fetched from the database
        const mockVersionHistory = [
          {
            updatedAt: lessonData.createdAt,
            changes: 'Initial creation of lesson'
          }
        ];
        
        // If the lesson has been updated, add that to history
        if (lessonData.updatedAt !== lessonData.createdAt) {
          mockVersionHistory.push({
            updatedAt: lessonData.updatedAt,
            changes: 'Updated lesson content'
          });
        }
        
        setVersionHistory(mockVersionHistory);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching lesson:', error);
        setError('Failed to load lesson data');
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [lessonId, user?.uid]);
  
  // Handle field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setEditedLesson(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [name]: value
      };
    });
  };
  
  // Toggle published status
  const handleTogglePublished = async () => {
    if (!lesson?.id) return;
    
    try {
      const newStatus = !lesson.isPublished;
      await toggleLessonPublished(lesson.id, newStatus);
      
      // Update local state
      setLesson(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          isPublished: newStatus
        };
      });
      
      setEditedLesson(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          isPublished: newStatus
        };
      });
      
      toast.success(`Lesson ${newStatus ? 'published' : 'unpublished'} successfully`);
    } catch (error) {
      console.error('Error toggling publish status:', error);
      toast.error('Failed to update lesson status');
    }
  };
  
  // Save changes
  const handleSave = async () => {
    if (!editedLesson?.id) return;
    
    setIsSaving(true);
    
    try {
      await updateLesson(editedLesson.id, editedLesson);
      
      // Update local state
      setLesson(editedLesson);
      
      // Add to version history
      const now = new Date().toISOString();
      setVersionHistory(prev => [
        ...prev,
        {
          updatedAt: now,
          changes: 'Updated lesson content'
        }
      ]);
      
      setIsEditing(false);
      toast.success('Lesson updated successfully');
    } catch (error) {
      console.error('Error updating lesson:', error);
      toast.error('Failed to update lesson');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Cancel editing
  const handleCancel = () => {
    setEditedLesson(lesson);
    setIsEditing(false);
  };
  
  if (isLoading) {
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
          <Button
            onClick={() => navigate('/TeacherDashboard')}
            className="mt-4"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Lesson' : 'Lesson Details'}
            </h1>
            <p className="text-sm text-gray-500">
              {lesson.difficultyLevel.charAt(0).toUpperCase() + lesson.difficultyLevel.slice(1)} • 
              {lesson.programmingLanguage}
            </p>
          </div>
          <div className="flex space-x-3">
            {!isEditing && (
              <Button
                variant="outline"
                onClick={() => navigate('/TeacherDashboard')}
              >
                Back to Dashboard
              </Button>
            )}
            
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Edit Lesson
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {isEditing ? editedLesson?.title : lesson.title}
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Created on {formatDate(lesson.createdAt)}
              </p>
            </div>
            <div className="flex items-center">
              <span className={`mr-3 px-2.5 py-0.5 rounded-full text-xs font-medium ${lesson.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {lesson.isPublished ? 'Published' : 'Draft'}
              </span>
              <Button
                variant={lesson.isPublished ? "outline" : "default"}
                onClick={handleTogglePublished}
                className={lesson.isPublished ? "border-amber-500 text-amber-500 hover:bg-amber-50" : "bg-green-600 hover:bg-green-700 text-white"}
              >
                {lesson.isPublished ? 'Unpublish' : 'Publish'}
              </Button>
            </div>
          </div>
          
          <Tabs 
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="px-4 py-2 border-b border-gray-200">
              <TabsList>
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="assessment">Assessment</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="history">Version History</TabsTrigger>
              </TabsList>
            </div>

            {/* General Tab */}
            <TabsContent value="general" className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                        Lesson Title
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="title"
                          id="title"
                          value={editedLesson?.title || ''}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900">{lesson.title}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="classId" className="block text-sm font-medium text-gray-700 mb-1">
                        Assigned Class
                      </label>
                      {isEditing ? (
                        <select
                          name="classId"
                          id="classId"
                          value={editedLesson?.classId || ''}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Not assigned to a class</option>
                          {classes.map(cls => (
                            <option key={cls.id} value={cls.id}>
                              {cls.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-gray-900">
                          {lesson.classId 
                            ? classes.find(c => c.id === lesson.classId)?.name || 'Unknown class' 
                            : 'Not assigned to a class'}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="programmingLanguage" className="block text-sm font-medium text-gray-700 mb-1">
                        Programming Language
                      </label>
                      {isEditing ? (
                        <select
                          name="programmingLanguage"
                          id="programmingLanguage"
                          value={editedLesson?.programmingLanguage || ''}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="javascript">JavaScript</option>
                          <option value="python">Python</option>
                          <option value="java">Java</option>
                          <option value="csharp">C#</option>
                          <option value="cpp">C++</option>
                          <option value="ruby">Ruby</option>
                          <option value="php">PHP</option>
                          <option value="swift">Swift</option>
                        </select>
                      ) : (
                        <p className="text-gray-900">
                          {lesson.programmingLanguage.charAt(0).toUpperCase() + lesson.programmingLanguage.slice(1)}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="difficultyLevel" className="block text-sm font-medium text-gray-700 mb-1">
                        Difficulty Level
                      </label>
                      {isEditing ? (
                        <select
                          name="difficultyLevel"
                          id="difficultyLevel"
                          value={editedLesson?.difficultyLevel || ''}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                        </select>
                      ) : (
                        <p className="text-gray-900">
                          {lesson.difficultyLevel.charAt(0).toUpperCase() + lesson.difficultyLevel.slice(1)}
                        </p>
                      )}
                    </div>
                    
                    <div className="md:col-span-2">
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      {isEditing ? (
                        <textarea
                          name="description"
                          id="description"
                          value={editedLesson?.description || ''}
                          onChange={handleChange}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900">{lesson.description}</p>
                      )}
                    </div>
                    
                    <div className="md:col-span-2">
                      <label htmlFor="assessmentType" className="block text-sm font-medium text-gray-700 mb-1">
                        Assessment Type
                      </label>
                      {isEditing ? (
                        <select
                          name="assessmentType"
                          id="assessmentType"
                          value={editedLesson?.assessmentType || ''}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="coding">Coding Exercise</option>
                          <option value="dragAndDrop">Drag and Drop (Fill in Blank)</option>
                          <option value="multipleChoice">Multiple Choice Quiz</option>
                        </select>
                      ) : (
                        <p className="text-gray-900">
                          {lesson.assessmentType === 'coding' && 'Coding Exercise'}
                          {lesson.assessmentType === 'dragAndDrop' && 'Drag and Drop (Fill in Blank)'}
                          {lesson.assessmentType === 'multipleChoice' && 'Multiple Choice Quiz'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Content Tab */}
            <TabsContent value="content" className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Lesson Content</h3>
                  <div>
                    <label htmlFor="codeExample" className="block text-sm font-medium text-gray-700 mb-2">
                      Code Example
                    </label>
                    {isEditing ? (
                      <textarea
                        name="codeExample"
                        id="codeExample"
                        value={editedLesson?.codeExample || ''}
                        onChange={handleChange}
                        rows={8}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono"
                      />
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-md overflow-x-auto">
                        <pre className="text-sm text-gray-800 font-mono">{lesson.codeExample}</pre>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Additional content sections can be added here */}
              </div>
            </TabsContent>
            
            {/* Assessment Tab */}
            <TabsContent value="assessment" className="p-6">
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-medium text-gray-900">Assessment Configuration</h3>
                    {isEditing && (
                      <Button variant="outline" className="text-green-600 border-green-600">
                        + Add Test Case
                      </Button>
                    )}
                  </div>
                  
                  {/* For Coding Assessment */}
                  {lesson.assessmentType === 'coding' && (
                    <div>
                      <h4 className="text-md font-medium text-gray-700 mb-3">Test Cases</h4>
                      {lesson.testCases.length > 0 ? (
                        <div className="space-y-4">
                          {lesson.testCases.map((testCase, index) => (
                            <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Input
                                  </label>
                                  {isEditing ? (
                                    <textarea
                                      value={editedLesson?.testCases[index]?.input || ''}
                                      onChange={(e) => {
                                        const updatedTestCases = [...(editedLesson?.testCases || [])];
                                        updatedTestCases[index] = {
                                          ...updatedTestCases[index],
                                          input: e.target.value
                                        };
                                        setEditedLesson(prev => {
                                          if (!prev) return prev;
                                          return {
                                            ...prev,
                                            testCases: updatedTestCases
                                          };
                                        });
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono"
                                      rows={2}
                                    />
                                  ) : (
                                    <div className="bg-white p-2 rounded border border-gray-200 font-mono text-sm">
                                      {testCase.input}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Expected Output
                                  </label>
                                  {isEditing ? (
                                    <textarea
                                      value={editedLesson?.testCases[index]?.expectedOutput || ''}
                                      onChange={(e) => {
                                        const updatedTestCases = [...(editedLesson?.testCases || [])];
                                        updatedTestCases[index] = {
                                          ...updatedTestCases[index],
                                          expectedOutput: e.target.value
                                        };
                                        setEditedLesson(prev => {
                                          if (!prev) return prev;
                                          return {
                                            ...prev,
                                            testCases: updatedTestCases
                                          };
                                        });
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono"
                                      rows={2}
                                    />
                                  ) : (
                                    <div className="bg-white p-2 rounded border border-gray-200 font-mono text-sm">
                                      {testCase.expectedOutput}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Description
                                </label>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editedLesson?.testCases[index]?.description || ''}
                                    onChange={(e) => {
                                      const updatedTestCases = [...(editedLesson?.testCases || [])];
                                      updatedTestCases[index] = {
                                        ...updatedTestCases[index],
                                        description: e.target.value
                                      };
                                      setEditedLesson(prev => {
                                        if (!prev) return prev;
                                        return {
                                          ...prev,
                                          testCases: updatedTestCases
                                        };
                                      });
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                  />
                                ) : (
                                  <p className="text-sm text-gray-700">
                                    {testCase.description || 'No description provided'}
                                  </p>
                                )}
                              </div>
                              
                              {isEditing && (
                                <div className="mt-3 flex justify-end">
                                  <Button 
                                    variant="outline"
                                    className="text-red-600 border-red-600 hover:bg-red-50"
                                    onClick={() => {
                                      const updatedTestCases = editedLesson?.testCases.filter((_, i) => i !== index) || [];
                                      setEditedLesson(prev => {
                                        if (!prev) return prev;
                                        return {
                                          ...prev,
                                          testCases: updatedTestCases
                                        };
                                      });
                                    }}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                          <p className="text-gray-500">No test cases defined</p>
                          {isEditing && (
                            <Button className="mt-2" variant="outline">
                              Add First Test Case
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* For Drag and Drop Assessment */}
                  {lesson.assessmentType === 'dragAndDrop' && lesson.dragAndDropTests && (
                    <div>
                      <h4 className="text-md font-medium text-gray-700 mb-3">Drag and Drop Tests</h4>
                      {lesson.dragAndDropTests.length > 0 ? (
                        <div className="space-y-4">
                          {lesson.dragAndDropTests.map((test, index) => (
                            <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                              <div className="mb-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Instruction
                                </label>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editedLesson?.dragAndDropTests?.[index]?.instruction || ''}
                                    onChange={(e) => {
                                      const updatedTests = [...(editedLesson?.dragAndDropTests || [])];
                                      updatedTests[index] = {
                                        ...updatedTests[index],
                                        instruction: e.target.value
                                      };
                                      setEditedLesson(prev => {
                                        if (!prev) return prev;
                                        return {
                                          ...prev,
                                          dragAndDropTests: updatedTests
                                        };
                                      });
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                  />
                                ) : (
                                  <p className="text-sm text-gray-700">{test.instruction}</p>
                                )}
                              </div>
                              
                              <div className="mb-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Content Preview
                                </label>
                                <div className="bg-white p-3 rounded border border-gray-200">
                                  {test.content.map((item) => (
                                    <span key={item.id} className={item.isBlank ? "bg-blue-100 px-2 py-1 mx-1 rounded" : ""}>
                                      {item.isBlank ? `[______]` : item.text}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              
                              <div className="mb-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Available Options
                                </label>
                                <div className="flex flex-wrap gap-2">
                                  {test.options.map((option, i) => (
                                    <div key={i} className="bg-gray-100 px-2 py-1 rounded text-sm">
                                      {option}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              {isEditing && (
                                <div className="mt-3 flex justify-end">
                                  <Button 
                                    variant="outline"
                                    className="text-red-600 border-red-600 hover:bg-red-50"
                                    onClick={() => {
                                      const updatedTests = editedLesson?.dragAndDropTests?.filter((_, i) => i !== index) || [];
                                      setEditedLesson(prev => {
                                        if (!prev) return prev;
                                        return {
                                          ...prev,
                                          dragAndDropTests: updatedTests
                                        };
                                      });
                                    }}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                          <p className="text-gray-500">No drag and drop exercises defined</p>
                          {isEditing && (
                            <Button className="mt-2" variant="outline">
                              Add First Exercise
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* For Multiple Choice Assessment */}
                  {lesson.assessmentType === 'multipleChoice' && lesson.multipleChoiceQuestions && (
                    <div>
                      <h4 className="text-md font-medium text-gray-700 mb-3">Multiple Choice Questions</h4>
                      {lesson.multipleChoiceQuestions.length > 0 ? (
                        <div className="space-y-4">
                          {lesson.multipleChoiceQuestions.map((question, index) => (
                            <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                              <div className="mb-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Question
                                </label>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editedLesson?.multipleChoiceQuestions?.[index]?.question || ''}
                                    onChange={(e) => {
                                      const updatedQuestions = [...(editedLesson?.multipleChoiceQuestions || [])];
                                      updatedQuestions[index] = {
                                        ...updatedQuestions[index],
                                        question: e.target.value
                                      };
                                      setEditedLesson(prev => {
                                        if (!prev) return prev;
                                        return {
                                          ...prev,
                                          multipleChoiceQuestions: updatedQuestions
                                        };
                                      });
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                  />
                                ) : (
                                  <p className="text-sm text-gray-700">{question.question}</p>
                                )}
                              </div>
                              
                              <div className="mb-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Options
                                </label>
                                <div className="space-y-2">
                                  {question.options.map((option) => (
                                    <div 
                                      key={option.id} 
                                      className={`p-2 rounded ${option.id === question.correctOptionId ? 'bg-green-100 border border-green-300' : 'bg-white border border-gray-200'}`}
                                    >
                                      <div className="flex items-center">
                                        <div className={`w-4 h-4 rounded-full mr-2 ${option.id === question.correctOptionId ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                                        {isEditing ? (
                                          <input 
                                            type="text"
                                            value={editedLesson?.multipleChoiceQuestions?.[index]?.options.find(o => o.id === option.id)?.text || ''}
                                            onChange={(e) => {
                                              const updatedQuestions = [...(editedLesson?.multipleChoiceQuestions || [])];
                                              const optionIndex = updatedQuestions[index].options.findIndex(o => o.id === option.id);
                                              if (optionIndex !== -1) {
                                                updatedQuestions[index].options[optionIndex].text = e.target.value;
                                                setEditedLesson(prev => {
                                                  if (!prev) return prev;
                                                  return {
                                                    ...prev,
                                                    multipleChoiceQuestions: updatedQuestions
                                                  };
                                                });
                                              }
                                            }}
                                            className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                          />
                                        ) : (
                                          <span>{option.text}</span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              {isEditing && (
                                <div className="mt-3 flex justify-end">
                                  <Button 
                                    variant="outline"
                                    className="text-red-600 border-red-600 hover:bg-red-50"
                                    onClick={() => {
                                      const updatedQuestions = editedLesson?.multipleChoiceQuestions?.filter((_, i) => i !== index) || [];
                                      setEditedLesson(prev => {
                                        if (!prev) return prev;
                                        return {
                                          ...prev,
                                          multipleChoiceQuestions: updatedQuestions
                                        };
                                      });
                                    }}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                          <p className="text-gray-500">No multiple choice questions defined</p>
                          {isEditing && (
                            <Button className="mt-2" variant="outline">
                              Add First Question
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            {/* Preview Tab */}
            <TabsContent value="preview" className="p-6">
              <div className="bg-gray-100 p-5 rounded-lg border border-gray-300">
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">{lesson.title}</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      {lesson.difficultyLevel.charAt(0).toUpperCase() + lesson.difficultyLevel.slice(1)} • 
                      {lesson.programmingLanguage}
                    </p>
                  </div>
                  
                  <div className="px-4 py-5 sm:p-6">
                    <div className="mb-6">
                      <h4 className="text-md font-medium text-gray-900 mb-2">Description</h4>
                      <p className="text-gray-700">{lesson.description}</p>
                    </div>
                    
                    <div className="mb-6">
                      <h4 className="text-md font-medium text-gray-900 mb-2">Example Code</h4>
                      <div className="bg-gray-50 p-4 rounded-md overflow-x-auto">
                        <pre className="text-sm text-gray-800 font-mono">{lesson.codeExample}</pre>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-2">Assessment</h4>
                      <div className="bg-gray-50 p-4 rounded-md">
                        {lesson.assessmentType === 'coding' && (
                          <div>
                            <p className="text-gray-700 mb-2">This lesson contains a coding exercise with {lesson.testCases.length} test case(s).</p>
                            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                              <p className="text-sm text-blue-800">Students will write code and submit it for evaluation against the test cases.</p>
                            </div>
                          </div>
                        )}
                        
                        {lesson.assessmentType === 'dragAndDrop' && lesson.dragAndDropTests && (
                          <div>
                            <p className="text-gray-700 mb-2">This lesson contains {lesson.dragAndDropTests.length} drag and drop exercise(s).</p>
                            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                              <p className="text-sm text-blue-800">Students will drag options to fill in blanks in the provided content.</p>
                            </div>
                          </div>
                        )}
                        
                        {lesson.assessmentType === 'multipleChoice' && lesson.multipleChoiceQuestions && (
                          <div>
                            <p className="text-gray-700 mb-2">This lesson contains {lesson.multipleChoiceQuestions.length} multiple choice question(s).</p>
                            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                              <p className="text-sm text-blue-800">Students will select the correct answers from multiple choices.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Version History Tab */}
            <TabsContent value="history" className="p-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-lg font-medium text-gray-900">Version History</span>
                </div>
              </div>
              
              <div className="mt-6 flow-root">
                <ul className="-mb-8">
                  {versionHistory.map((version, index) => (
                    <li key={index}>
                      <div className="relative pb-8">
                        {index !== versionHistory.length - 1 ? (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                              <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                              </svg>
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-500">{version.changes}</p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              <time dateTime={version.updatedAt}>{formatDate(version.updatedAt)}</time>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
