import { motion } from 'framer-motion';

interface ExplorationProgressProps {
  currentQuestion: number;
  totalQuestions?: number;
  phase: 'exploration' | 'deep';
}

export const ExplorationProgress = ({
  currentQuestion,
  totalQuestions = 10,
  phase
}: ExplorationProgressProps) => {
  // Calculate which dots are filled
  const explorationFilled = phase === 'exploration' ? currentQuestion : 5;
  const deepFilled = phase === 'deep' ? currentQuestion - 5 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50"
    >
      <div className="bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center gap-4">
        {/* Phase label */}
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
          {phase === 'exploration' ? 'Exploring' : 'Deep Dive'}
        </span>

        <div className="w-px h-4 bg-gray-200 dark:bg-gray-600" />

        {/* Exploration dots (1-5) */}
        <div className="flex gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <motion.div
              key={`exp-${i}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                i < explorationFilled
                  ? 'bg-blue-500'
                  : 'bg-gray-200 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>

        <div className="w-px h-4 bg-gray-200 dark:bg-gray-600" />

        {/* Deep dots (6-10) */}
        <div className="flex gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <motion.div
              key={`deep-${i}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: (i + 5) * 0.05 }}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                i < deepFilled
                  ? 'bg-purple-500'
                  : 'bg-gray-200 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>

        <div className="w-px h-4 bg-gray-200 dark:bg-gray-600" />

        {/* Progress text */}
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {currentQuestion} / {totalQuestions}
        </span>
      </div>
    </motion.div>
  );
};

export default ExplorationProgress;
