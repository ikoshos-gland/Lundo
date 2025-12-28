import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Layout } from './components/layout';
import { DemoChatbot, Button, Card } from './components/ui';
import { Sparkles, ArrowRight, Shield, Brain, Heart, LayoutDashboard } from 'lucide-react';
import { AuthProvider, useAuth, LoginPage, RegisterPage } from './features/auth';
import { Dashboard } from './features/dashboard';
import { ChildrenPage } from './features/children';
import { ChatPage } from './features/chat';

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-warm-50 dark:bg-warm-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                    <p className="text-warm-500 dark:text-warm-400 text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

// Landing Page component
const LandingPage = ({ isDark, toggleTheme }: { isDark: boolean; toggleTheme: () => void }) => {
    const { isAuthenticated, isLoading } = useAuth();
    const navigate = useNavigate();

    return (
        <Layout isDark={isDark} toggleTheme={toggleTheme}>
            {/* Hero Section */}
            <section className="relative pt-16 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary-100 dark:bg-primary-950/20 rounded-full blur-[100px] -z-10 opacity-60 transition-colors duration-700"></div>

                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 dark:bg-warm-800 border border-primary-100 dark:border-warm-700 text-primary-700 dark:text-primary-400 text-xs font-semibold mb-8 shadow-sm transition-colors duration-300">
                    <Sparkles className="w-3 h-3 text-primary-500" />
                    Your 24/7 Parenting Support
                </div>

                <h1 className="text-5xl md:text-7xl font-semibold text-warm-800 dark:text-warm-50 tracking-tight mb-8 max-w-4xl leading-[1.1] transition-colors duration-300">
                    You're doing it all.
                    <br />
                    <span className="text-primary-600">You shouldn't have to do it alone.</span>
                </h1>

                <p className="text-lg md:text-xl text-warm-500 dark:text-warm-400 max-w-2xl mb-12 font-normal leading-relaxed transition-colors duration-300">
                    AI-powered support for parents. Instant, evidence-based guidance for the 2 AM worries and the 6 PM meltdowns, without the judgment.
                </p>

                {/* CTA Buttons - Different based on auth state */}
                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto mb-20">
                    {isLoading ? (
                        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                    ) : isAuthenticated ? (
                        <>
                            <Button variant="primary" size="lg" onClick={() => navigate('/dashboard')}>
                                <LayoutDashboard className="w-4 h-4 mr-2" />
                                Go to Dashboard
                            </Button>
                            <Button variant="secondary" size="lg" onClick={() => navigate('/chat')}>
                                Start Chatting
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="primary" size="lg" onClick={() => navigate('/register')}>
                                Get Started Free
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                            <Button variant="secondary" size="lg" onClick={() => navigate('/login')}>
                                Sign In
                            </Button>
                        </>
                    )}
                </div>

                {/* Demo Chatbot */}
                <DemoChatbot />

                {/* Social Proof */}
                <div className="mt-20 w-full pt-12 border-t border-warm-200 dark:border-warm-800">
                    <p className="text-center text-sm font-medium text-warm-400 mb-8 uppercase tracking-widest">
                        Trusted by 10,000+ parents worldwide
                    </p>
                    <div className="flex flex-wrap justify-center gap-10 md:gap-20 opacity-60 hover:opacity-100 transition-all duration-500">
                        <span className="text-xl font-bold text-warm-600 dark:text-warm-400">
                            Solo<span className="font-light">Parent</span>
                        </span>
                        <span className="text-xl font-bold text-warm-600 dark:text-warm-400">
                            Working<span className="text-primary-600">Mom</span>
                        </span>
                        <span className="text-xl font-bold text-warm-600 dark:text-warm-400">
                            Career<span className="font-light">&Kids</span>
                        </span>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 px-6 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-semibold text-warm-800 dark:text-warm-50 mb-4">
                        Why Parents Love Lundo
                    </h2>
                    <p className="text-warm-500 dark:text-warm-400 max-w-2xl mx-auto">
                        Expert-backed guidance available whenever you need it
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <Card hoverable className="p-6">
                        <div className="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-950/30 flex items-center justify-center text-primary-600 mb-4">
                            <Brain className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-semibold text-warm-800 dark:text-warm-50 mb-2">
                            Evidence-Based
                        </h3>
                        <p className="text-warm-500 dark:text-warm-400 text-sm leading-relaxed">
                            All guidance is backed by child development research and pediatric psychology.
                        </p>
                    </Card>

                    <Card hoverable className="p-6">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 mb-4">
                            <Shield className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-semibold text-warm-800 dark:text-warm-50 mb-2">
                            Private & Secure
                        </h3>
                        <p className="text-warm-500 dark:text-warm-400 text-sm leading-relaxed">
                            Your conversations are encrypted and never shared. Your family's privacy matters.
                        </p>
                    </Card>

                    <Card hoverable className="p-6">
                        <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center text-rose-600 mb-4">
                            <Heart className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-semibold text-warm-800 dark:text-warm-50 mb-2">
                            No Judgment
                        </h3>
                        <p className="text-warm-500 dark:text-warm-400 text-sm leading-relaxed">
                            Ask anything without fear of being judged. We're here to support, not criticize.
                        </p>
                    </Card>
                </div>
            </section>
        </Layout>
    );
};

function App() {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setIsDark(true);
        }
    }, []);

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDark]);

    const toggleTheme = () => {
        setIsDark(!isDark);
    };

    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/" element={<LandingPage isDark={isDark} toggleTheme={toggleTheme} />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard isDark={isDark} toggleTheme={toggleTheme} />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/children"
                        element={
                            <ProtectedRoute>
                                <ChildrenPage isDark={isDark} toggleTheme={toggleTheme} />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/chat"
                        element={
                            <ProtectedRoute>
                                <ChatPage isDark={isDark} toggleTheme={toggleTheme} />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
