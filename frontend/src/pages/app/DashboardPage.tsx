import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, MessageSquare, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useChildren } from '@/contexts/ChildrenContext';
import { ChildCard } from '@/components/app/ChildCard';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { children, isLoading } = useChildren();

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-warm-800 dark:text-warm-50 mb-2">
          Welcome back, {user?.full_name?.split(' ')[0]}!
        </h1>
        <p className="text-warm-600 dark:text-warm-400">
          Here's what's happening with your children
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link to="/app/children">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center">
                <Plus className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-warm-800 dark:text-warm-50">
                  Manage Children
                </h3>
                <p className="text-sm text-warm-600 dark:text-warm-400">
                  {children.length} {children.length === 1 ? 'child' : 'children'}
                </p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/app/chat">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-warm-800 dark:text-warm-50">
                  Start Conversation
                </h3>
                <p className="text-sm text-warm-600 dark:text-warm-400">
                  Get AI guidance
                </p>
              </div>
            </div>
          </Card>
        </Link>

        <Card className="opacity-60 cursor-not-allowed">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-warm-800 dark:text-warm-50">
                View Insights
              </h3>
              <p className="text-sm text-warm-600 dark:text-warm-400">
                Coming soon
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Children */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-warm-800 dark:text-warm-50">
            Your Children
          </h2>
          {children.length > 0 && (
            <Link to="/app/children">
              <Button variant="outline">View All</Button>
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : children.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-warm-100 dark:bg-warm-800 mb-4">
                <Plus className="h-8 w-8 text-warm-400 dark:text-warm-600" />
              </div>
              <h3 className="text-xl font-semibold text-warm-800 dark:text-warm-50 mb-2">
                No children added yet
              </h3>
              <p className="text-warm-600 dark:text-warm-400 mb-6">
                Add your first child to get started
              </p>
              <Link to="/app/children">
                <Button variant="primary" className="inline-flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add Child
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {children.slice(0, 3).map((child) => (
              <ChildCard key={child.id} child={child} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
