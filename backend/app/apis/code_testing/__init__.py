from pydantic import BaseModel
from fastapi import APIRouter
from typing import List, Dict, Any, Optional
import json
import execjs

router = APIRouter()

class TestCase(BaseModel):
    input: str
    expectedOutput: str
    description: Optional[str] = None

class CodeTestRequest(BaseModel):
    code: str
    language: str
    testCases: List[TestCase]

class TestResult(BaseModel):
    passed: bool
    expected: str
    actual: str
    error: Optional[str] = None
    input: Optional[str] = None

class CodeTestResponse(BaseModel):
    results: List[TestResult]
    score: float  # Percentage of tests passed
    totalTests: int
    passedTests: int

@router.post("/test-javascript-code")
def test_javascript_code(request: CodeTestRequest) -> CodeTestResponse:
    """Test JavaScript code against provided test cases."""
    
    if request.language.lower() != "javascript":
        # For MVP, we only support JavaScript
        return CodeTestResponse(
            results=[TestResult(
                passed=False,
                expected="",
                actual="",
                error=f"Language '{request.language}' is not supported. Only JavaScript is supported in this MVP."
            )],
            score=0.0,
            totalTests=1,
            passedTests=0
        )
    
    results = []
    passed_count = 0
    
    # Wrap the code in a safe execution environment
    wrapped_code = f"""
    (function() {{
        try {{
            {request.code}
            
            // Test with the provided input
            const result = JSON.stringify(eval(input));
            return {{success: true, result}};
        }} catch (error) {{
            return {{success: false, error: error.toString()}};
        }}
    }})()
    """
    
    for test_case in request.testCases:
        try:
            # Create a JavaScript execution context with the input from the test case
            js_context = f"const input = {json.dumps(test_case.input)};"
            
            # Execute the code with the provided input
            execution_context = js_context + wrapped_code
            ctx = execjs.compile('')  # Create a new context
            execution_result = ctx.eval(execution_context)
            
            # Parse the result
            result_dict = json.loads(execution_result)
            
            if result_dict.get("success", False):
                actual_output = result_dict.get("result", "")
                # Remove quotes if the result is a string (JSON.stringify adds them)
                if actual_output.startswith('"') and actual_output.endswith('"'):
                    actual_output = actual_output[1:-1]
                
                # Compare with expected output
                passed = actual_output == test_case.expectedOutput
                
                results.append(TestResult(
                    passed=passed,
                    expected=test_case.expectedOutput,
                    actual=actual_output,
                    input=test_case.input
                ))
                
                if passed:
                    passed_count += 1
            else:
                results.append(TestResult(
                    passed=False,
                    expected=test_case.expectedOutput,
                    actual="",
                    error=result_dict.get("error", "Unknown error"),
                    input=test_case.input
                ))
        except Exception as e:
            results.append(TestResult(
                passed=False,
                expected=test_case.expectedOutput,
                actual="",
                error=f"Server error: {str(e)}",
                input=test_case.input
            ))
    
    total_tests = len(request.testCases)
    score = (passed_count / total_tests) * 100 if total_tests > 0 else 0
    
    return CodeTestResponse(
        results=results,
        score=score,
        totalTests=total_tests,
        passedTests=passed_count
    )
