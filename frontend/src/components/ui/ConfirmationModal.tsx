import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import Button from './Button';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDangerous?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDangerous = false
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-warm-900/60 dark:bg-warm-950/80 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative w-full max-w-md bg-white dark:bg-warm-900 rounded-3xl shadow-2xl border border-warm-200 dark:border-warm-800 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-warm-100 dark:border-warm-800 flex items-center justify-between">
                            <h3 className="text-xl font-semibold text-warm-800 dark:text-warm-50 flex items-center gap-3">
                                {isDangerous && (
                                    <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                                        <AlertTriangle className="w-5 h-5" />
                                    </div>
                                )}
                                {title}
                            </h3>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl hover:bg-warm-100 dark:hover:bg-warm-800 text-warm-400 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-6">
                            <p className="text-warm-600 dark:text-warm-300 leading-relaxed">
                                {message}
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-5 bg-warm-50 dark:bg-warm-800/50 flex items-center justify-end gap-3">
                            <Button
                                variant="secondary"
                                onClick={onClose}
                            >
                                {cancelText}
                            </Button>
                            <Button
                                variant={isDangerous ? 'primary' : 'primary'}
                                onClick={() => {
                                    onConfirm();
                                    onClose();
                                }}
                                className={isDangerous ? '!bg-red-600 hover:!bg-red-700 shadow-red-500/20' : ''}
                            >
                                {confirmText}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmationModal;
