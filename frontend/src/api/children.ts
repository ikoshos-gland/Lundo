import api from './api';

// Types for children - matching backend schema
export interface Child {
    id: number;
    name: string;
    date_of_birth: string;
    gender?: string;
    notes?: string;
    age_years: number;
    created_at: string;
    updated_at: string;
}

export interface ChildCreate {
    name: string;
    date_of_birth: string;
    gender?: string;
    notes?: string;
}

export interface ChildUpdate {
    name?: string;
    date_of_birth?: string;
    gender?: string;
    notes?: string;
}

// Children API functions
export const childrenApi = {
    /**
     * Get all children for the current user
     */
    getAll: async (): Promise<Child[]> => {
        const response = await api.get<Child[]>('/children');
        return response.data;
    },

    /**
     * Get a single child by ID
     */
    getById: async (id: number): Promise<Child> => {
        const response = await api.get<Child>(`/children/${id}`);
        return response.data;
    },

    /**
     * Create a new child
     */
    create: async (data: ChildCreate): Promise<Child> => {
        const response = await api.post<Child>('/children', data);
        return response.data;
    },

    /**
     * Update a child
     */
    update: async (id: number, data: ChildUpdate): Promise<Child> => {
        const response = await api.put<Child>(`/children/${id}`, data);
        return response.data;
    },

    /**
     * Delete a child
     */
    delete: async (id: number): Promise<void> => {
        await api.delete(`/children/${id}`);
    },
};

export default childrenApi;
