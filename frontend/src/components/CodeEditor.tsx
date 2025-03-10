import React, { useState, useEffect } from 'react';
import { TestCase } from '../utils/lessonModel';
import brain from 'brain';

interface Props {
  initialCode: string;
  language: string;
  testCases: TestCase[];
  onRunCode: (code: string) => void;
  onSaveCode?: (code: string) => void;
}

interface TestResult {
  passed: boolean;
  expected: string;
  actual: string;
  error?: string;
  input?: string;
}

export function CodeEditor({ initialCode, language, testCases, onRunCode, onSaveCode }: Props) {
  const [code, setCode] = useState(initialCode);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [highlightedCode, setHighlightedCode] = useState<string>('');
  
  // Basic syntax highlighting for MVP
  useEffect(() => {
    // This is a simple implementation for MVP - a real app would use a proper syntax highlighting library
    let result = code;
    
    if (language === 'javascript' || language === 'typescript' || language === 'python') {
      // Highlight keywords
      const keywords = language === 'python' 
        ? ['def', 'class', 'import', 'from', 'return', 'if', 'elif', 'else', 'for', 'while', 'try', 'except', 'with', 'as', 'True', 'False', 'None']
        : ['function', 'const', 'let', 'var', 'return', 'if', 'else', 'for', 'while', 'try', 'catch', 'class', 'import', 'export', 'true', 'false', 'null', 'undefined'];
      
      // Replace keywords with spans
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g');
        result = result.replace(regex, `<span class="text-blue-600">${keyword}</span>`);
      });
      
      // Highlight strings
      result = result.replace(/(["'])(?:\\.|[^\\\1])*?\1/g, '<span class="text-green-600">$&</span>');
      
      // Highlight comments
      if (language === 'python') {
        result = result.replace(/(#.*)$/gm, '<span class="text-gray-500">$1</span>');
      } else {
        result = result.replace(/(\/\/.*|\/\*[\s\S]*?\*\/)/g, '<span class="text-gray-500">$1</span>');
      }
      
      // Highlight numbers
      result = result.replace(/\b(\d+)\b/g, '<span class="text-purple-600">$1</span>');
    }
    
    setHighlightedCode(result);
  }, [code, language]);
  
  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value);
  };
  
  const handleRunCode = async () => {
    // Execute the code against the test cases using our API
    setIsRunning(true);
    setTestResults([]);
    
    try {
      // Call the provided onRunCode function
      onRunCode(code);
      
      // Call the API to test the code against the test cases
      const response = await brain.test_javascript_code({
        code,
        language,
        testCases
      });
      
      const data = await response.json();
      
      // Update test results from API response
      setTestResults(data.results);
      
      // If all tests pass, show success message
      if (data.passedTests === data.totalTests && data.totalTests > 0) {
        console.log(`All tests passed! Score: ${data.score}%`);
      }
      
      setIsRunning(false);
    } catch (error) {
      console.error('Error running code:', error);
      setTestResults([{
        passed: false,
        expected: '',
        actual: '',
        error: 'An error occurred while running your code.'
      }]);
      setIsRunning(false);
    }
  };
  
  const handleSaveCode = () => {
    onSaveCode && onSaveCode(code);
  };
  
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Language: {language}</span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className={`px-3 py-1 text-sm font-medium rounded-md ${isRunning 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-green-600 text-white hover:bg-green-700'}`}
          >
            {isRunning ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Running...
              </>
            ) : 'Run Code'}
          </button>
          {onSaveCode && (
            <button
              onClick={handleSaveCode}
              className="px-3 py-1 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save Code
            </button>
          )}
        </div>
      </div>
      
      <div className="relative">
        <textarea
          value={code}
          onChange={handleCodeChange}
          className="w-full h-60 p-4 font-mono text-sm bg-gray-50 focus:outline-none text-transparent caret-black z-10 absolute top-0 left-0 whitespace-pre resize-none"
          placeholder="Write your code here..."
        />
        <pre className="w-full h-60 p-4 font-mono text-sm bg-gray-50 overflow-auto whitespace-pre pointer-events-none">
          <code dangerouslySetInnerHTML={{ __html: highlightedCode || code }} />
        </pre>
      </div>
      
      {testResults.length > 0 && (
        <div className="bg-gray-50 border-t border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Test Results:</h3>
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div 
                key={index} 
                className={`p-3 border rounded-md ${
                  result.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center">
                  {result.passed ? (
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <span className={`text-sm font-medium ${
                    result.passed ? 'text-green-700' : 'text-red-700'
                  }`}>
                    Test Case {index + 1}: {result.passed ? 'Passed' : 'Failed'}
                  </span>
                </div>
                
                {!result.passed && (
                  <div className="mt-2 text-sm text-gray-600 space-y-1">
                    {result.input && (
                      <div><span className="font-medium">Input:</span> {result.input}</div>
                    )}
                    <div><span className="font-medium">Expected:</span> {result.expected}</div>
                    <div><span className="font-medium">Actual:</span> {result.actual}</div>
                    {result.error && (
                      <div className="text-red-600"><span className="font-medium">Error:</span> {result.error}</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
