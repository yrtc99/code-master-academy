from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from openai import OpenAI
import databutton as db
from typing import List, Dict, Any, Optional

# Initialize the router
router = APIRouter()

# Initialize OpenAI client
client = OpenAI(api_key=db.secrets.get("OPENAI_API_KEY"))

class FeedbackRequest(BaseModel):
    studentName: str
    averageScore: int
    completionRate: int
    strengths: List[str]
    areasForImprovement: List[str]
    programmingLanguages: List[str]
    difficultyLevels: List[str]
    totalLessonsCompleted: int
    totalLessonsAssigned: int
    recentSubmissions: Optional[List[Dict[str, Any]]] = None

class FeedbackResponse(BaseModel):
    personalizedFeedback: str
    improvementPlan: List[str]
    conceptRecommendations: List[Dict[str, str]]
    practiceExercises: List[str]
    motivationalMessage: str

@router.post("/generate-feedback")
def generate_feedback(request: FeedbackRequest) -> FeedbackResponse:
    """
    Generate personalized feedback for a student based on their performance data.
    """
    try:
        # Construct a prompt for the OpenAI API
        prompt = construct_feedback_prompt(request)
        
        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # Using a compact model for efficiency
            messages=[
                {"role": "system", "content": "You are a helpful programming tutor and mentor who provides personalized feedback to programming students. Your feedback should be encouraging, specific, and actionable. Focus on both strengths and areas of improvement."},
                {"role": "user", "content": prompt}
            ]
        )
        
        # Extract and structure the response
        ai_response = response.choices[0].message.content
        structured_feedback = parse_ai_response(ai_response, request)
        
        return structured_feedback
        
    except Exception as e:
        print(f"Error generating feedback: {str(e)}")
        # Provide a graceful fallback response
        return generate_fallback_feedback(request)

def construct_feedback_prompt(request: FeedbackRequest) -> str:
    """
    Create a detailed prompt for the LLM based on student data.
    """
    prompt = f"""Generate personalized programming learning feedback for a student with the following performance data:

Student: {request.studentName}
Average Score: {request.averageScore}%
Completion Rate: {request.completionRate}%
Lessons Completed: {request.totalLessonsCompleted} out of {request.totalLessonsAssigned}

Programming Languages: {', '.join(request.programmingLanguages)}
Difficulty Levels: {', '.join(request.difficultyLevels)}

Identified Strengths:
{bullet_list(request.strengths)}

Areas for Improvement:
{bullet_list(request.areasForImprovement)}

"""
    
    # Add recent submissions context if available
    if request.recentSubmissions and len(request.recentSubmissions) > 0:
        prompt += "Recent code submissions:\n"
        for submission in request.recentSubmissions:
            prompt += f"Exercise: {submission.get('title', 'Unknown')}\n"
            prompt += f"Score: {submission.get('score', 0)}%\n"
            prompt += f"Code:\n```\n{submission.get('code', 'No code available')}\n```\n\n"
    
    prompt += """
Provide a detailed response with the following sections:
1. Personalized Feedback: A paragraph addressing the student by name with personalized observations about their performance
2. Improvement Plan: 3-5 specific action items to help them improve
3. Concept Recommendations: 2-3 programming concepts they should study with brief explanations of why
4. Practice Exercises: 2-3 suggested exercises tailored to their needs
5. Motivational Message: An encouraging message to keep them motivated

Do not use generic advice - tailor everything to their specific performance data."""
    
    return prompt

def bullet_list(items: List[str]) -> str:
    """
    Format a list of items as a bullet point list.
    """
    if not items:
        return "None identified yet."
    return "\n".join([f"- {item}" for item in items])

