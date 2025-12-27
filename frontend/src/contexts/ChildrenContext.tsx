import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { childService } from '@/services/childService';
import { handleApiError } from '@/services/api';
import { Child, ChildCreate, ChildUpdate } from '@/types';
import { useAuth } from './AuthContext';

interface ChildrenState {
  children: Child[];
  selectedChild: Child | null;
  isLoading: boolean;
  error: string | null;
}

interface ChildrenContextType extends ChildrenState {
  setSelectedChild: (child: Child | null) => void;
  fetchChildren: () => Promise<void>;
  createChild: (data: ChildCreate) => Promise<Child>;
  updateChild: (id: number, data: ChildUpdate) => Promise<Child>;
  deleteChild: (id: number) => Promise<void>;
  refreshChildren: () => Promise<void>;
}

const ChildrenContext = createContext<ChildrenContextType | undefined>(undefined);

export const ChildrenProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [state, setState] = useState<ChildrenState>({
    children: [],
    selectedChild: null,
    isLoading: false,
    error: null,
  });

  const fetchChildren = async () => {
    if (!isAuthenticated) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await childService.getAll();
      setState(prev => ({
        ...prev,
        children: data,
        isLoading: false,
      }));
    } catch (error) {
      const apiError = handleApiError(error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: apiError.message,
      }));
    }
  };

  const createChild = async (data: ChildCreate): Promise<Child> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const newChild = await childService.create(data);
      setState(prev => ({
        ...prev,
        children: [...prev.children, newChild],
        isLoading: false,
      }));
      return newChild;
    } catch (error) {
      const apiError = handleApiError(error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: apiError.message,
      }));
      throw error;
    }
  };

  const updateChild = async (id: number, data: ChildUpdate): Promise<Child> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const updatedChild = await childService.update(id, data);
      setState(prev => ({
        ...prev,
        children: prev.children.map(child =>
          child.id === id ? updatedChild : child
        ),
        selectedChild: prev.selectedChild?.id === id ? updatedChild : prev.selectedChild,
        isLoading: false,
      }));
      return updatedChild;
    } catch (error) {
      const apiError = handleApiError(error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: apiError.message,
      }));
      throw error;
    }
  };

  const deleteChild = async (id: number): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await childService.delete(id);
      setState(prev => ({
        ...prev,
        children: prev.children.filter(child => child.id !== id),
        selectedChild: prev.selectedChild?.id === id ? null : prev.selectedChild,
        isLoading: false,
      }));
    } catch (error) {
      const apiError = handleApiError(error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: apiError.message,
      }));
      throw error;
    }
  };

  const setSelectedChild = (child: Child | null) => {
    setState(prev => ({ ...prev, selectedChild: child }));
  };

  const refreshChildren = fetchChildren;

  // Fetch children when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchChildren();
    } else {
      // Clear children when logged out
      setState({
        children: [],
        selectedChild: null,
        isLoading: false,
        error: null,
      });
    }
  }, [isAuthenticated]);

  return (
    <ChildrenContext.Provider
      value={{
        ...state,
        setSelectedChild,
        fetchChildren,
        createChild,
        updateChild,
        deleteChild,
        refreshChildren,
      }}
    >
      {children}
    </ChildrenContext.Provider>
  );
};

export const useChildren = () => {
  const context = useContext(ChildrenContext);
  if (!context) {
    throw new Error('useChildren must be used within a ChildrenProvider');
  }
  return context;
};
