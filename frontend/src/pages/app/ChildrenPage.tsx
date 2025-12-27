import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useChildren } from '@/contexts/ChildrenContext';
import { ChildCard } from '@/components/app/ChildCard';
import { ChildForm } from '@/components/app/ChildForm';
import { Modal } from '@/components/shared/Modal';
import { Button } from '@/components/shared/Button';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ChildCreate, ChildUpdate } from '@/types';

export const ChildrenPage: React.FC = () => {
  const { children, isLoading, createChild } = useChildren();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateChild = async (data: ChildCreate | ChildUpdate) => {
    await createChild(data as ChildCreate);
    setIsModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-warm-800 dark:text-warm-50 mb-2">
            Children
          </h1>
          <p className="text-warm-600 dark:text-warm-400">
            Manage your children's profiles
          </p>
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add Child
        </Button>
      </div>

      {/* Children Grid */}
      {children.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-warm-100 dark:bg-warm-800 mb-4">
            <Plus className="h-8 w-8 text-warm-400 dark:text-warm-600" />
          </div>
          <h3 className="text-xl font-semibold text-warm-800 dark:text-warm-50 mb-2">
            No children added yet
          </h3>
          <p className="text-warm-600 dark:text-warm-400 mb-6">
            Add your first child to get started
          </p>
          <Button
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add Child
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {children.map((child) => (
            <ChildCard key={child.id} child={child} />
          ))}
        </div>
      )}

      {/* Add Child Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Child"
      >
        <ChildForm
          onSubmit={handleCreateChild}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};
