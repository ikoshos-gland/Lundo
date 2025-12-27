import { StateGraph, END, START, Annotation } from '@langchain/langgraph';
import { MemorySaver } from '@langchain/langgraph';
import { geminiClient } from '../config/gemini.js';

const RoutineArchitectAnnotation = Annotation.Root({
  messages: Annotation<Array<{ role: string; content: string }>>({
    reducer: (x, y) => x.concat(y),
    default: () => []
  }),
  scenario: Annotation<string>({
    reducer: (x, y) => y,
    default: () => ''
  }),
  timeAvailable: Annotation<number>({
    reducer: (x, y) => y,
    default: () => 30
  }),
  actionPlan: Annotation<string[]>({
    reducer: (x, y) => y,
    default: () => []
  }),
  response: Annotation<string>({
    reducer: (x, y) => y,
    default: () => ''
  }),
  language: Annotation<'en' | 'tr'>({
    reducer: (x, y) => y,
    default: () => 'en'
  })
});

type RoutineArchitectState = typeof RoutineArchitectAnnotation.State;

const analyzeSituationNode = async (state: RoutineArchitectState) => {
  const lastMessage = state.messages[state.messages.length - 1]?.content || '';

  const prompt = `You are an efficiency expert for busy parents.

Parent's situation: "${lastMessage}"

Extract the scenario they need help with.

Respond ONLY with valid JSON:
{
  "scenario": "brief description of what they need to accomplish"
}`;

  try {
    const response = await geminiClient.generateContent(prompt);
    const cleanResponse = response.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
    const analysis = JSON.parse(cleanResponse);
    return { scenario: analysis.scenario || lastMessage.substring(0, 100) };
  } catch (error) {
    return { scenario: lastMessage.substring(0, 100) };
  }
};

const buildRoutineNode = async (state: RoutineArchitectState) => {
  const systemPrompt = state.language === 'tr'
    ? 'Sen verimli ebeveynlik rutinleri oluşturan bir uzmansın. Türkçe yanıt ver.'
    : 'You are an expert at creating efficient parenting routines. Respond in English.';

  const prompt = `${systemPrompt}

Scenario: ${state.scenario}
Time available: ${state.timeAvailable} minutes

Create a step-by-step action plan that:
1. Is realistic and efficient
2. Focuses on "good enough" not perfect
3. Has 3-5 concrete steps

Format as a warm, supportive response with numbered steps.`;

  try {
    const response = await geminiClient.generateContent(prompt);
    return {
      response: response.trim(),
      messages: [{ role: 'assistant' as const, content: response.trim() }]
    };
  } catch (error) {
    const fallback = state.language === 'tr'
      ? 'İşte pratik bir yaklaşım: Mükemmellik yerine "yeterince iyi"yi hedefleyin. Her adımı küçük parçalara bölün.'
      : 'Here\'s a practical approach: Aim for "good enough" instead of perfect. Break each step into smaller chunks.';
    return {
      response: fallback,
      messages: [{ role: 'assistant' as const, content: fallback }]
    };
  }
};

export const createRoutineArchitectGraph = () => {
  const workflow = new StateGraph(RoutineArchitectAnnotation)
    .addNode('analyze_situation', analyzeSituationNode)
    .addNode('build_routine', buildRoutineNode)
    .addEdge(START, 'analyze_situation')
    .addEdge('analyze_situation', 'build_routine')
    .addEdge('build_routine', END);

  const memory = new MemorySaver();
  return workflow.compile({ checkpointer: memory });
};
