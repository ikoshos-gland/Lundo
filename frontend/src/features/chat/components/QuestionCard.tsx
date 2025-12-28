import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Brain, ChevronRight, Loader2 } from 'lucide-react';

interface QuestionCardProps {
  question: string;
  questionNumber: number;
  questionType: 'exploration' | 'deep';
  onSubmit: (answer: string) => void;
  isSubmitting: boolean;
}

export const QuestionCard = ({
  question,
  questionNumber,
  questionType,
  onSubmit,
  isSubmitting
}: QuestionCardProps) => {
  const [answer, setAnswer] = useState('');

  const isExploration = questionType === 'exploration';
  const Icon = isExploration ? Search : Brain;
  const title = isExploration ? 'Understanding Your Concern' : 'Going Deeper';
  const gradientFrom = isExploration ? 'from-blue-500' : 'from-purple-500';
  const gradientTo = isExploration ? 'to-indigo-500' : 'to-pink-500';

  const handleSubmit = () => {
    if (answer.trim() && !isSubmitting) {
      onSubmit(answer.trim());
      setAnswer('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-2xl my-6"
    >
      <div className={`rounded-3xl overflow-hidden shadow-xl border-2 border-transparent bg-gradient-to-br ${gradientFrom} ${gradientTo} p-[2px]`}>
        <div className="bg-white dark:bg-gray-900 rounded-[22px] p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${gradientFrom} ${gradientTo}`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                {title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Question {questionNumber} of 10
              </p>
            </div>
          </div>

          {/* Question */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 mb-4">
            <p className="text-gray-700 dark:text-gray-200 text-lg leading-relaxed">
              {question}
            </p>
          </div>

          {/* Answer Input */}
          <div className="space-y-3">
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Share your thoughts..."
              className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none outline-none"
              rows={4}
              disabled={isSubmitting}
            />

            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">
                Press Cmd/Ctrl + Enter to submit
              </p>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={!answer.trim() || isSubmitting}
                className={`py-3 px-6 rounded-xl font-medium text-white bg-gradient-to-r ${gradientFrom} ${gradientTo} shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[140px]`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Continue
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default QuestionCard;