def parse_ai_response(ai_response: str, request: FeedbackRequest) -> FeedbackResponse:
    """
    Parse the AI response into structured feedback.
    Uses simple section-based parsing.
    """
    # Default values
    personalized_feedback = ""
    improvement_plan = []
    concept_recommendations = []
    practice_exercises = []
    motivational_message = ""
    
    # Split response by sections and parse
    sections = ai_response.split("\n\n")
    
    current_section = ""
    for section in sections:
        if "Personalized Feedback" in section or "feedback" in section.lower():
            current_section = "feedback"
            personalized_feedback = section.split(":\n", 1)[-1] if ":\n" in section else section
        elif "Improvement Plan" in section or "plan" in section.lower():
            current_section = "plan"
            plan_text = section.split(":\n", 1)[-1] if ":\n" in section else section
            improvement_plan = [item.strip().lstrip("-").strip() for item in plan_text.split("\n") if item.strip()]
        elif "Concept Recommendations" in section or "concept" in section.lower():
            current_section = "concepts"
            concepts_text = section.split(":\n", 1)[-1] if ":\n" in section else section
            for line in concepts_text.split("\n"):
                if line.strip() and "-" in line:
                    concept_part = line.strip().lstrip("-").strip()
                    concept_parts = concept_part.split(":", 1)
                    if len(concept_parts) > 1:
                        name, description = concept_parts
                        concept_recommendations.append({"name": name.strip(), "description": description.strip()})
                    else:
                        concept_recommendations.append({"name": concept_part, "description": ""})
        elif "Practice Exercises" in section or "exercise" in section.lower():
            current_section = "exercises"
            exercises_text = section.split(":\n", 1)[-1] if ":\n" in section else section
            practice_exercises = [item.strip().lstrip("-").strip() for item in exercises_text.split("\n") if item.strip()]
        elif "Motivational Message" in section or "motivation" in section.lower():
            current_section = "motivation"
            motivational_message = section.split(":\n", 1)[-1] if ":\n" in section else section
        elif current_section:  # Continue with previous section if no new section identified
            if current_section == "feedback":
                personalized_feedback += "\n" + section
            elif current_section == "plan":
                plan_items = [item.strip().lstrip("-").strip() for item in section.split("\n") if item.strip()]
                improvement_plan.extend(plan_items)
            elif current_section == "concepts":
                for line in section.split("\n"):
                    if line.strip() and "-" in line:
                        concept_part = line.strip().lstrip("-").strip()
                        concept_parts = concept_part.split(":", 1)
                        if len(concept_parts) > 1:
                            name, description = concept_parts
                            concept_recommendations.append({"name": name.strip(), "description": description.strip()})
                        else:
                            concept_recommendations.append({"name": concept_part, "description": ""})
            elif current_section == "exercises":
                exercises = [item.strip().lstrip("-").strip() for item in section.split("\n") if item.strip()]
                practice_exercises.extend(exercises)
            elif current_section == "motivation":
                motivational_message += "\n" + section

    # Make sure we have the minimum structure
    if not personalized_feedback:
        personalized_feedback = f"Great work on your progress, {request.studentName}! Keep up the good work."
        
    if not improvement_plan:
        improvement_plan = ["Continue practicing with more exercises", "Review fundamental concepts", "Try more challenging problems"]
        
    if not concept_recommendations:
        for lang in request.programmingLanguages[:2]:  # Use up to 2 languages
            concept_recommendations.append({
                "name": f"Advanced {lang} concepts", 
                "description": f"Deepen your understanding of {lang} with more complex exercises."
            })
            
    if not practice_exercises:
        practice_exercises = ["Solve algorithm challenges", "Build a small project", "Practice debugging code"]
        
    if not motivational_message:
        motivational_message = "Remember, every programmer was once a beginner. Keep coding and you'll see improvement!"
        
    return FeedbackResponse(
        personalizedFeedback=personalized_feedback,
        improvementPlan=improvement_plan[:5],  # Limit to 5 items
        conceptRecommendations=concept_recommendations[:3],  # Limit to 3 items
        practiceExercises=practice_exercises[:3],  # Limit to 3 items
        motivationalMessage=motivational_message
    )

def generate_fallback_feedback(request: FeedbackRequest) -> FeedbackResponse:
    """
    Generate fallback feedback when API call fails.
    """
    # Basic feedback based on completion rate and score
    if request.averageScore >= 85:
        feedback = f"Excellent work, {request.studentName}! You're showing a strong understanding of programming concepts."
        motivation = "You're on a great path - keep challenging yourself with more complex problems!"
    elif request.averageScore >= 70:
        feedback = f"Good progress, {request.studentName}! You've demonstrated solid programming skills so far."
        motivation = "With continued practice, you'll master these concepts in no time!"
    else:
        feedback = f"You're making progress, {request.studentName}! Programming takes time to master, so don't get discouraged."
        motivation = "Remember that every programmer started somewhere. Keep practicing and you'll see improvement!"
    
    # Generate improvement plan based on completion rate
    improvement_plan = []
    if request.completionRate < 50:
        improvement_plan.append("Set aside dedicated time each day to complete lessons")
    if request.averageScore < 70:
        improvement_plan.append("Review fundamental concepts in your programming languages")
    improvement_plan.append("Practice coding exercises regularly to build muscle memory")
    if request.areasForImprovement:
        improvement_plan.append(f"Focus on your identified area: {request.areasForImprovement[0]}")
    improvement_plan.append("Work through programming challenges on coding websites")
    
    # Generate concept recommendations
    concept_recommendations = []
    for lang in request.programmingLanguages[:2]:  # Use up to 2 languages
        concept_recommendations.append({
            "name": f"{lang} fundamentals", 
            "description": f"Ensure you have a solid foundation in {lang} basics."
        })
    concept_recommendations.append({
        "name": "Problem-solving techniques", 
        "description": "Develop strategies for breaking down complex programming problems."
    })
    
    # Generate practice exercises
    practice_exercises = [
        "Create a small project that solves a real problem you're interested in",
        "Reimplement a previous exercise with a different approach",
        "Solve algorithm challenges on programming practice websites"
    ]
    
    return FeedbackResponse(
        personalizedFeedback=feedback,
        improvementPlan=improvement_plan,
        conceptRecommendations=concept_recommendations,
        practiceExercises=practice_exercises,
        motivationalMessage=motivation
    )
