import express from 'express';
import { AgentMetadata } from '../agents/base/types.js';

const router = express.Router();

const AGENTS: AgentMetadata[] = [
  {
    id: 'reality-checker',
    name: 'The Reality Checker',
    description: 'Validation & Norms',
    status: 'always-on',
    icon: 'Baby',
    color: 'emerald'
  },
  {
    id: 'routine-architect',
    name: 'The Routine Architect',
    description: 'Efficiency & Logistics',
    status: 'toggleable',
    icon: 'Clock',
    color: 'amber'
  },
  {
    id: 'guilt-dissolver',
    name: 'The Guilt Dissolver',
    description: 'Mental Health',
    status: 'toggleable',
    icon: 'Heart',
    color: 'violet'
  },
  {
    id: 'sleep-recovery',
    name: 'Sleep Recovery',
    description: 'Sleep Management',
    status: 'scenario-specific',
    icon: 'Moon',
    color: 'blue'
  },
  {
    id: 'homework-helper',
    name: 'Homework Helper',
    description: 'Academic Conflicts',
    status: 'scenario-specific',
    icon: 'BookOpen',
    color: 'rose'
  },
  {
    id: 'transition-tamer',
    name: 'Transition Tamer',
    description: 'Transition Management',
    status: 'scenario-specific',
    icon: 'Smile',
    color: 'slate'
  }
];

router.get('/', (req, res) => {
  res.json({ agents: AGENTS });
});

router.get('/:agentId', (req, res) => {
  const agent = AGENTS.find(a => a.id === req.params.agentId);
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  res.json(agent);
});

router.post('/:agentId/toggle', (req, res) => {
  const { sessionId, enabled } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID required' });
  }

  // TODO: Implement agent toggle logic with session manager
  res.json({ success: true, enabled });
});

export default router;
