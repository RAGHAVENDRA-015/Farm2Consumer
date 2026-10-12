import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Upload, X, Loader2, Sparkles, Sprout } from 'lucide-react';
import { productService } from '../../services/product.service';
import { categoryService } from '../../services/category.service';
import { uploadService } from '../../services/upload.service';
import { useToast } from '../../contexts/ToastContext';
import { ProductUnit } from '../../types';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';

export const AddEditProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [unit, setUnit] = useState<ProductUnit>('KG');
  const [stockQuantity, setStockQuantity] = useState<number>(10);
  const [minOrderQuantity, setMinOrderQuantity] = useState<number>(1);
  const [isOrganic, setIsOrganic] = useState(false);
  const [images, setImages] = useState<{ imageUrl: string; cloudinaryPublicId?: string | null }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getCategories(),
  });

  // Fetch product if editing
  const { data: product } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productService.getProductById(id!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (product) {
      setName(product.name);
      setCategoryId((product as any).category?.id || (product as any).categoryId || '');
      setDescription(product.description);
      setPrice(product.price);
      setUnit(product.unit);
      setStockQuantity(product.stockQuantity);
      setMinOrderQuantity((product as any).minimumOrderQuantity || (product as any).minOrderQuantity || 1);
      setIsOrganic(product.isOrganic);
      setImages(product.images || []);
    } else if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id);
    }
  }, [product, categories, categoryId]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const uploaded = await uploadService.uploadImage(file, 'farmlink/products');
      setImages((prev) => [
        ...prev,
        { imageUrl: uploaded.imageUrl, cloudinaryPublicId: uploaded.publicId },
      ]);
      success('Produce image uploaded successfully!');
    } catch (err: any) {
      error(err.message || 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      error('Please enter the produce name.');
      return;
    }
    if (!categoryId) {
      error('Please select a category.');
      return;
    }
    if (price <= 0) {
      error('Price must be greater than 0.');
      return;
    }

    // Default image if none uploaded
    const finalImages =
      images.length > 0
        ? images
        : [
            {
              imageUrl:
                'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&q=80&w=800',
              cloudinaryPublicId: null,
            },
          ];

    try {
      setIsSubmitting(true);

      if (isEditing) {
        await productService.updateProduct(id!, {
          name,
          categoryId,
          description,
          price,
          unit,
          stockQuantity,
          minOrderQuantity,
          isOrganic,
          images: finalImages,
        });
        success('Produce listing updated!');
      } else {
        await productService.createProduct({
          name,
          categoryId,
          description,
          price,
          unit,
          stockQuantity,
          minOrderQuantity,
          isOrganic,
          images: finalImages,
        });
        success('New harvest successfully listed!');
      }

      queryClient.invalidateQueries({ queryKey: ['farmer-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      navigate('/farmer/products');
    } catch (err: any) {
      error(err.message || 'Failed to save produce');
    } finally {
      setIsSubmitting(false);
    }
  };

  const unitOptions = [
    { label: 'Kilogram (kg)', value: 'KG' },
    { label: 'Gram (g)', value: 'GRAM' },
    { label: 'Piece / Item', value: 'PIECE' },
    { label: 'Dozen (12 pcs)', value: 'DOZEN' },
    { label: 'Bunch', value: 'BUNCH' },
    { label: 'Litre (L)', value: 'LITER' },
    { label: 'Pack', value: 'PACK' },
  ];

  const categoryOptions = categories.map((c) => ({
    label: c.name,
    value: c.id,
  }));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center gap-3">
        <Link
          to="/farmer/products"
          className="p-2 rounded-xl bg-white border border-gray-200 text-grayText hover:text-darkText transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-darkText">
            {isEditing ? 'Edit Produce Listing' : 'List New Harvest'}
          </h1>
          <p className="text-xs text-grayText">
            Provide details about your agricultural harvest to sell directly to consumers.
          </p>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl border border-gray-100 p-8 shadow-subtle space-y-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Input
            label="Produce Name"
            placeholder="e.g. Fresh Red Country Tomatoes"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Select
            label="Produce Category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            options={categoryOptions}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-darkText mb-1.5">
            Harvest Description & Farming Notes
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the freshness, taste profile, harvest date, and soil quality..."
            rows={3}
            className="w-full text-sm p-3.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-primary"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Input
            label="Price (₹)"
            type="number"
            min={1}
            value={price || ''}
            onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
            required
          />

          <Select
            label="Measurement Unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value as ProductUnit)}
            options={unitOptions}
          />

          <Input
            label="Available Stock"
            type="number"
            min={0}
            value={stockQuantity}
            onChange={(e) => setStockQuantity(parseFloat(e.target.value) || 0)}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-center">
          <Input
            label="Minimum Order Quantity"
            type="number"
            min={1}
            value={minOrderQuantity}
            onChange={(e) => setMinOrderQuantity(parseInt(e.target.value, 10) || 1)}
          />

          <div className="p-3.5 rounded-2xl bg-primary-50/50 border border-primary-100 mt-5">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isOrganic}
                onChange={(e) => setIsOrganic(e.target.checked)}
                className="w-5 h-5 text-primary accent-primary rounded"
              />
              <div>
                <span className="text-xs font-bold text-darkText block">
                  🌱 100% Certified Organic
                </span>
                <span className="text-[11px] text-grayText">
                  No artificial chemical fertilizers or pesticides used
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Cloudinary Image Upload Section */}
        <div className="space-y-3 pt-2">
          <label className="block text-xs font-semibold text-darkText">Produce Images</label>

          {/* Upload Drop Area */}
          <div className="flex flex-wrap gap-4 items-center">
            {images.map((img, idx) => (
              <div
                key={idx}
                className="relative w-24 h-24 rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 shrink-0"
              >
                <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-1 right-1 p-1 bg-white/80 hover:bg-white rounded-full text-red-500 shadow-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 hover:border-primary flex flex-col items-center justify-center cursor-pointer transition-colors text-center p-2 bg-gray-50/50 hover:bg-primary-50/30 shrink-0">
              {isUploading ? (
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              ) : (
                <>
                  <Upload className="w-5 h-5 text-grayText mb-1" />
                  <span className="text-[10px] font-semibold text-grayText">Upload Image</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          </div>
          <p className="text-[11px] text-grayText">
            Images are securely stored and optimized on Cloudinary.
          </p>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/farmer/products')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            leftIcon={<Sprout className="w-4 h-4" />}
          >
            {isEditing ? 'Save Produce Changes' : 'Publish Harvest'}
          </Button>
        </div>
      </form>
    </div>
  );
};
