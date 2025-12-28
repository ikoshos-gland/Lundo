import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout';
import { Button, Card, Input } from '../../components/ui';
import { childrenApi, Child, ChildCreate } from '../../api';
import {
    Plus,
    X,
    Heart,
    Calendar,
    Pencil,
    Trash2,
    MessageCircle,
    Sparkles,
    Baby
} from 'lucide-react';

interface ChildrenPageProps {
    isDark: boolean;
    toggleTheme: () => void;
}

// Soft pastel colors for child avatars
const avatarColors = [
    { bg: 'bg-rose-100 dark:bg-rose-950/40', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-900' },
    { bg: 'bg-sky-100 dark:bg-sky-950/40', text: 'text-sky-600 dark:text-sky-400', border: 'border-sky-200 dark:border-sky-900' },
    { bg: 'bg-amber-100 dark:bg-amber-950/40', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-900' },
    { bg: 'bg-emerald-100 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-900' },
    { bg: 'bg-violet-100 dark:bg-violet-950/40', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-900' },
    { bg: 'bg-primary-100 dark:bg-primary-950/40', text: 'text-primary-600 dark:text-primary-400', border: 'border-primary-200 dark:border-primary-900' },
];

const getAvatarColor = (index: number) => avatarColors[index % avatarColors.length];

const formatAge = (ageYears: number): string => {
    if (ageYears === 0) {
        return 'Less than 1 year old';
    } else if (ageYears === 1) {
        return '1 year old';
    }
    return `${ageYears} years old`;
};

const getInitials = (name: string): string => {
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

const ChildrenPage = ({ isDark, toggleTheme }: ChildrenPageProps) => {
    const navigate = useNavigate();
    const [children, setChildren] = useState<Child[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingChild, setEditingChild] = useState<Child | null>(null);
    const [formData, setFormData] = useState<ChildCreate>({
        name: '',
        date_of_birth: '',
        notes: '',
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchChildren();
    }, []);

    const fetchChildren = async () => {
        try {
            const data = await childrenApi.getAll();
            setChildren(data);
        } catch (error) {
            console.error('Failed to fetch children:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const openModal = (child?: Child) => {
        if (child) {
            setEditingChild(child);
            setFormData({
                name: child.name,
                date_of_birth: child.date_of_birth,
                notes: child.notes || '',
            });
        } else {
            setEditingChild(null);
            setFormData({ name: '', date_of_birth: '', notes: '' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingChild(null);
        setFormData({ name: '', date_of_birth: '', notes: '' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            if (editingChild) {
                await childrenApi.update(editingChild.id, formData);
            } else {
                await childrenApi.create(formData);
            }
            await fetchChildren();
            closeModal();
        } catch (error) {
            console.error('Failed to save child:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to remove this child profile? This action cannot be undone.')) {
            return;
        }

        try {
            await childrenApi.delete(id);
            await fetchChildren();
        } catch (error) {
            console.error('Failed to delete child:', error);
        }
    };

    const startChat = (childId: number) => {
        navigate(`/chat?child=${childId}`);
    };

    return (
        <Layout isDark={isDark} toggleTheme={toggleTheme}>
            <div className="max-w-6xl mx-auto px-6 py-12">
                {/* Decorative background elements */}
                <div className="fixed top-20 right-10 w-72 h-72 bg-primary-200/20 dark:bg-primary-900/10 rounded-full blur-3xl -z-10 animate-blob"></div>
                <div className="fixed bottom-20 left-10 w-96 h-96 bg-rose-200/20 dark:bg-rose-900/10 rounded-full blur-3xl -z-10 animate-blob" style={{ animationDelay: '2s' }}></div>

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-950/30 border border-primary-100 dark:border-primary-900 text-primary-600 dark:text-primary-400 text-xs font-medium mb-4">
                            <Heart className="w-3 h-3" />
                            Your Little Ones
                        </div>
                        <h1 className="text-4xl md:text-5xl font-semibold text-warm-800 dark:text-warm-50 tracking-tight mb-3">
                            Children
                        </h1>
                        <p className="text-warm-500 dark:text-warm-400 text-lg max-w-lg">
                            Manage profiles for each of your children to get personalized guidance and support.
                        </p>
                    </div>
                    <Button variant="primary" size="lg" onClick={() => openModal()}>
                        <Plus className="w-5 h-5 mr-2" />
                        Add Child
                    </Button>
                </div>

                {/* Loading State */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24">
                        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-warm-500 dark:text-warm-400">Loading...</p>
                    </div>
                ) : children.length === 0 ? (
                    /* Empty State */
                    <Card className="p-12 text-center">
                        <div className="max-w-md mx-auto">
                            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary-100 to-rose-100 dark:from-primary-950/50 dark:to-rose-950/50 flex items-center justify-center">
                                <Baby className="w-12 h-12 text-primary-500" />
                            </div>
                            <h3 className="text-2xl font-semibold text-warm-800 dark:text-warm-50 mb-3">
                                No children added yet
                            </h3>
                            <p className="text-warm-500 dark:text-warm-400 mb-8 leading-relaxed">
                                Add your first child's profile to get started. We'll personalize our guidance based on their age and your notes.
                            </p>
                            <Button variant="primary" size="lg" onClick={() => openModal()}>
                                <Plus className="w-5 h-5 mr-2" />
                                Add Your First Child
                            </Button>
                        </div>
                    </Card>
                ) : (
                    /* Children Grid */
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {children.map((child, index) => {
                            const colors = getAvatarColor(index);
                            return (
                                <Card
                                    key={child.id}
                                    hoverable
                                    className="group relative overflow-hidden"
                                >
                                    {/* Subtle gradient overlay on hover */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500/0 to-rose-500/0 group-hover:from-primary-500/5 group-hover:to-rose-500/5 transition-all duration-500 pointer-events-none"></div>

                                    <div className="p-6 relative">
                                        {/* Avatar and Name */}
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className={`w-16 h-16 rounded-2xl ${colors.bg} ${colors.border} border-2 flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                                <span className={`text-xl font-bold ${colors.text}`}>
                                                    {getInitials(child.name)}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-xl font-semibold text-warm-800 dark:text-warm-50 truncate mb-1">
                                                    {child.name}
                                                </h3>
                                                <div className="flex items-center gap-1.5 text-warm-500 dark:text-warm-400 text-sm">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    <span>{formatAge(child.age_years)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Notes */}
                                        {child.notes && (
                                            <p className="text-warm-600 dark:text-warm-400 text-sm leading-relaxed mb-5 line-clamp-2">
                                                {child.notes}
                                            </p>
                                        )}

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 pt-4 border-t border-warm-100 dark:border-warm-800">
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => startChat(child.id)}
                                            >
                                                <MessageCircle className="w-4 h-4 mr-1.5" />
                                                Chat
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openModal(child)}
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(child.id)}
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}

                        {/* Add More Card */}
                        <button
                            onClick={() => openModal()}
                            className="group min-h-[200px] rounded-3xl border-2 border-dashed border-warm-200 dark:border-warm-700 hover:border-primary-300 dark:hover:border-primary-700 bg-warm-50/50 dark:bg-warm-900/50 hover:bg-primary-50/50 dark:hover:bg-primary-950/20 transition-all duration-300 flex flex-col items-center justify-center gap-3"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-warm-100 dark:bg-warm-800 group-hover:bg-primary-100 dark:group-hover:bg-primary-950/50 flex items-center justify-center transition-colors">
                                <Plus className="w-6 h-6 text-warm-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
                            </div>
                            <span className="text-warm-500 dark:text-warm-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 font-medium transition-colors">
                                Add another child
                            </span>
                        </button>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-warm-900/60 dark:bg-warm-950/80 backdrop-blur-sm"
                        onClick={closeModal}
                    ></div>

                    {/* Modal Content */}
                    <div className="relative w-full max-w-lg bg-white dark:bg-warm-900 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="px-8 pt-8 pb-6 border-b border-warm-100 dark:border-warm-800">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-950/50 flex items-center justify-center">
                                        <Sparkles className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-warm-800 dark:text-warm-50">
                                        {editingChild ? 'Edit Child' : 'Add Child'}
                                    </h2>
                                </div>
                                <button
                                    onClick={closeModal}
                                    className="w-10 h-10 rounded-full hover:bg-warm-100 dark:hover:bg-warm-800 flex items-center justify-center transition-colors"
                                >
                                    <X className="w-5 h-5 text-warm-500" />
                                </button>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-8">
                            <div className="space-y-5">
                                <Input
                                    label="Child's Name"
                                    placeholder="Enter their name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />

                                <Input
                                    label="Date of Birth"
                                    type="date"
                                    value={formData.date_of_birth}
                                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                                    required
                                />

                                <div>
                                    <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-2">
                                        Notes (optional)
                                    </label>
                                    <textarea
                                        placeholder="Any helpful context about your child (interests, challenges, personality traits...)"
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        rows={4}
                                        className="w-full px-4 py-3 rounded-2xl bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 text-warm-800 dark:text-warm-100 placeholder:text-warm-400 dark:placeholder:text-warm-500 focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all duration-200 resize-none"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="flex-1"
                                    onClick={closeModal}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="flex-1"
                                    disabled={isSaving || !formData.name || !formData.date_of_birth}
                                >
                                    {isSaving ? (
                                        <span className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Saving...
                                        </span>
                                    ) : (
                                        editingChild ? 'Save Changes' : 'Add Child'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default ChildrenPage;
