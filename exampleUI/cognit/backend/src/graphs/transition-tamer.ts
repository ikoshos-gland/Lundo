import { StateGraph, END, START, Annotation } from '@langchain/langgraph';
import { MemorySaver } from '@langchain/langgraph';
import { geminiClient } from '../config/gemini.js';

const TransitionTamerAnnotation = Annotation.Root({
  messages: Annotation<Array<{ role: string; content: string }>>({
    reducer: (x, y) => x.concat(y),
    default: () => []
  }),
  transitionType: Annotation<string>({
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

type TransitionTamerState = typeof TransitionTamerAnnotation.State;

const identifyTransitionNode = async (state: TransitionTamerState) => {
  const lastMessage = state.messages[state.messages.length - 1]?.content || '';
  return { transitionType: lastMessage.substring(0, 200) };
};

const createTransitionStrategyNode = async (state: TransitionTamerState) => {
  const systemPrompt = state.language === 'tr'
    ? 'Sen geçiş anlarını yönetmede uzman bir ebeveynlik danışmanısın. Türkçe yanıt ver.'
    : 'You are a parenting counselor specializing in transitions. Respond in English.';

  const prompt = `${systemPrompt}

Transition challenge: "${state.transitionType}"
Child's age: ${state.childAge}

Provide:
1. Buffer strategy (to ease the transition)
2. Simple transition ritual they can use
3. Parent self-care tip (switching modes is hard for YOU too!)

Keep it practical and empathetic (2-3 paragraphs).`;

  try {
    const response = await geminiClient.generateContent(prompt);
    return {
      response: response.trim(),
      messages: [{ role: 'assistant' as const, content: response.trim() }]
    };
  } catch (error) {
    const fallback = state.language === 'tr'
      ? 'Geçişler zordur. 5 dakikalık "tampon" zaman ekleyin, basit bir ritüel oluşturun (şarkı, sayma, vb.), ve kendinize de geçiş için zaman tanıyın.'
      : 'Transitions are tough. Add a 5-minute "buffer", create a simple ritual (song, counting, etc.), and give yourself transition time too.';
    return {
      response: fallback,
      messages: [{ role: 'assistant' as const, content: fallback }]
    };
  }
};

export const createTransitionTamerGraph = () => {
  const workflow = new StateGraph(TransitionTamerAnnotation)
    .addNode('identify_transition', identifyTransitionNode)
    .addNode('create_strategy', createTransitionStrategyNode)
    .addEdge(START, 'identify_transition')
    .addEdge('identify_transition', 'create_strategy')
    .addEdge('create_strategy', END);

  const memory = new MemorySaver();
  return workflow.compile({ checkpointer: memory });
};
