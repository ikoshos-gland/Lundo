import { StateGraph, END, START, Annotation } from '@langchain/langgraph';
import { MemorySaver } from '@langchain/langgraph';
import { geminiClient } from '../config/gemini.js';

// Define the state annotation for Reality Checker
const RealityCheckerAnnotation = Annotation.Root({
  messages: Annotation<Array<{ role: string; content: string }>>({
    reducer: (x, y) => x.concat(y),
    default: () => []
  }),
  parentConcern: Annotation<string>({
    reducer: (x, y) => y,
    default: () => ''
  }),
  childAge: Annotation<number>({
    reducer: (x, y) => y,
    default: () => 6
  }),
  behavior: Annotation<string>({
    reducer: (x, y) => y,
    default: () => ''
  }),
  isDevelopmentallyNormal: Annotation<boolean>({
    reducer: (x, y) => y,
    default: () => false
  }),
  reframedPerspective: Annotation<string>({
    reducer: (x, y) => y,
    default: () => ''
  }),
  reassurance: Annotation<string>({
    reducer: (x, y) => y,
    default: () => ''
  }),
  language: Annotation<'en' | 'tr'>({
    reducer: (x, y) => y,
    default: () => 'en'
  })
});

type RealityCheckerState = typeof RealityCheckerAnnotation.State;

// Node: Analyze Input
const analyzeInputNode = async (state: RealityCheckerState) => {
  const lastMessage = state.messages[state.messages.length - 1]?.content || '';

  const prompt = `You are a parenting expert analyzing a parent's concern.

Parent's message: "${lastMessage}"
Child's age: ${state.childAge} years old
Language: ${state.language}

Extract the following:
1. The main parenting concern (one sentence)
2. The specific child behavior mentioned

Respond ONLY with valid JSON in this exact format:
{
  "concern": "brief description of the concern",
  "behavior": "specific behavior mentioned"
}`;

  try {
    const response = await geminiClient.generateContent(prompt);
    const cleanResponse = response.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
    const analysis = JSON.parse(cleanResponse);

    return {
      parentConcern: analysis.concern || 'General parenting concern',
      behavior: analysis.behavior || 'General behavior'
    };
  } catch (error) {
    console.error('Error in analyzeInputNode:', error);
    return {
      parentConcern: lastMessage.substring(0, 100),
      behavior: 'General behavior'
    };
  }
};

// Node: Check Developmental Norms
const checkDevelopmentalNormsNode = async (state: RealityCheckerState) => {
  const prompt = `You are a child development expert.

Is this behavior developmentally normal for a ${state.childAge}-year-old child?
Behavior: ${state.behavior}
Concern: ${state.parentConcern}

Respond ONLY with valid JSON in this exact format:
{
  "isNormal": true,
  "explanation": "brief explanation"
}`;

  try {
    const response = await geminiClient.generateContent(prompt);
    const cleanResponse = response.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
    const check = JSON.parse(cleanResponse);

    return {
      isDevelopmentallyNormal: check.isNormal || false
    };
  } catch (error) {
    console.error('Error in checkDevelopmentalNormsNode:', error);
    return {
      isDevelopmentallyNormal: true
    };
  }
};

// Node: Reframe Perspective
const reframePerspectiveNode = async (state: RealityCheckerState) => {
  const systemPrompt = state.language === 'tr'
    ? 'Sen empatik bir ebeveynlik danışmanısın. Türkçe yanıt ver.'
    : 'You are an empathetic parenting counselor. Respond in English.';

  const prompt = `${systemPrompt}

Parent's concern: ${state.parentConcern}
Is developmentally normal: ${state.isDevelopmentallyNormal ? 'Yes' : 'No'}
Child's age: ${state.childAge}

Create a compassionate reframe that:
1. Validates the parent's feelings
2. Normalizes the behavior if appropriate
3. Offers a helpful perspective shift

Keep it to 2-3 sentences. Be warm and supportive.

Respond with just the reframe text (no JSON, no extra formatting).`;

  try {
    const reframe = await geminiClient.generateContent(prompt);
    return {
      reframedPerspective: reframe.trim()
    };
  } catch (error) {
    console.error('Error in reframePerspectiveNode:', error);
    const fallback = state.language === 'tr'
      ? 'Bu davranış yaşına uygun. Sen iyi bir ebeveynsin.'
      : 'This behavior is age-appropriate. You are doing great as a parent.';
    return {
      reframedPerspective: fallback
    };
  }
};

// Node: Generate Response
const generateResponseNode = async (state: RealityCheckerState) => {
  const systemPrompt = state.language === 'tr'
    ? 'Sen sıcak, destekleyici bir ebeveynlik asistanısın. Türkçe yanıt ver.'
    : 'You are a warm, supportive parenting assistant. Respond in English.';

  const prompt = `${systemPrompt}

Based on this reframed perspective: "${state.reframedPerspective}"

Generate a supportive, empathetic response to the parent that:
1. Acknowledges their concern
2. Provides reassurance
3. Offers 1-2 practical next steps

Keep it warm and conversational (2-3 short paragraphs).
Do not use JSON formatting - just respond naturally.`;

  try {
    const response = await geminiClient.generateContent(prompt);
    const finalResponse = response.trim();

    return {
      reassurance: finalResponse,
      messages: [{ role: 'assistant' as const, content: finalResponse }]
    };
  } catch (error) {
    console.error('Error in generateResponseNode:', error);
    const fallback = state.language === 'tr'
      ? 'Anlıyorum, bu zor bir durum. Ancak unutmayın, mükemmel ebeveyn olmaya çalışmak yerine "yeterince iyi" ebeveyn olmak yeterli. Bugün elinizden gelenin en iyisini yapıyorsunuz.'
      : 'I understand this is challenging. Remember, you don\'t need to be a perfect parent - being "good enough" is truly enough. You\'re doing the best you can today.';

    return {
      reassurance: fallback,
      messages: [{ role: 'assistant' as const, content: fallback }]
    };
  }
};

// Create the graph
export const createRealityCheckerGraph = () => {
  const workflow = new StateGraph(RealityCheckerAnnotation)
    .addNode('analyze_input', analyzeInputNode)
    .addNode('check_norms', checkDevelopmentalNormsNode)
    .addNode('reframe', reframePerspectiveNode)
    .addNode('respond', generateResponseNode)
    .addEdge(START, 'analyze_input')
    .addEdge('analyze_input', 'check_norms')
    .addEdge('check_norms', 'reframe')
    .addEdge('reframe', 'respond')
    .addEdge('respond', END);

  const memory = new MemorySaver();
  return workflow.compile({ checkpointer: memory });
};
