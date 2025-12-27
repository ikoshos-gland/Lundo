import React from 'react';
import { Link } from 'react-router-dom';
import { User, Calendar, TrendingUp } from 'lucide-react';
import { Child, calculateAge } from '@/types';
import { Card } from '@/components/shared/Card';
import { formatRelativeTime } from '@/utils/dateFormatter';

interface ChildCardProps {
  child: Child;
}

export const ChildCard: React.FC<ChildCardProps> = ({ child }) => {
  const age = calculateAge(child.date_of_birth);

  return (
    <Link to={`/app/children/${child.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="h-16 w-16 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
            <User className="h-8 w-8 text-accent" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-warm-800 dark:text-warm-50 mb-1">
              {child.name}
            </h3>

            <div className="flex items-center gap-4 text-sm text-warm-600 dark:text-warm-400 mb-3">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {age} years old
              </span>
              {child.gender && (
                <span className="text-warm-500 dark:text-warm-500">•</span>
              )}
              {child.gender && <span className="capitalize">{child.gender}</span>}
            </div>

            {child.notes && (
              <p className="text-sm text-warm-600 dark:text-warm-400 line-clamp-2 mb-3">
                {child.notes}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 mt-2">
              <Link
                to={`/app/children/${child.id}/insights`}
                onClick={(e) => e.stopPropagation()}
                className="text-xs px-3 py-1.5 rounded-lg bg-warm-100 dark:bg-warm-800 text-warm-700 dark:text-warm-300 hover:bg-warm-200 dark:hover:bg-warm-700 transition-colors flex items-center gap-1"
              >
                <TrendingUp className="h-3 w-3" />
                View Insights
              </Link>
              <span className="text-xs text-warm-500 dark:text-warm-500">
                Updated {formatRelativeTime(child.updated_at)}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};
