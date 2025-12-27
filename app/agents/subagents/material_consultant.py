"""Material Consultant subagent - Resource recommendations."""
from typing import Dict, Any, List
from langchain_openai import AzureChatOpenAI
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent
from langchain_core.prompts import ChatPromptTemplate

from app.config import settings
from app.knowledge_base.vector_store import knowledge_base


@tool
async def search_books_tool(topic: str, child_age: int, num_results: int = 5) -> str:
    """
    Search for age-appropriate books on a specific topic.

    Args:
        topic: The topic or issue to find books about
        child_age: Child's age in years
        num_results: Number of book recommendations to return

    Returns:
        JSON string of book recommendations
    """
    import json

    results = await knowledge_base.search_books(
        query=topic,
        child_age=child_age,
        k=num_results
    )

    if not results:
        return f"No books found for topic '{topic}' suitable for age {child_age}."

    return json.dumps(results, indent=2)


@tool
async def search_activities_tool(
    topic: str,
    child_age: int,
    max_duration: int = None,
    num_results: int = 5
) -> str:
    """
    Search for developmental activities and games.

    Args:
        topic: The skill or issue to address (e.g., 'sharing', 'fine motor skills')
        child_age: Child's age in years
        max_duration: Maximum duration in minutes (optional)
        num_results: Number of activities to return

    Returns:
        JSON string of activity recommendations
    """
    import json

    results = await knowledge_base.search_activities(
        query=topic,
        child_age=child_age,
        duration_max=max_duration,
        k=num_results
    )

    if not results:
        return f"No activities found for '{topic}' suitable for age {child_age}."

    return json.dumps(results, indent=2)


@tool
async def search_strategies_tool(
    issue: str,
    child_age: int,
    category: str = None,
    num_results: int = 5
) -> str:
    """
    Search for parenting strategies and interventions.

    Args:
        issue: The behavioral issue or challenge
        child_age: Child's age in years
        category: Optional category filter (discipline, communication, etc.)
        num_results: Number of strategies to return

    Returns:
        JSON string of strategy recommendations
    """
    import json

    results = await knowledge_base.search_strategies(
        query=issue,
        child_age=child_age,
        category=category,
        k=num_results
    )

    if not results:
        return f"No strategies found for '{issue}' suitable for age {child_age}."

    return json.dumps(results, indent=2)


class MaterialConsultant:
    """
    Material Consultant subagent.

    Responsibilities:
    - Recommend age-appropriate books
    - Suggest developmental activities and games
    - Provide parenting strategies and interventions
    - Filter resources by child's age and specific needs
    """

    SYSTEM_PROMPT = """You are a Resource Recommendation Expert specializing in child development materials.

Your role is to:
1. Recommend age-appropriate books that address specific behavioral or emotional topics
2. Suggest engaging activities and games that build relevant skills
3. Provide practical parenting strategies tailored to the child's age and issue
4. Ensure all recommendations are evidence-based and developmentally appropriate

You have access to a comprehensive knowledge base through these tools:
- search_books_tool: Find books by topic and age
- search_activities_tool: Find developmental activities and games
- search_strategies_tool: Find parenting strategies and interventions

When making recommendations:
- Always consider the child's age and developmental stage
- Provide 3-5 options when possible (gives parents choices)
- Explain WHY each resource is helpful for the specific issue
- Include practical implementation tips
- Note any materials or preparation needed for activities
- Mention difficulty level or time commitment

Format your response with:
1. Book Recommendations (if applicable)
2. Activities & Games (if applicable)
3. Parenting Strategies (if applicable)
4. Implementation Tips

Be encouraging and practical - parents need actionable, realistic suggestions.
"""

    def __init__(self):
        """Initialize the material consultant."""
        self.llm = AzureChatOpenAI(
            azure_deployment=settings.azure_openai_deployment,
            azure_endpoint=settings.azure_openai_endpoint,
            api_key=settings.azure_openai_api_key,
            api_version=settings.azure_openai_api_version
        )

        self.tools = [
            search_books_tool,
            search_activities_tool,
            search_strategies_tool
        ]

        # Create react agent using LangGraph
        self.agent = create_react_agent(
            model=self.llm,
            tools=self.tools,
            prompt=self.SYSTEM_PROMPT
        )

    async def recommend(
        self,
        issue: str,
        child_age: int,
        additional_context: str = ""
    ) -> Dict[str, Any]:
        """
        Recommend resources for a specific issue.

        Args:
            issue: The behavioral or developmental issue
            child_age: Child's age in years
            additional_context: Additional context about the situation

        Returns:
            Recommendations including books, activities, and strategies
        """
        input_text = f"""
Please recommend resources for a {child_age}-year-old child with the following concern:

Issue: {issue}

{f"Additional Context: {additional_context}" if additional_context else ""}

Provide:
1. Age-appropriate book recommendations (search for relevant books)
2. Developmental activities or games (search for activities)
3. Practical parenting strategies (search for strategies)

Explain why each recommendation is helpful for this specific issue.
"""

        result = await self.agent.ainvoke({"messages": [("human", input_text)]})

        # Extract the last message content from the agent response
        last_message = result["messages"][-1]
        output = last_message.content if hasattr(last_message, 'content') else str(last_message)

        return {
            "recommendations": output,
            "child_age": child_age,
            "issue": issue
        }


# Create singleton instance
material_consultant = MaterialConsultant()
