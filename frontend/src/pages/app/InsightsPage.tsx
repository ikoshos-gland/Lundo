import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TrendingUp, Calendar, Lightbulb, ArrowLeft } from 'lucide-react';
import { useChildren } from '@/contexts/ChildrenContext';
import { memoryService } from '@/services/memoryService';
import { handleApiError } from '@/services/api';
import { Pattern, TimelineEvent, Intervention } from '@/types';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { formatDate } from '@/utils/dateFormatter';

export const InsightsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { children } = useChildren();
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'patterns' | 'timeline' | 'interventions'>('patterns');

  const childId = Number(id);
  const child = children.find(c => c.id === childId);

  useEffect(() => {
    if (childId) {
      fetchInsights();
    }
  }, [childId]);

  const fetchInsights = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [patternsData, timelineData, interventionsData] = await Promise.all([
        memoryService.getPatterns(childId),
        memoryService.getTimeline(childId),
        memoryService.getInterventions(childId),
      ]);
      setPatterns(patternsData);
      setTimeline(timelineData);
      setInterventions(interventionsData);
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!child) {
    return (
      <div className="text-center py-12">
        <p className="text-warm-600 dark:text-warm-400">Child not found</p>
        <Button variant="outline" onClick={() => navigate('/app/children')} className="mt-4">
          Back to Children
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="outline"
          onClick={() => navigate('/app/children')}
          className="mb-4 inline-flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-4xl font-bold text-warm-800 dark:text-warm-50 mb-2">
          Insights for {child.name}
        </h1>
        <p className="text-warm-600 dark:text-warm-400">
          Behavioral patterns, timeline, and effective interventions
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-warm-200 dark:border-warm-800">
        <button
          onClick={() => setActiveTab('patterns')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'patterns'
              ? 'border-accent text-accent'
              : 'border-transparent text-warm-600 dark:text-warm-400 hover:text-warm-800 dark:hover:text-warm-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Patterns
          </div>
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'timeline'
              ? 'border-accent text-accent'
              : 'border-transparent text-warm-600 dark:text-warm-400 hover:text-warm-800 dark:hover:text-warm-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Timeline
          </div>
        </button>
        <button
          onClick={() => setActiveTab('interventions')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'interventions'
              ? 'border-accent text-accent'
              : 'border-transparent text-warm-600 dark:text-warm-400 hover:text-warm-800 dark:hover:text-warm-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Interventions
          </div>
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <Button variant="outline" onClick={fetchInsights} className="mt-4">
              Try Again
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {activeTab === 'patterns' && (
            <div className="space-y-4">
              {patterns.length === 0 ? (
                <Card>
                  <div className="text-center py-12">
                    <TrendingUp className="h-12 w-12 text-warm-400 dark:text-warm-600 mx-auto mb-4" />
                    <p className="text-warm-600 dark:text-warm-400">
                      No behavioral patterns identified yet
                    </p>
                    <p className="text-sm text-warm-500 dark:text-warm-500 mt-2">
                      Have more conversations to identify patterns
                    </p>
                  </div>
                </Card>
              ) : (
                patterns.map((pattern) => (
                  <Card key={pattern.id}>
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="h-5 w-5 text-accent" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-warm-800 dark:text-warm-50 mb-1">
                          {pattern.pattern_type}
                        </h3>
                        <p className="text-sm text-warm-600 dark:text-warm-400 mb-2">
                          {pattern.description}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs text-warm-500 dark:text-warm-500">
                          <span className="px-2 py-1 rounded-full bg-warm-100 dark:bg-warm-800">
                            {pattern.frequency}
                          </span>
                          <span>First observed: {formatDate(pattern.first_observed)}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-4">
              {timeline.length === 0 ? (
                <Card>
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-warm-400 dark:text-warm-600 mx-auto mb-4" />
                    <p className="text-warm-600 dark:text-warm-400">
                      No timeline events yet
                    </p>
                  </div>
                </Card>
              ) : (
                timeline.map((event) => (
                  <Card key={event.id}>
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-warm-800 dark:text-warm-50 mb-1">
                          {event.title}
                        </h3>
                        <p className="text-sm text-warm-600 dark:text-warm-400 mb-2">
                          {event.description}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs text-warm-500 dark:text-warm-500">
                          {event.category && (
                            <span className="px-2 py-1 rounded-full bg-warm-100 dark:bg-warm-800 capitalize">
                              {event.category}
                            </span>
                          )}
                          <span>{formatDate(event.occurred_at)}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {activeTab === 'interventions' && (
            <div className="space-y-4">
              {interventions.length === 0 ? (
                <Card>
                  <div className="text-center py-12">
                    <Lightbulb className="h-12 w-12 text-warm-400 dark:text-warm-600 mx-auto mb-4" />
                    <p className="text-warm-600 dark:text-warm-400">
                      No interventions recorded yet
                    </p>
                  </div>
                </Card>
              ) : (
                interventions.map((intervention) => (
                  <Card key={intervention.id}>
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <Lightbulb className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-warm-800 dark:text-warm-50 mb-1">
                          {intervention.strategy}
                        </h3>
                        <p className="text-sm text-warm-600 dark:text-warm-400 mb-2">
                          {intervention.description}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs text-warm-500 dark:text-warm-500">
                          <span className={`px-2 py-1 rounded-full ${
                            intervention.effectiveness === 'very_effective'
                              ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                              : intervention.effectiveness === 'somewhat_effective'
                              ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                              : 'bg-warm-100 dark:bg-warm-800'
                          }`}>
                            {intervention.effectiveness.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
