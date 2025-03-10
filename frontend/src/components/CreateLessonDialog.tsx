import React, { useState, useEffect } from 'react';
import { 
  TestCase, 
  LessonFormData, 
  createLesson, 
  AssessmentType,
  DragAndDropTest,
  DragAndDropItem,
  MultipleChoiceQuestion,
  MultipleChoiceOption
} from '../utils/lessonModel';
import { ClassModel } from '../utils/classModel';

interface Props {
  isOpen: boolean;
  teacherId: string;
  classes: ClassModel[];
  onClose: () => void;
  onLessonCreated: () => void;
}

const programmingLanguages = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
  { value: 'cpp', label: 'C++' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'php', label: 'PHP' },
  { value: 'swift', label: 'Swift' },
];

const difficultyLevels = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

interface NewTestCase extends Omit<TestCase, 'id'> {}

export function CreateLessonDialog({ isOpen, teacherId, classes, onClose, onLessonCreated }: Props) {
  const [formData, setFormData] = useState<LessonFormData>({
    title: '',
    description: '',
    programmingLanguage: 'javascript',
    difficultyLevel: 'beginner',
    assessmentType: 'coding',
    codeExample: '// Write your code example here\n\nfunction example() {\n  console.log("Hello World");\n}',
    testCases: [],
    dragAndDropTests: [],
    multipleChoiceQuestions: [],
    isPublished: false
  });
  
  const [newTestCase, setNewTestCase] = useState<NewTestCase>({
    input: '',
    expectedOutput: '',
    description: ''
  });
  
  // Drag and Drop state
  const [newDragAndDropTest, setNewDragAndDropTest] = useState<DragAndDropTest>({
    instruction: '',
    content: [],
    options: [],
    correctAnswers: {}
  });
  
  const [dragDropContent, setDragDropContent] = useState('');
  const [availableOptions, setAvailableOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState('');
  const [showBlankMapping, setShowBlankMapping] = useState(false);
  const [activeBlankIds, setActiveBlankIds] = useState<string[]>([]);
  const [tempDragAndDropContent, setTempDragAndDropContent] = useState<DragAndDropItem[]>([]);
  const [blankMappings, setBlankMappings] = useState<Record<string, string>>({});
  
  // Multiple Choice state
  const [newMultipleChoiceQuestion, setNewMultipleChoiceQuestion] = useState<MultipleChoiceQuestion>({
    question: '',
    options: [],
    correctOptionId: '',
    explanation: ''
  });
  
  const [newMCOption, setNewMCOption] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTestCaseChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewTestCase(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addTestCase = () => {
    if (!newTestCase.input.trim() || !newTestCase.expectedOutput.trim()) {
      setError('Test case input and expected output are required');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      testCases: [...prev.testCases, { ...newTestCase }]
    }));
    
    // Reset new test case form
    setNewTestCase({
      input: '',
      expectedOutput: '',
      description: ''
    });
    
    setError('');
  };

  const removeTestCase = (index: number) => {
    setFormData(prev => ({
      ...prev,
      testCases: prev.testCases.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.title.trim()) {
      setError('Lesson title is required');
      return;
    }
    
    if (formData.assessmentType === 'coding') {
      if (!formData.codeExample.trim()) {
        setError('Code example is required');
        return;
      }
      
      if (formData.testCases.length === 0) {
        setError('At least one test case is required');
        return;
      }
    } else if (formData.assessmentType === 'dragAndDrop') {
      if (!formData.dragAndDropTests || formData.dragAndDropTests.length === 0) {
        setError('At least one drag and drop exercise is required');
        return;
      }
    } else if (formData.assessmentType === 'multipleChoice') {
      if (!formData.multipleChoiceQuestions || formData.multipleChoiceQuestions.length === 0) {
        setError('At least one multiple choice question is required');
        return;
      }
    }
    
    setIsSubmitting(true);
    
    try {
      await createLesson(teacherId, formData);
      onLessonCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create lesson');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to handle the blank mapping submission
  const handleBlankMappingSubmit = () => {
    // Make sure all blanks have a corresponding correct answer
    if (Object.keys(blankMappings).length !== activeBlankIds.length) {
      setError('Please assign a correct answer to each blank');
      return;
    }
    
    // Create the new drag and drop test
    const newTest: DragAndDropTest = {
      instruction: newDragAndDropTest.instruction,
      content: tempDragAndDropContent,
      options: [...availableOptions],
      correctAnswers: blankMappings
    };
    
    // Add to form data
    setFormData(prev => ({
      ...prev,
      dragAndDropTests: [...(prev.dragAndDropTests || []), newTest]
    }));
    
    // Reset all state
    setNewDragAndDropTest({
      instruction: '',
      content: [],
      options: [],
      correctAnswers: {}
    });
    setDragDropContent('');
    setAvailableOptions([]);
    setNewOption('');
    setShowBlankMapping(false);
    setActiveBlankIds([]);
    setTempDragAndDropContent([]);
    setBlankMappings({});
    setError('');
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-10">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Create New Lesson</h3>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4">
            {error && (
              <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Lesson Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Introduction to Variables"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="classId" className="block text-sm font-medium text-gray-700 mb-1">
                  Class (Optional)
                </label>
                <select
                  id="classId"
                  name="classId"
                  value={formData.classId || ''}
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
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="A comprehensive introduction to variables and data types..."
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="assessmentType" className="block text-sm font-medium text-gray-700 mb-1">
                  Assessment Type *
                </label>
                <select
                  id="assessmentType"
                  name="assessmentType"
                  value={formData.assessmentType}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      assessmentType: e.target.value as AssessmentType
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="coding">Coding Exercise</option>
                  <option value="dragAndDrop">Drag and Drop (Fill in Blank)</option>
                  <option value="multipleChoice">Multiple Choice Quiz</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="programmingLanguage" className="block text-sm font-medium text-gray-700 mb-1">
                  Programming Language {formData.assessmentType === 'coding' ? '*' : '(Optional)'}
                </label>
                <select
                  id="programmingLanguage"
                  name="programmingLanguage"
                  value={formData.programmingLanguage}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required={formData.assessmentType === 'coding'}
                >
                  {programmingLanguages.map(lang => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="difficultyLevel" className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty Level *
                </label>
                <select
                  id="difficultyLevel"
                  name="difficultyLevel"
                  value={formData.difficultyLevel}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {difficultyLevels.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {formData.assessmentType === 'coding' && (
              <div className="mb-4">
                <label htmlFor="codeExample" className="block text-sm font-medium text-gray-700 mb-1">
                  Code Example *
                </label>
                <textarea
                  id="codeExample"
                  name="codeExample"
                  value={formData.codeExample}
                  onChange={handleChange}
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono"
                  placeholder="// Write your code example here"
                  required
                />
              </div>
            )}
            
            {/* Coding Assessment Form */}
            {formData.assessmentType === 'coding' && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Test Cases *
                  </label>
                  <span className="text-xs text-gray-500">
                    {formData.testCases.length} test case(s) added
                  </span>
                </div>
                
                {/* Test cases list */}
                {formData.testCases.length > 0 && (
                  <div className="mb-4 border rounded-md divide-y">
                    {formData.testCases.map((testCase, index) => (
                      <div key={index} className="p-3 flex justify-between items-start">
                        <div className="flex-1">
                          <div className="grid grid-cols-2 gap-2 mb-1">
                            <div>
                              <span className="text-xs font-medium text-gray-500">Input:</span>
                              <div className="text-sm font-mono bg-gray-50 p-1 rounded">{testCase.input}</div>
                            </div>
                            <div>
                              <span className="text-xs font-medium text-gray-500">Expected Output:</span>
                              <div className="text-sm font-mono bg-gray-50 p-1 rounded">{testCase.expectedOutput}</div>
                            </div>
                          </div>
                          {testCase.description && (
                            <div className="mt-1">
                              <span className="text-xs font-medium text-gray-500">Description:</span>
                              <div className="text-sm">{testCase.description}</div>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeTestCase(index)}
                          className="ml-2 text-red-600 hover:text-red-800"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Add new test case form */}
                <div className="border rounded-md p-3 bg-gray-50">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Add Test Case</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                    <div>
                      <label htmlFor="input" className="block text-xs font-medium text-gray-700 mb-1">
                        Input *
                      </label>
                      <textarea
                        id="input"
                        name="input"
                        value={newTestCase.input}
                        onChange={handleTestCaseChange}
                        rows={2}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono"
                        placeholder="5, 10"
                      />
                    </div>
                    <div>
                      <label htmlFor="expectedOutput" className="block text-xs font-medium text-gray-700 mb-1">
                        Expected Output *
                      </label>
                      <textarea
                        id="expectedOutput"
                        name="expectedOutput"
                        value={newTestCase.expectedOutput}
                        onChange={handleTestCaseChange}
                        rows={2}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono"
                        placeholder="15"
                      />
                    </div>
                  </div>
                  <div className="mb-2">
                    <label htmlFor="testDescription" className="block text-xs font-medium text-gray-700 mb-1">
                      Description (Optional)
                    </label>
                    <input
                      type="text"
                      id="testDescription"
                      name="description"
                      value={newTestCase.description}
                      onChange={handleTestCaseChange}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Tests basic addition"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={addTestCase}
                      className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Add Test Case
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Drag and Drop (Fill-in-blank) Assessment Form */}
            {formData.assessmentType === 'dragAndDrop' && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Drag and Drop Exercises *
                  </label>
                  <span className="text-xs text-gray-500">
                    {formData.dragAndDropTests?.length || 0} exercise(s) added
                  </span>
                </div>
                
                {/* Drag and drop exercises list */}
                {formData.dragAndDropTests && formData.dragAndDropTests.length > 0 && (
                  <div className="mb-4 border rounded-md divide-y">
                    {formData.dragAndDropTests.map((test, index) => (
                      <div key={index} className="p-3 flex justify-between items-start">
                        <div className="flex-1">
                          <div className="mb-2">
                            <span className="text-xs font-medium text-gray-500">Instruction:</span>
                            <div className="text-sm">{test.instruction}</div>
                          </div>
                          <div className="mb-2">
                            <span className="text-xs font-medium text-gray-500">Content:</span>
                            <div className="text-sm bg-gray-50 p-2 rounded">
                              {test.content.map((item) => (
                                <span key={item.id} className={item.isBlank ? "bg-blue-100 px-2 py-1 mx-1 rounded" : ""}>
                                  {item.isBlank ? `[______]` : item.text}
                                </span>
                              ))}
                              <div className="mt-2">
                                <span className="text-xs font-medium text-gray-500">Available options:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {test.options.map((option, i) => (
                                    <span key={i} className="bg-gray-100 px-2 py-1 rounded text-sm">{option}</span>
                                  ))}
                                </div>
                              </div>
                              <div className="mt-2">
                                <span className="text-xs font-medium text-gray-500">Correct answers:</span>
                                <div className="flex flex-col gap-1 mt-1">
                                  {test.content.filter(item => item.isBlank).map((item, i) => (
                                    <div key={i} className="flex items-center text-sm">
                                      <span className="font-medium">Blank {i+1}:</span>
                                      <span className="ml-2 bg-green-100 px-2 py-0.5 rounded">{test.correctAnswers[item.id]}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              dragAndDropTests: prev.dragAndDropTests?.filter((_, i) => i !== index) || []
                            }));
                          }}
                          className="ml-2 text-red-600 hover:text-red-800"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Add new drag and drop exercise form */}
                <div className="border rounded-md p-3 bg-gray-50">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Add Drag and Drop Exercise</h4>
                  
                  <div className="mb-3">
                    <label htmlFor="instruction" className="block text-xs font-medium text-gray-700 mb-1">
                      Instruction *
                    </label>
                    <input
                      type="text"
                      id="instruction"
                      value={newDragAndDropTest.instruction}
                      onChange={(e) => setNewDragAndDropTest(prev => ({ ...prev, instruction: e.target.value }))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Fill in the blanks with the correct JavaScript syntax"
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="content" className="block text-xs font-medium text-gray-700 mb-1">
                      Content Text * (Use [blank] to mark blanks, e.g., "The [blank] keyword creates a read-only variable.")
                    </label>
                    <textarea
                      id="content"
                      value={dragDropContent}
                      onChange={(e) => setDragDropContent(e.target.value)}
                      rows={3}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="The [blank] keyword creates a [blank] variable in JavaScript."
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Preview
                    </label>
                    <div className="bg-white p-2 border rounded-md">
                      {dragDropContent ? (
                        <div>
                          {dragDropContent.replace(/\[blank\]/g, '[______]')}
                        </div>
                      ) : (
                        <div className="text-gray-400 italic">
                          Preview will appear here...
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-medium text-gray-700">
                        Available Options *
                      </label>
                      <span className="text-xs text-gray-500">
                        {availableOptions.length} option(s) added
                      </span>
                    </div>
                    
                    {/* Options list */}
                    {availableOptions.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-1">
                        {availableOptions.map((option, idx) => (
                          <div key={idx} className="bg-blue-100 px-2 py-1 rounded flex items-center">
                            <span className="text-sm mr-1">{option}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setAvailableOptions(availableOptions.filter((_, i) => i !== idx));
                              }}
                              className="text-red-600 hover:text-red-800 h-4 w-4 flex items-center justify-center"
                            >
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Add option form */}
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={newOption}
                        onChange={(e) => setNewOption(e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter an option for students to drag"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newOption.trim()) return;
                          setAvailableOptions([...availableOptions, newOption.trim()]);
                          setNewOption('');
                        }}
                        className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        // Validate form
                        if (!newDragAndDropTest.instruction || !dragDropContent) {
                          setError('Instruction and content are required');
                          return;
                        }
                        
                        if (availableOptions.length < 1) {
                          setError('At least one option is required');
                          return;
                        }
                        
                        // Regular expression to match [blank] pattern
                        const blankRegex = /\[blank\]/g;
                        let match;
                        const items: DragAndDropItem[] = [];
                        let lastIndex = 0;
                        let content = dragDropContent;
                        let blankCounter = 0;
                        let blankCount = 0;
                        let blankIds: string[] = [];
                        
                        // Count blanks to validate
                        const matches = content.match(/\[blank\]/g);
                        if (!matches || matches.length === 0) {
                          setError('Content must include at least one [blank]');
                          return;
                        }
                        blankCount = matches.length;
                        
                        if (blankCount > availableOptions.length) {
                          setError(`You have ${blankCount} blanks but only ${availableOptions.length} options. Add more options.`);
                          return;
                        }
                        
                        while ((match = blankRegex.exec(content)) !== null) {
                          const fullMatch = match[0];
                          const startIndex = match.index;
                          
                          // Add text before the blank
                          if (startIndex > lastIndex) {
                            items.push({
                              id: `text-${items.length}`,
                              text: content.substring(lastIndex, startIndex),
                              isBlank: false
                            });
                          }
                          
                          // Add the blank
                          const blankId = `blank-${blankCounter}`;
                          items.push({
                            id: blankId,
                            text: '',
                            isBlank: true
                          });
                          
                          // Store blank ID for mapping correct answers later
                          blankIds.push(blankId);
                          
                          blankCounter++;
                          lastIndex = startIndex + fullMatch.length;
                        }
                        
                        // Add the remaining text after the last blank
                        if (lastIndex < content.length) {
                          items.push({
                            id: `text-${items.length}`,
                            text: content.substring(lastIndex),
                            isBlank: false
                          });
                        }
                        
                        // Show blank mapping dialog
                        setActiveBlankIds(blankIds);
                        setTempDragAndDropContent(items);
                        
                        // Initialize correct answer mapping dialog
                        setShowBlankMapping(true);
                      }}
                      className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Add Exercise
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Blank Mapping Dialog */}
            {showBlankMapping && (
              <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg w-full max-w-lg p-5">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Map Correct Answers to Blanks</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      For each blank, select the correct answer from the available options.
                    </p>
                  </div>
                  
                  {error && (
                    <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                      {error}
                    </div>
                  )}
                  
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {activeBlankIds.map((blankId, index) => (
                      <div key={blankId} className="p-3 border rounded bg-gray-50">
                        <div className="mb-2">
                          <span className="font-medium text-sm">Blank {index + 1}</span>
                        </div>
                        <div className="mb-2">
                          <div className="text-sm mb-1">
                            {/* Show the context by displaying surrounding content */}
                            {tempDragAndDropContent.map((item, idx) => {
                              // Find index of current blank
                              const currentBlankIndex = tempDragAndDropContent.findIndex(item => item.id === blankId);
                              
                              // Only show items close to the current blank (-1, current, +1)
                              if (idx >= currentBlankIndex - 1 && idx <= currentBlankIndex + 1) {
                                return (
                                  <span 
                                    key={item.id} 
                                    className={item.id === blankId ? "bg-blue-200 px-2 py-1 mx-1 rounded" : ""}
                                  >
                                    {item.isBlank ? (item.id === blankId ? "[THIS BLANK]" : "[______]") : item.text}
                                  </span>
                                );
                              }
                              return null;
                            })}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Correct Answer:
                          </label>
                          <select
                            value={blankMappings[blankId] || ''}
                            onChange={(e) => {
                              const selectedOption = e.target.value;
                              setBlankMappings(prev => ({
                                ...prev,
                                [blankId]: selectedOption
                              }));
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select the correct answer</option>
                            {availableOptions.map((option, idx) => (
                              <option key={idx} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-5 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowBlankMapping(false);
                        setActiveBlankIds([]);
                        setTempDragAndDropContent([]);
                        setBlankMappings({});
                      }}
                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleBlankMappingSubmit}
                      className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Save Exercise
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Multiple Choice Assessment Form */}
            {formData.assessmentType === 'multipleChoice' && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Multiple Choice Questions *
                  </label>
                  <span className="text-xs text-gray-500">
                    {formData.multipleChoiceQuestions?.length || 0} question(s) added
                  </span>
                </div>
                
                {/* Questions list */}
                {formData.multipleChoiceQuestions && formData.multipleChoiceQuestions.length > 0 && (
                  <div className="mb-4 border rounded-md divide-y">
                    {formData.multipleChoiceQuestions.map((question, index) => (
                      <div key={index} className="p-3 flex justify-between items-start">
                        <div className="flex-1">
                          <div className="mb-2">
                            <span className="text-xs font-medium text-gray-500">Question:</span>
                            <div className="text-sm font-medium">{question.question}</div>
                          </div>
                          <div className="mb-1">
                            <span className="text-xs font-medium text-gray-500">Options:</span>
                            <ul className="mt-1 ml-4 list-disc text-sm">
                              {question.options.map(option => (
                                <li key={option.id} className={option.id === question.correctOptionId ? "font-medium text-green-700" : ""}>
                                  {option.text} {option.id === question.correctOptionId && "✓"}
                                </li>
                              ))}
                            </ul>
                          </div>
                          {question.explanation && (
                            <div className="mt-1 text-xs text-gray-600">
                              <span className="font-medium">Explanation:</span> {question.explanation}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              multipleChoiceQuestions: prev.multipleChoiceQuestions?.filter((_, i) => i !== index) || []
                            }));
                          }}
                          className="ml-2 text-red-600 hover:text-red-800"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Add new question form */}
                <div className="border rounded-md p-3 bg-gray-50">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Add Multiple Choice Question</h4>
                  
                  <div className="mb-3">
                    <label htmlFor="question" className="block text-xs font-medium text-gray-700 mb-1">
                      Question *
                    </label>
                    <input
                      type="text"
                      id="question"
                      value={newMultipleChoiceQuestion.question}
                      onChange={(e) => setNewMultipleChoiceQuestion(prev => ({ ...prev, question: e.target.value }))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="What is the result of 2 + 2 in JavaScript?"
                    />
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-medium text-gray-700">
                        Options *
                      </label>
                      <span className="text-xs text-gray-500">
                        {newMultipleChoiceQuestion.options.length} option(s) added
                      </span>
                    </div>
                    
                    {/* Options list */}
                    {newMultipleChoiceQuestion.options.length > 0 && (
                      <div className="mb-2">
                        {newMultipleChoiceQuestion.options.map((option, idx) => (
                          <div key={option.id} className="flex items-center justify-between mb-1">
                            <div className="flex items-center">
                              <input
                                type="radio"
                                id={`option-${option.id}`}
                                name="correctOption"
                                checked={newMultipleChoiceQuestion.correctOptionId === option.id}
                                onChange={() => {
                                  setNewMultipleChoiceQuestion(prev => ({
                                    ...prev,
                                    correctOptionId: option.id
                                  }));
                                }}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                              />
                              <label htmlFor={`option-${option.id}`} className="ml-2 text-sm text-gray-700">
                                {option.text}
                              </label>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const updatedOptions = newMultipleChoiceQuestion.options.filter((_, i) => i !== idx);
                                let updatedCorrectId = newMultipleChoiceQuestion.correctOptionId;
                                if (option.id === newMultipleChoiceQuestion.correctOptionId) {
                                  updatedCorrectId = updatedOptions.length > 0 ? updatedOptions[0].id : '';
                                }
                                setNewMultipleChoiceQuestion(prev => ({
                                  ...prev,
                                  options: updatedOptions,
                                  correctOptionId: updatedCorrectId
                                }));
                              }}
                              className="text-red-600 hover:text-red-800"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Add option form */}
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={newMCOption}
                        onChange={(e) => setNewMCOption(e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter an option"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newMCOption.trim()) return;
                          
                          const newOption: MultipleChoiceOption = {
                            id: `option-${Date.now()}-${newMultipleChoiceQuestion.options.length}`,
                            text: newMCOption.trim()
                          };
                          
                          setNewMultipleChoiceQuestion(prev => {
                            const updatedOptions = [...prev.options, newOption];
                            return {
                              ...prev,
                              options: updatedOptions,
                              correctOptionId: prev.correctOptionId || newOption.id // Set as correct if it's the first option
                            };
                          });
                          
                          setNewMCOption('');
                        }}
                        className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="explanation" className="block text-xs font-medium text-gray-700 mb-1">
                      Explanation (Optional)
                    </label>
                    <textarea
                      id="explanation"
                      value={newMultipleChoiceQuestion.explanation || ''}
                      onChange={(e) => setNewMultipleChoiceQuestion(prev => ({ ...prev, explanation: e.target.value }))}
                      rows={2}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Explain why the answer is correct"
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (!newMultipleChoiceQuestion.question) {
                          setError('Question text is required');
                          return;
                        }
                        
                        if (newMultipleChoiceQuestion.options.length < 2) {
                          setError('At least 2 options are required');
                          return;
                        }
                        
                        if (!newMultipleChoiceQuestion.correctOptionId) {
                          setError('A correct answer must be selected');
                          return;
                        }
                        
                        // Add to form data
                        setFormData(prev => ({
                          ...prev,
                          multipleChoiceQuestions: [...(prev.multipleChoiceQuestions || []), { ...newMultipleChoiceQuestion }]
                        }));
                        
                        // Reset form
                        setNewMultipleChoiceQuestion({
                          question: '',
                          options: [],
                          correctOptionId: '',
                          explanation: ''
                        });
                        setError('');
                      }}
                      className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Add Question
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="isPublished"
                name="isPublished"
                checked={formData.isPublished}
                onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isPublished" className="ml-2 block text-sm text-gray-700">
                Publish lesson immediately (students will be able to see it)
              </label>
            </div>
          </div>
          
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Lesson'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
