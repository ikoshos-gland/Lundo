import api from './api';
import { Pattern, TimelineEvent, Intervention, MemorySummary, SearchResult } from '@/types';

export const memoryService = {
  async getSummary(childId: number): Promise<MemorySummary> {
    const response = await api.get<MemorySummary>(`/children/${childId}/summary`);
    return response.data;
  },

  async getPatterns(childId: number): Promise<Pattern[]> {
    const response = await api.get<Pattern[]>(`/children/${childId}/patterns`);
    return response.data;
  },

  async getTimeline(childId: number): Promise<TimelineEvent[]> {
    const response = await api.get<TimelineEvent[]>(`/children/${childId}/timeline`);
    return response.data;
  },

  async getInterventions(childId: number): Promise<Intervention[]> {
    const response = await api.get<Intervention[]>(`/children/${childId}/interventions`);
    return response.data;
  },

  async getMemories(childId: number): Promise<any[]> {
    const response = await api.get<any[]>(`/children/${childId}/memories`);
    return response.data;
  },

  async search(childId: number, query: string): Promise<SearchResult[]> {
    const response = await api.post<SearchResult[]>(
      `/children/${childId}/search`,
      { query }
    );
    return response.data;
  },
};
