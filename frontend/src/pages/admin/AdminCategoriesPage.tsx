import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Tags } from 'lucide-react';
import { categoryService } from '../../services/category.service';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';

export const AdminCategoriesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => categoryService.getCategories(),
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; imageUrl?: string }) =>
      categoryService.createCategory(data),
    onSuccess: () => {
      success('Category created successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsModalOpen(false);
      setName('');
      setDescription('');
      setImageUrl('');
    },
    onError: (err: any) => error(err.message || 'Failed to create category'),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createCategoryMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-darkText">Produce Categories</h1>
          <p className="text-xs text-grayText">Manage marketplace classifications and icons</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Category
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          ))
        ) : categories.length > 0 ? (
          categories.map((c) => (
            <div
              key={c.id}
              className="bg-white p-5 rounded-2xl border border-gray-100 shadow-subtle flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary flex items-center justify-center font-bold text-lg shrink-0">
                  {c.imageUrl ? (
                    <img src={c.imageUrl} alt="" className="w-8 h-8 object-contain" />
                  ) : (
                    <Tags className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-darkText text-sm">{c.name}</h3>
                  <p className="text-xs text-grayText mt-0.5 line-clamp-2">
                    {c.description || 'Agricultural classification'}
                  </p>
                  <p className="text-[11px] text-primary-700 font-semibold mt-2">
                    {c._count?.products ?? 0} active listings
                  </p>
                </div>
              </div>

              <Badge variant={c.isActive ? 'green' : 'gray'} size="sm">
                {c.isActive ? 'Active' : 'Hidden'}
              </Badge>
            </div>
          ))
        ) : (
          <div className="col-span-3 text-center py-12 text-xs text-grayText">
            No categories defined yet.
          </div>
        )}
      </div>

      {/* Add Category Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Category">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Category Name"
            placeholder="e.g. Exotic Fruits"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div>
            <label className="block text-xs font-semibold text-darkText mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Fresh regional produce description..."
              rows={2}
              className="w-full text-xs p-3 rounded-xl border border-gray-200 outline-none focus:border-primary"
            />
          </div>
          <Input
            label="Icon / Image URL (HTTPS)"
            placeholder="https://..."
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={createCategoryMutation.isPending}
          >
            Create Category
          </Button>
        </form>
      </Modal>
    </div>
  );
};
