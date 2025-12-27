import { StateGraph, END, START, Annotation } from '@langchain/langgraph';
import { MemorySaver } from '@langchain/langgraph';
import { geminiClient } from '../config/gemini.js';

const HomeworkHelperAnnotation = Annotation.Root({
  messages: Annotation<Array<{ role: string; content: string }>>({
    reducer: (x, y) => x.concat(y),
    default: () => []
  }),
  homeworkIssue: Annotation<string>({
    reducer: (x, y) => y,
    default: () => ''
  }),
  childAge: Annotation<number>({
    reducer: (x, y) => y,
    default: () => 6
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

type HomeworkHelperState = typeof HomeworkHelperAnnotation.State;

const identifyConflictNode = async (state: HomeworkHelperState) => {
  const lastMessage = state.messages[state.messages.length - 1]?.content || '';
  return { homeworkIssue: lastMessage.substring(0, 200) };
};

const suggestEngagementNode = async (state: HomeworkHelperState) => {
  const systemPrompt = state.language === 'tr'
    ? 'Sen ödev çatışmalarını çözmede uzman bir eğitim danışmanısın. Türkçe yanıt ver.'
    : 'You are an educational counselor specializing in homework conflicts. Respond in English.';

  const prompt = `${systemPrompt}

Homework conflict: "${state.homeworkIssue}"
Child's age: ${state.childAge}

Provide:
1. Strategy to reduce homework resistance
2. Tips to make it more engaging
3. Parent coping strategies (because homework battles are exhausting!)

Keep it practical and supportive (2-3 paragraphs).`;

  try {
    const response = await geminiClient.generateContent(prompt);
    return {
      response: response.trim(),
      messages: [{ role: 'assistant' as const, content: response.trim() }]
    };
  } catch (error) {
    const fallback = state.language === 'tr'
      ? 'Ödev mücadeleleri yaygındır. Kısa molalar verin, ödevi oyuna dönüştürün, ve unutmayın: mükemmel olması gerekmiyor.'
      : 'Homework battles are common. Try short breaks, gamify the work, and remember: it doesn\'t have to be perfect.';
    return {
      response: fallback,
      messages: [{ role: 'assistant' as const, content: fallback }]
    };
  }
};

export const createHomeworkHelperGraph = () => {
  const workflow = new StateGraph(HomeworkHelperAnnotation)
    .addNode('identify_conflict', identifyConflictNode)
    .addNode('suggest_engagement', suggestEngagementNode)
    .addEdge(START, 'identify_conflict')
    .addEdge('identify_conflict', 'suggest_engagement')
    .addEdge('suggest_engagement', END);

  const memory = new MemorySaver();
  return workflow.compile({ checkpointer: memory });
};
