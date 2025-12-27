# Cognit - LangGraph Backend Setup Guide

## 🎉 Implementation Complete!

Your fully functional LangGraph backend with agentic workflows has been successfully implemented!

## What's Been Created

### ✅ Backend (Node.js + Express + LangGraph)
- **6 AI Agents** with separate LangGraph workflows:
  1. **The Reality Checker** - Validation & norms (always on)
  2. **The Routine Architect** - Efficiency & logistics
  3. **The Guilt Dissolver** - Mental health support
  4. **Sleep Recovery** - Sleep management
  5. **Homework Helper** - Academic conflict resolution
  6. **Transition Tamer** - Transition management

- **Express Server** with:
  - RESTful API endpoints
  - Server-Sent Events (SSE) for streaming responses
  - Session management with in-memory storage
  - Gemini API integration
  - CORS configuration for frontend

### ✅ Frontend Integration
- **Updated ChatInterface** with:
  - State management for messages
  - Agent selector dropdown
  - SSE streaming client
  - Real-time message updates
  - Loading states and animations
  - Bilingual support (en/tr)

### ✅ Development Configuration
- Workspace setup for monorepo
- Vite proxy for API requests
- Concurrent dev servers (frontend + backend)

## 📋 Prerequisites

Before you can run the application, you need to have Node.js installed:

```bash
# Check if Node.js is installed
node --version

# If not installed, install Node.js (version 18 or higher)
# Visit: https://nodejs.org/
```

## 🚀 Installation & Setup

### Step 1: Install Dependencies

From the project root directory:

```bash
# Install root dependencies (including concurrently)
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### Step 2: Configure API Key

Update the Gemini API key in both locations:

**Frontend** (`.env.local`):
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

**Backend** (`backend/.env`):
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
PORT=3001
NODE_ENV=development
LOG_LEVEL=debug
```

💡 **Get your Gemini API key from**: https://ai.google.dev/

### Step 3: Start the Development Servers

**Option A: Run Both Servers Concurrently** (Recommended)
```bash
npm run dev
```

This will start:
- Frontend on `http://localhost:3000` (Vite)
- Backend on `http://localhost:3001` (Express)
- Automatic proxy from frontend to backend

**Option B: Run Servers Separately**

Terminal 1 (Frontend):
```bash
npm run dev:frontend
```

Terminal 2 (Backend):
```bash
npm run dev:backend
```

## 🎮 Usage

1. **Open your browser** to `http://localhost:3000`

2. **Select an agent** from the dropdown in the chat header:
   - The Reality Checker
   - The Routine Architect
   - The Guilt Dissolver
   - Sleep Recovery
   - Homework Helper
   - Transition Tamer

3. **Start chatting!** Type a parenting question or concern and get AI-powered guidance

4. **Switch agents** at any time to get different perspectives

5. **Language support**: Use the language toggle (if available) to switch between English and Turkish

## 🔍 Testing the Backend

### Health Check
```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-21T...",
  "service": "cognit-backend"
}
```

### List Agents
```bash
curl http://localhost:3001/api/agents
```

### Send a Test Message
```bash
curl -X POST http://localhost:3001/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-123",
    "agentId": "reality-checker",
    "message": "My 6-year-old is having tantrums. Is this normal?",
    "context": {
      "childAge": 6,
      "language": "en"
    }
  }'
```

## 📁 Project Structure

```
cognit/
├── backend/                      # Backend server
│   ├── src/
│   │   ├── index.ts             # Express entry point
│   │   ├── config/              # Configuration files
│   │   │   ├── gemini.ts        # Gemini API client
│   │   │   └── environment.ts   # Environment config
│   │   ├── graphs/              # LangGraph workflows (6 agents)
│   │   │   ├── reality-checker.ts
│   │   │   ├── routine-architect.ts
│   │   │   ├── guilt-dissolver.ts
│   │   │   ├── sleep-recovery.ts
│   │   │   ├── homework-helper.ts
│   │   │   └── transition-tamer.ts
│   │   ├── routes/              # API routes
│   │   │   ├── chat.ts          # Chat endpoints (SSE)
│   │   │   ├── agents.ts        # Agent management
│   │   │   └── health.ts        # Health check
│   │   ├── memory/              # Session management
│   │   └── middleware/          # Express middleware
│   ├── package.json
│   └── tsconfig.json
├── components/
│   └── ChatInterface.tsx        # Updated with API integration
├── vite.config.ts               # Proxy configuration
├── package.json                 # Workspace configuration
└── .env.local                   # Frontend environment variables
```

## 🐛 Troubleshooting

### Port Already in Use
If you get "port already in use" errors:

```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Find and kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

### Gemini API Errors
- Make sure your API key is valid
- Check you have API credits/quota
- Verify the key is set in both `.env.local` and `backend/.env`

### CORS Errors
- Make sure backend is running on port 3001
- Check the proxy configuration in `vite.config.ts`
- Ensure CORS middleware is properly configured

### TypeScript Errors
```bash
# Rebuild backend
cd backend
npm run build
```

## 📝 Next Steps

Now that your backend is fully functional, you can:

1. **Test each agent** - Try different parenting scenarios with each agent
2. **Improve workflows** - Enhance the LangGraph workflows with more nodes and logic
3. **Add features**:
   - Action plan generation in the right sidebar
   - Conversation history persistence
   - User authentication
   - Agent recommendations based on context
4. **Deploy** - Deploy to production (Vercel for frontend, Railway/Render for backend)

## 🔧 Development Scripts

```bash
# Root (workspace)
npm run dev              # Run both frontend and backend
npm run dev:frontend     # Run only frontend
npm run dev:backend      # Run only backend
npm run build            # Build both frontend and backend

# Backend
cd backend
npm run dev              # Start backend in watch mode
npm run build            # Build backend
npm run start            # Start production backend
```

## 🎨 Customization

### Adding New Agents
1. Create new graph in `backend/src/graphs/your-agent.ts`
2. Add to `AGENT_GRAPHS` in `backend/src/routes/chat.ts`
3. Add to agent metadata in `backend/src/routes/agents.ts`
4. Add to frontend selector in `components/ChatInterface.tsx`

### Modifying Agent Workflows
Each agent graph is in its own file. Edit the nodes and edges to change behavior:
- `backend/src/graphs/reality-checker.ts`
- `backend/src/graphs/routine-architect.ts`
- etc.

### Changing the UI
The ChatInterface is fully customizable:
- `components/ChatInterface.tsx` - Main chat component
- Uses TailwindCSS for styling
- Supports dark mode
- Bilingual (English/Turkish)

## 📚 Documentation

- **LangGraph**: https://langchain-ai.github.io/langgraphjs/
- **Gemini API**: https://ai.google.dev/
- **Express**: https://expressjs.com/
- **Vite**: https://vitejs.dev/

## 🎯 Success Metrics

✅ All 6 agents implemented
✅ Streaming responses working
✅ Agent selection functional
✅ Frontend-backend communication established
✅ Bilingual support (en/tr)
✅ Session state management
✅ Error handling

---

**Made with ❤️ using Claude Code**
