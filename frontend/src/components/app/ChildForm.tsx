import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Child, ChildCreate, ChildUpdate } from '@/types';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';

const childSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  date_of_birth: z.string().refine((date) => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime()) && parsed < new Date();
  }, { message: 'Invalid date or future date' }),
  gender: z.string().optional(),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
});

type ChildFormData = z.infer<typeof childSchema>;

interface ChildFormProps {
  child?: Child;
  onSubmit: (data: ChildCreate | ChildUpdate) => Promise<void>;
  onCancel: () => void;
}

export const ChildForm: React.FC<ChildFormProps> = ({ child, onSubmit, onCancel }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChildFormData>({
    resolver: zodResolver(childSchema),
    defaultValues: child ? {
      name: child.name,
      date_of_birth: child.date_of_birth,
      gender: child.gender || '',
      notes: child.notes || '',
    } : undefined,
  });

  const handleFormSubmit = async (data: ChildFormData) => {
    setIsLoading(true);
    setApiError(null);

    try {
      await onSubmit(data);
    } catch (error: any) {
      setApiError(error.response?.data?.detail || 'Failed to save child');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {apiError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{apiError}</p>
        </div>
      )}

      <Input
        label="Child's Name *"
        type="text"
        placeholder="Emma"
        error={errors.name?.message}
        {...register('name')}
      />

      <Input
        label="Date of Birth *"
        type="date"
        error={errors.date_of_birth?.message}
        {...register('date_of_birth')}
      />

      <div>
        <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1.5">
          Gender (Optional)
        </label>
        <select
          {...register('gender')}
          className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-warm-900 border-2 border-warm-300 dark:border-warm-700 text-warm-800 dark:text-warm-50 focus:outline-none focus:ring-2 focus:ring-accent transition-all duration-200"
        >
          <option value="">Prefer not to say</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        {errors.gender && (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
            {errors.gender.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1.5">
          Notes (Optional)
        </label>
        <textarea
          {...register('notes')}
          rows={4}
          placeholder="Any important information about your child..."
          className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-warm-900 border-2 border-warm-300 dark:border-warm-700 text-warm-800 dark:text-warm-50 placeholder-warm-400 dark:placeholder-warm-600 focus:outline-none focus:ring-2 focus:ring-accent transition-all duration-200 resize-none"
        />
        {errors.notes && (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
            {errors.notes.message}
          </p>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          className="flex-1"
        >
          {child ? 'Update Child' : 'Add Child'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};
