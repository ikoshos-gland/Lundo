import { useAuth } from '../auth';
import { Layout } from '../../components/layout';
import { DemoChatbot, Button, Card } from '../../components/ui';
import { LogOut, User, Baby, MessageSquare } from 'lucide-react';

interface DashboardProps {
    isDark: boolean;
    toggleTheme: () => void;
}

const Dashboard = ({ isDark, toggleTheme }: DashboardProps) => {
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        window.location.href = '/';
    };

    return (
        <Layout isDark={isDark} toggleTheme={toggleTheme}>
            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-3xl font-semibold text-warm-800 dark:text-warm-50 mb-2">
                            Welcome back, {user?.full_name || 'Parent'}
                        </h1>
                        <p className="text-warm-500 dark:text-warm-400">
                            Here's your parenting support dashboard
                        </p>
                    </div>
                    <Button variant="secondary" onClick={handleLogout}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign out
                    </Button>
                </div>

                {/* Quick Stats */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    <Card className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-950/30 flex items-center justify-center text-primary-600">
                                <User className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-warm-500 dark:text-warm-400">Account</p>
                                <p className="text-lg font-semibold text-warm-800 dark:text-warm-50">
                                    {user?.email}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600">
                                <Baby className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-warm-500 dark:text-warm-400">Children</p>
                                <p className="text-lg font-semibold text-warm-800 dark:text-warm-50">
                                    0 profiles
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center text-blue-600">
                                <MessageSquare className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-warm-500 dark:text-warm-400">Conversations</p>
                                <p className="text-lg font-semibold text-warm-800 dark:text-warm-50">
                                    0 sessions
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Chat Demo */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-warm-800 dark:text-warm-50 mb-6">
                        Try the Chat Interface
                    </h2>
                    <DemoChatbot />
                </div>
            </div>
        </Layout>
    );
};

export default Dashboard;
