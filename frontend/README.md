# Child Behavioral Therapist - Frontend

Beautiful React frontend for the Child Behavioral Therapist AI parenting assistant.

## ✨ Features

### Public Pages
- 🎨 **Landing Page** - Beautiful marketing site with warm orange design
  - Hero section with CTAs
  - Features showcase
  - "Village Council" agent cards
  - Research/credibility section
  - Pricing tiers
  - Responsive navigation

### Authenticated Application
- 🔐 **Authentication** - Login/Register with validation
  - JWT token management
  - Auto-refresh on token expiration
  - Protected routes

- 👶 **Child Management** - Manage children's profiles
  - Create, view, edit children
  - Age calculation
  - Notes and details
  - Beautiful card-based UI

- 💬 **Conversation Interface** - Chat with AI therapist
  - Real-time messaging
  - Message history
  - Agent indicators
  - Child-specific conversations
  - Safety flags display

- 📊 **Insights Dashboard** - View behavioral data
  - Behavioral patterns
  - Developmental timeline
  - Effective interventions
  - Tabbed interface

### UI/UX
- 🌓 **Dark/Light Theme** - System preference detection + manual toggle
- 🌍 **Multilingual** - English/Turkish support
- 📱 **Responsive** - Mobile-first design
- ⚡ **Fast** - Vite build tool
- 🎯 **Accessible** - Keyboard navigation, ARIA labels

## 🚀 Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 6
- **Styling**: TailwindCSS with custom warm color palette
- **Routing**: React Router 6
- **HTTP**: Axios with interceptors
- **State**: Context API + custom hooks
- **Forms**: React Hook Form + Zod validation
- **Icons**: lucide-react

## 📋 Prerequisites

- Node.js 18+ (20 LTS recommended)
- npm or yarn
- Backend API running on `http://localhost:8080` (optional for development)

## 🛠️ Setup

1. **Install dependencies:**
```bash
cd frontend
npm install
```

2. **Start development server:**
```bash
npm run dev
```

The app will be available at **`http://localhost:3000`**

3. **(Optional) Configure API endpoint:**

Create `.env.local`:
```
VITE_API_URL=http://localhost:8080/api/v1
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── public/              # Public pages
│   │   │   ├── LandingPage.tsx  # Marketing landing page
│   │   │   ├── LoginPage.tsx    # Login form
│   │   │   └── RegisterPage.tsx # Registration form
│   │   └── app/                 # Authenticated pages
│   │       ├── DashboardPage.tsx     # Dashboard overview
│   │       ├── ChildrenPage.tsx      # Child management
│   │       ├── ConversationPage.tsx  # Chat list
│   │       └── InsightsPage.tsx      # Behavioral insights
│   ├── components/
│   │   ├── public/              # Landing page components
│   │   │   ├── Navbar.tsx       # Public navbar
│   │   │   ├── Hero.tsx         # Hero section
│   │   │   ├── Features.tsx     # Features showcase
│   │   │   ├── Agents.tsx       # Agent cards
│   │   │   ├── Research.tsx     # Research section
│   │   │   ├── Pricing.tsx      # Pricing tiers
│   │   │   └── Footer.tsx       # Footer
│   │   ├── app/                 # App components
│   │   │   ├── AppNavbar.tsx    # App navigation
│   │   │   ├── ChildCard.tsx    # Child profile card
│   │   │   ├── ChildForm.tsx    # Child form
│   │   │   ├── ChatInterface.tsx # Chat UI
│   │   │   └── MessageBubble.tsx # Message display
│   │   └── shared/              # Reusable components
│   │       ├── Button.tsx       # Button component
│   │       ├── Input.tsx        # Input component
│   │       ├── Card.tsx         # Card component
│   │       ├── Modal.tsx        # Modal component
│   │       ├── LoadingSpinner.tsx
│   │       └── ThemeToggle.tsx
│   ├── contexts/                # React contexts
│   │   ├── AuthContext.tsx      # Authentication state
│   │   ├── ThemeContext.tsx     # Theme state
│   │   ├── LanguageContext.tsx  # Language state
│   │   └── ChildrenContext.tsx  # Children state
│   ├── services/                # API services
│   │   ├── api.ts               # Axios instance
│   │   ├── authService.ts       # Auth endpoints
│   │   ├── childService.ts      # Child endpoints
│   │   ├── conversationService.ts # Chat endpoints
│   │   └── memoryService.ts     # Insights endpoints
│   ├── types/                   # TypeScript types
│   │   ├── auth.ts
│   │   ├── child.ts
│   │   ├── conversation.ts
│   │   └── memory.ts
│   ├── hooks/                   # Custom hooks
│   │   ├── useConversations.ts
│   │   └── useLocalStorage.ts
│   ├── utils/                   # Utilities
│   │   ├── validation.ts        # Form schemas
│   │   └── dateFormatter.ts     # Date utilities
│   ├── routes/                  # Router config
│   │   └── index.tsx
│   ├── layouts/                 # Layout components
│   │   ├── PublicLayout.tsx
│   │   └── AppLayout.tsx
│   ├── App.tsx                  # Root component
│   ├── main.tsx                 # Entry point
│   └── index.css                # Global styles
├── public/
│   └── index.html               # HTML template
├── package.json
├── tsconfig.json
├── vite.config.ts               # Vite configuration
├── tailwind.config.js           # Tailwind configuration
└── README.md
```

