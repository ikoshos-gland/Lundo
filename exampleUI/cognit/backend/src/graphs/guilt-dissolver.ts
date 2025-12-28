import { StateGraph, END, START, Annotation } from '@langchain/langgraph';
import { MemorySaver } from '@langchain/langgraph';
import { geminiClient } from '../config/gemini.js';

const GuiltDissolverAnnotation = Annotation.Root({
  messages: Annotation<Array<{ role: string; content: string }>>({
    reducer: (x, y) => x.concat(y),
    default: () => []
  }),
  guiltIndicators: Annotation<string[]>({
    reducer: (x, y) => y,
    default: () => []
  }),
  reframedThoughts: Annotation<string[]>({
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

type GuiltDissolverState = typeof GuiltDissolverAnnotation.State;

const detectGuiltNode = async (state: GuiltDissolverState) => {
  const lastMessage = state.messages[state.messages.length - 1]?.content || '';
  // Simple guilt detection (can be enhanced later)
  const guiltWords = ['guilty', 'bad parent', 'failing', 'should have', 'terrible', 'awful'];
  const indicators = guiltWords.filter(word => lastMessage.toLowerCase().includes(word));
  return { guiltIndicators: indicators };
};

const reframeThoughtsNode = async (state: GuiltDissolverState) => {
  const lastMessage = state.messages[state.messages.length - 1]?.content || '';

  const systemPrompt = state.language === 'tr'
    ? 'Sen ebeveyn suçluluk duygularını çözen empatik bir danışmansın. Türkçe yanıt ver.'
    : 'You are an empathetic counselor who dissolves parental guilt. Respond in English.';

  const prompt = `${systemPrompt}

Parent's message: "${lastMessage}"

Provide compassionate cognitive reframing that:
1. Validates their feelings
2. Challenges negative self-talk
3. Reminds them "good enough" is enough
4. Offers self-compassion

Keep it warm, brief (2-3 paragraphs), and empowering.`;

  try {
    const response = await geminiClient.generateContent(prompt);
    return {
      response: response.trim(),
      messages: [{ role: 'assistant' as const, content: response.trim() }]
    };
  } catch (error) {
    const fallback = state.language === 'tr'
      ? 'Kendinize karşı nazik olun. Mükemmel ebeveyn yoktur, sadece elinden gelenin en iyisini yapan ebeveynler vardır. Bugün yaptıklarınız yeterli.'
      : 'Be kind to yourself. There are no perfect parents, only parents doing their best. What you\'re doing today is enough.';
    return {
      response: fallback,
      messages: [{ role: 'assistant' as const, content: fallback }]
    };
  }
};

export const createGuiltDissolverGraph = () => {
  const workflow = new StateGraph(GuiltDissolverAnnotation)
    .addNode('detect_guilt', detectGuiltNode)
    .addNode('reframe_thoughts', reframeThoughtsNode)
    .addEdge(START, 'detect_guilt')
    .addEdge('detect_guilt', 'reframe_thoughts')
    .addEdge('reframe_thoughts', END);

  const memory = new MemorySaver();
  return workflow.compile({ checkpointer: memory });
};
