import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Button, Card } from '../../components/ui';
import { BrainCircuit, Mail, Lock, User, AlertCircle } from 'lucide-react';

const RegisterPage = () => {
    const navigate = useNavigate();
    const { register, loginWithGoogle, isLoading } = useAuth();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        try {
            await register({ email, password, full_name: fullName });
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Registration failed. Please try again.');
        }
    };

    const handleGoogleLogin = async () => {
        setError(null);
        try {
            await loginWithGoogle();
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Google sign-in failed. Please try again.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-6 py-12">
            {/* Background gradient */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary-100 dark:bg-primary-950/20 rounded-full blur-[100px] -z-10 opacity-60"></div>

            <Card className="w-full max-w-md p-8">
                {/* Logo */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                        <BrainCircuit className="w-6 h-6" />
                    </div>
                    <span className="text-warm-800 dark:text-warm-50 font-semibold text-2xl">
                        Lundo
                    </span>
                </div>

                <h1 className="text-2xl font-semibold text-warm-800 dark:text-warm-50 text-center mb-2">
                    Create your account
                </h1>
                <p className="text-warm-500 dark:text-warm-400 text-center mb-8">
                    Start your parenting support journey
                </p>

                {error && (
                    <div className="flex items-center gap-2 p-4 mb-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl text-red-700 dark:text-red-400 text-sm">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-400" />
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Full name"
                            required
                            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-warm-50 dark:bg-warm-900 border border-warm-200 dark:border-warm-700 text-warm-800 dark:text-warm-100 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all"
                        />
                    </div>

                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-400" />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email address"
                            required
                            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-warm-50 dark:bg-warm-900 border border-warm-200 dark:border-warm-700 text-warm-800 dark:text-warm-100 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all"
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-400" />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password (min. 8 characters)"
                            required
                            minLength={8}
                            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-warm-50 dark:bg-warm-900 border border-warm-200 dark:border-warm-700 text-warm-800 dark:text-warm-100 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all"
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-400" />
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm password"
                            required
                            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-warm-50 dark:bg-warm-900 border border-warm-200 dark:border-warm-700 text-warm-800 dark:text-warm-100 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all"
                        />
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        disabled={isLoading}
                        className="w-full"
                    >
                        {isLoading ? 'Creating account...' : 'Create account'}
                    </Button>
                </form>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-warm-200 dark:border-warm-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-white dark:bg-warm-900 text-warm-400">or continue with</span>
                    </div>
                </div>

                <button
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-2xl border border-warm-200 dark:border-warm-700 bg-white dark:bg-warm-800 text-warm-700 dark:text-warm-200 hover:bg-warm-50 dark:hover:bg-warm-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Sign up with Google
                </button>

                <p className="text-center text-warm-500 dark:text-warm-400 text-sm mt-6">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                        Sign in
                    </Link>
                </p>
            </Card>
        </div>
    );
};

export default RegisterPage;