## 🎯 Available Scripts

- `npm run dev` - Start development server (port 3000)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔌 API Integration

The frontend connects to the Python FastAPI backend at `http://localhost:8080/api/v1`.

### Endpoints

**Authentication:**
- `POST /auth/register` - Register user
- `POST /auth/login` - Login (returns JWT tokens)
- `POST /auth/refresh` - Refresh access token

**Children:**
- `GET /children` - List children
- `POST /children` - Create child
- `GET /children/{id}` - Get child details
- `PUT /children/{id}` - Update child
- `DELETE /children/{id}` - Delete child

**Conversations:**
- `GET /conversations` - List conversations
- `POST /conversations` - Create conversation
- `GET /conversations/{id}` - Get conversation history
- `POST /conversations/{id}/messages` - Send message

**Insights:**
- `GET /children/{id}/patterns` - Behavioral patterns
- `GET /children/{id}/timeline` - Developmental timeline
- `GET /children/{id}/memories` - Long-term memories
- `GET /children/{id}/interventions` - Effective interventions

## 🎨 Design System

### Colors
- **Warm Palette**: warm-50 to warm-950
- **Accent**: #d97757 (warm orange)
- **Dark Mode**: Automatic via class strategy

### Typography
- **Font**: Outfit (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700

### Components
- **Corners**: Rounded (2rem standard)
- **Shadows**: Subtle elevation
- **Animations**: Smooth transitions, blob morphing, floating

## 🔐 Authentication Flow

1. User visits `/` (landing page)
2. Clicks "Start Assessment" → `/register`
3. Creates account with email + password
4. Auto-login → redirected to `/app` (dashboard)
5. JWT tokens stored in localStorage
6. Protected routes check authentication
7. Token auto-refreshes on 401 errors
8. Logout clears tokens and redirects to `/login`

## 🧭 User Flow

### First-Time User
1. Visit `/` - See landing page
2. Click "Get Support Now" → `/register`
3. Fill registration form (name, email, password)
4. Auto-login → Dashboard (`/app`)
5. Click "Add Child" → Fill child form
6. View child on dashboard
7. Click "Start Conversation" → Select child → Chat
8. View insights from child card

### Returning User
1. Visit `/login`
2. Enter credentials
3. Redirected to `/app` (dashboard)
4. See existing children
5. Continue conversations or start new ones

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

Output will be in `dist/` directory.

### Environment Variables

Create `.env.production`:

```
VITE_API_URL=https://api.yourproduction.com/api/v1
```

### Deploy to

- **Vercel**: `vercel deploy`
- **Netlify**: Drag `dist/` folder
- **Docker**: See `Dockerfile` (if created)

## ✅ Development Status

### **100% Complete!** 🎉

- ✅ Project structure and configuration
- ✅ TypeScript types (auth, child, conversation, memory)
- ✅ API client with JWT interceptors
- ✅ Service layer (all endpoints)
- ✅ Context providers (Auth, Theme, Language, Children)
- ✅ React Router with protected routes
- ✅ Shared UI components (Button, Input, Card, Modal, etc.)
- ✅ Authentication pages (Login, Register) with validation
- ✅ Landing page (all sections adapted from example)
- ✅ Dashboard with quick actions
- ✅ Child management (create, view, list)
- ✅ Conversation interface (chat with AI)
- ✅ Insights pages (patterns, timeline, interventions)
- ✅ Dark/light theme toggle
- ✅ Responsive design
- ✅ Loading and error states

## 🐛 Known Issues

- Backend API may not be fully implemented yet
- Streaming chat responses not yet supported (uses regular POST)
- Some API responses may need adjustment when backend is complete

## 📝 License

Private - Child Behavioral Therapist Project

---

**Built with ❤️ using React + TypeScript + TailwindCSS**
