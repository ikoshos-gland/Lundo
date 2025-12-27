import express from 'express';
import { sessionManager } from '../memory/store.js';
import { createRealityCheckerGraph } from '../graphs/reality-checker.js';
import { createRoutineArchitectGraph } from '../graphs/routine-architect.js';
import { createGuiltDissolverGraph } from '../graphs/guilt-dissolver.js';
import { createSleepRecoveryGraph } from '../graphs/sleep-recovery.js';
import { createHomeworkHelperGraph } from '../graphs/homework-helper.js';
import { createTransitionTamerGraph } from '../graphs/transition-tamer.js';

const router = express.Router();

// Agent graph factory - all 6 agents
const AGENT_GRAPHS: Record<string, () => any> = {
  'reality-checker': createRealityCheckerGraph,
  'routine-architect': createRoutineArchitectGraph,
  'guilt-dissolver': createGuiltDissolverGraph,
  'sleep-recovery': createSleepRecoveryGraph,
  'homework-helper': createHomeworkHelperGraph,
  'transition-tamer': createTransitionTamerGraph
};

// POST /api/chat/message - Send a message and stream response via SSE
router.post('/message', async (req, res) => {
  const { sessionId, agentId, message, context } = req.body;

  if (!sessionId || !agentId || !message) {
    return res.status(400).json({ error: 'Missing required fields: sessionId, agentId, message' });
  }

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering for nginx

  try {
    // Get or create graph
    const createGraph = AGENT_GRAPHS[agentId];
    if (!createGraph) {
      const error = JSON.stringify({ type: 'error', error: `Unknown agent: ${agentId}` });
      res.write(`data: ${error}\n\n`);
      return res.end();
    }

    const graph = createGraph();

    // Prepare input
    const input = {
      messages: [{ role: 'user', content: message }],
      childAge: context?.childAge || 6,
      language: context?.language || 'en'
    };

    // Create thread ID for this session-agent combination
    const threadId = `${sessionId}-${agentId}`;

    // Send start event
    res.write(`data: ${JSON.stringify({ type: 'message_start', messageId: Date.now().toString() })}\n\n`);

    // Stream the graph execution
    const stream = await graph.stream(input, {
      configurable: { thread_id: threadId }
    });

    let fullResponse = '';
    let lastNodeOutput: any = null;

    for await (const chunk of stream) {
      lastNodeOutput = chunk;

      // Extract response from the final node
      if (chunk.respond && chunk.respond.reassurance) {
        const content = chunk.respond.reassurance;
        fullResponse = content;

        // Send content delta
        res.write(`data: ${JSON.stringify({
          type: 'content_block_delta',
          delta: content
        })}\n\n`);
      }
    }

    // Send completion event
    res.write(`data: ${JSON.stringify({
      type: 'message_complete',
      messageId: Date.now().toString(),
      fullResponse
    })}\n\n`);

    // Update session with new messages
    const session = sessionManager.getSession(sessionId);
    session.messages.push(
      { role: 'user', content: message },
      { role: 'assistant', content: fullResponse }
    );
    sessionManager.updateSession(sessionId, session);

    res.end();

  } catch (error: any) {
    console.error('Chat error:', error);
    const errorEvent = JSON.stringify({
      type: 'error',
      error: error.message || 'Internal server error'
    });
    res.write(`data: ${errorEvent}\n\n`);
    res.end();
  }
});

// GET /api/chat/sessions/:sessionId - Get session history
router.get('/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = sessionManager.getSession(sessionId);
  res.json(session);
});

// DELETE /api/chat/sessions/:sessionId - Clear session
router.delete('/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const success = sessionManager.deleteSession(sessionId);
  res.json({ success });
});

export default router;
