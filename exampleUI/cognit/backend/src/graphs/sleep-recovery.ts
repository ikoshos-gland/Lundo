import { StateGraph, END, START, Annotation } from '@langchain/langgraph';
import { MemorySaver } from '@langchain/langgraph';
import { geminiClient } from '../config/gemini.js';

const SleepRecoveryAnnotation = Annotation.Root({
  messages: Annotation<Array<{ role: string; content: string }>>({
    reducer: (x, y) => x.concat(y),
    default: () => []
  }),
  sleepIssue: Annotation<string>({
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

type SleepRecoveryState = typeof SleepRecoveryAnnotation.State;

const assessSleepIssueNode = async (state: SleepRecoveryState) => {
  const lastMessage = state.messages[state.messages.length - 1]?.content || '';
  return { sleepIssue: lastMessage.substring(0, 200) };
};

const provideSleepStrategiesNode = async (state: SleepRecoveryState) => {
  const systemPrompt = state.language === 'tr'
    ? 'Sen uyku konusunda uzmanlaşmış bir çocuk gelişimi danışmanısın. Türkçe yanıt ver.'
    : 'You are a child development counselor specializing in sleep. Respond in English.';

  const prompt = `${systemPrompt}

Sleep issue: "${state.sleepIssue}"
Child's age: ${state.childAge}

Provide:
1. Quick win for TONIGHT (immediate tactic)
2. Sustainable long-term approach
3. Reassurance that this is manageable

Keep it practical and empathetic (2-3 paragraphs).`;

  try {
    const response = await geminiClient.generateContent(prompt);
    return {
      response: response.trim(),
      messages: [{ role: 'assistant' as const, content: response.trim() }]
    };
  } catch (error) {
    const fallback = state.language === 'tr'
      ? 'Uyku sorunları geçicidir. Bu gece için: tutarlı bir yatma rutini oluşturun. Uzun vadede: aynı saatte yatırma alışkanlığı kazandırın.'
      : 'Sleep issues are temporary. For tonight: establish a consistent bedtime routine. Long-term: stick to the same bedtime every night.';
    return {
      response: fallback,
      messages: [{ role: 'assistant' as const, content: fallback }]
    };
  }
};

export const createSleepRecoveryGraph = () => {
  const workflow = new StateGraph(SleepRecoveryAnnotation)
    .addNode('assess_sleep_issue', assessSleepIssueNode)
    .addNode('provide_strategies', provideSleepStrategiesNode)
    .addEdge(START, 'assess_sleep_issue')
    .addEdge('assess_sleep_issue', 'provide_strategies')
    .addEdge('provide_strategies', END);

  const memory = new MemorySaver();
  return workflow.compile({ checkpointer: memory });
};
