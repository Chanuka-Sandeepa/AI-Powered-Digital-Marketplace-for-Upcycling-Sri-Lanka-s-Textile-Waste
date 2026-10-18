
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, MapPin } from 'lucide-react';
import API from '../services/api.js';
import type { Material, User } from '../types/index.js';

interface FeaturedMaterialsProps {
  user: User | null;
  onLoginPrompt: () => void;
  onMaterialSelect: (material: Material) => void;
}

interface MaterialFormData {
  title: string;
  category: string;
  condition: string;
  quantity: string;
  price: string;
  location: string;
  description: string;
  imageUrl: string;
}

const initialFormData: MaterialFormData = {
  title: '',
  category: 'Cotton',
  condition: 'Clean',
  quantity: '',
  price: '',
  location: '',
  description: '',
  imageUrl: '',
};

const categories = ['All', 'Cotton', 'Denim', 'Polyester'];

const FeaturedMaterials: React.FC<FeaturedMaterialsProps> = ({
  user,
  onLoginPrompt,
  onMaterialSelect,
}) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const [showAddForm, setShowAddForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formData, setFormData] =
    useState<MaterialFormData>(initialFormData);

  const fetchMaterials = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError('');

      const params: Record<string, string> = {};

      if (category !== 'All') {
        params.category = category;
      }

      if (search.trim()) {
        params.search = search.trim();
      }

      const response = await API.get('/materials', { params });

      // Support either a direct array or a wrapped API response.
      const responseData = response.data;
      const fetchedMaterials: Material[] = Array.isArray(responseData)
        ? responseData
        : Array.isArray(responseData?.materials)
          ? responseData.materials
          : Array.isArray(responseData?.data)
            ? responseData.data
            : [];

      // Show only available listings, newest first, with a maximum of eight.
      const sortedMaterials = fetchedMaterials
        .filter((material) => material.status === 'available')
        .sort((a, b) => {
          const dateA = new Date(
            (a as Material & { createdAt?: string }).createdAt || 0
          ).getTime();

          const dateB = new Date(
            (b as Material & { createdAt?: string }).createdAt || 0
          ).getTime();

          return dateB - dateA;
        })
        .slice(0, 6);

      setMaterials(sortedMaterials);
    } catch (error) {
      console.error('Failed to load marketplace materials:', error);
      setMaterials([]);
      setLoadError(
        'Could not load marketplace listings right now. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  useEffect(() => {
    void fetchMaterials();
  }, [fetchMaterials]);

  const handleInputChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleAddSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!user) {
      onLoginPrompt();
      return;
    }

    if (
      !formData.title.trim() ||
      !formData.quantity ||
      !formData.price ||
      !formData.location.trim() ||
      !formData.description.trim()
    ) {
      setFormError('Please fill out all required fields.');
      return;
    }

    const quantity = Number(formData.quantity);
    const price = Number(formData.price);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setFormError('Quantity must be greater than zero.');
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setFormError('Please enter a valid price.');
      return;
    }

    const defaultImage =
      formData.category === 'Cotton'
        ? 'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?auto=format&fit=crop&w=600&q=80'
        : formData.category === 'Denim'
          ? 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=600&q=80'
          : 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=600&q=80';

    try {
      setSubmitting(true);

      const response = await API.post('/materials', {
        ...formData,
        title: formData.title.trim(),
        location: formData.location.trim(),
        description: formData.description.trim(),
        imageUrl: formData.imageUrl.trim() || defaultImage,
        quantity,
        price,
      });

      const createdMaterial: Material =
        response.data?.material || response.data?.data || response.data;

      setFormSuccess('Listing created successfully!');
      setFormData({ ...initialFormData });

      // Put the new listing at the top immediately.
      if (createdMaterial?._id) {
        setMaterials((previous) => [
          createdMaterial,
          ...previous.filter(
            (item) => item._id !== createdMaterial._id
          ),
        ]);
      }

      // Refresh from the database to keep the list in sync.
      await fetchMaterials();

      setShowAddForm(false);
      setFormSuccess('');
    } catch (error: any) {
      console.error('Error creating marketplace listing:', error);

      setFormError(
        error?.response?.data?.message ||
          'Failed to create listing. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="marketplace" className="w-full bg-gradient-to-b from-cyan-50/70 via-white to-emerald-50/50 py-20">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
            Available and ready
          </p>

          <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Featured Materials
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm text-zinc-500">
            Browse through quality textile waste items listed by certified
            garment manufacturers.
          </p>
        </div>

        {/* Search and Category Filters */}
        <div className="mt-12 flex flex-col gap-4 border-b border-gray-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`rounded-full px-4 py-2 text-xs font-medium transition-all ${
                  category === cat
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-sm shadow-emerald-200'
                    : 'bg-white text-zinc-600 ring-1 ring-cyan-100 hover:bg-cyan-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-grow sm:w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                <Search className="h-4 w-4" />
              </span>

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search materials..."
                aria-label="Search materials"
                className="w-full rounded-full border border-gray-200 py-2 pl-9 pr-4 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                if (!user) {
                  onLoginPrompt();
                  return;
                }

                setFormError('');
                setFormSuccess('');
                setShowAddForm((previous) => !previous);
              }}
              className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              <span>List Material</span>
            </button>
          </div>
        </div>

        {/* Add Material Form */}
        {showAddForm && (
          <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/20 p-6 animate-in fade-in slide-in-from-top-4 duration-300 md:p-8">
            <h3 className="mb-6 text-lg font-bold text-zinc-900">
              List Textile Waste Material
            </h3>

            {formError && (
              <div
                role="alert"
                className="mb-4 rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600"
              >
                {formError}
              </div>
            )}

            {formSuccess && (
              <div
                role="status"
                className="mb-4 rounded-lg bg-emerald-100 p-3 text-xs font-semibold text-emerald-800"
              >
                {formSuccess}
              </div>
            )}

            <form
              onSubmit={handleAddSubmit}
              className="grid gap-6 md:grid-cols-2"
            >
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Cotton Shredded Mix"
                  className="w-full rounded-lg border border-gray-200 bg-white p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-200 bg-white p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Cotton">Cotton</option>
                    <option value="Denim">Denim</option>
                    <option value="Polyester">Polyester</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                    Condition
                  </label>
                  <input
                    type="text"
                    name="condition"
                    value={formData.condition}
                    onChange={handleInputChange}
                    placeholder="e.g. Clean"
                    className="w-full rounded-lg border border-gray-200 bg-white p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                    Quantity (kg) *
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    required
                    min="0.01"
                    step="any"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    placeholder="e.g. 500"
                    className="w-full rounded-lg border border-gray-200 bg-white p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                    Price per kg (LKR) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    required
                    min="0"
                    step="any"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="e.g. 150"
                    className="w-full rounded-lg border border-gray-200 bg-white p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                  Location *
                </label>
                <input
                  type="text"
                  name="location"
                  required
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g. Colombo, Sri Lanka"
                  className="w-full rounded-lg border border-gray-200 bg-white p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                  Description *
                </label>
                <textarea
                  name="description"
                  required
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the textile waste, source, and any contaminants..."
                  className="w-full rounded-lg border border-gray-200 bg-white p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                  Image URL (Optional)
                </label>
                <input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-gray-200 bg-white p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="mt-4 flex justify-end gap-3 md:col-span-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setShowAddForm(false)}
                  className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? 'Publishing...' : 'Publish Listing'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Marketplace Listings */}
        {loading ? (
          <div className="mt-16 flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
          </div>
        ) : loadError ? (
          <div className="mt-16 rounded-2xl border border-dashed border-red-200 bg-red-50/40 py-12 text-center">
            <p className="text-sm font-medium text-red-600">{loadError}</p>
            <button
              type="button"
              onClick={() => void fetchMaterials()}
              className="mt-4 rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        ) : materials.length === 0 ? (
          <div className="mt-16 rounded-2xl border border-dashed border-gray-200 py-12 text-center">
            <p className="text-sm font-medium text-zinc-500">
              No textile materials found matching your criteria.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-8 flex items-center justify-between text-xs text-zinc-500">
              <p>
                Showing {materials.length}{' '}
                {materials.length === 1 ? 'listing' : 'listings'}
              </p>
              <button
                type="button"
                onClick={() => void fetchMaterials()}
                className="font-semibold text-emerald-700 hover:text-emerald-800"
              >
                Refresh listings
              </button>
            </div>

            <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {materials.map((item, index) => (
                <article
                  key={item._id}
                  className={`group flex flex-col overflow-hidden rounded-2xl border border-gray-100 border-t-4 bg-white shadow-sm transition-all hover:shadow-md hover-lift ${['border-t-emerald-400', 'border-t-cyan-400', 'border-t-amber-400', 'border-t-violet-400'][index % 4]}`}
                >
                  <div className="relative h-48 w-full overflow-hidden bg-zinc-100">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    <div className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-950 shadow-sm backdrop-blur-sm">
                      {item.category}
                    </div>
                  </div>

                  <div className="flex flex-grow flex-col p-5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex rounded-full border border-zinc-100 bg-zinc-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                        {item.condition}
                      </span>

                      <span className="flex items-center gap-1 text-[10px] font-medium text-zinc-400">
                        <MapPin className="h-3 w-3 text-zinc-300" />
                        {item.location?.split(',')[0] || 'Location unavailable'}
                      </span>
                    </div>

                    <h3 className="mt-3 text-base font-bold leading-tight text-zinc-950">
                      {item.title}
                    </h3>

                    <div className="mt-4 grid grid-cols-2 border-y border-gray-50 py-3 text-xs text-zinc-500">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                          Quantity
                        </p>
                        <p className="mt-0.5 font-bold text-zinc-900">
                          {Number(item.quantity).toLocaleString()} kg
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                          Price
                        </p>
                        <p className="mt-0.5 font-bold text-zinc-900">
                          LKR {Number(item.price).toLocaleString()}/kg
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 pt-1">
                      <button
                        type="button"
                        onClick={() => onMaterialSelect(item)}
                        className="w-full rounded-full border border-zinc-200 bg-white py-2 text-center text-xs font-semibold text-zinc-800 transition-all duration-200 hover:border-zinc-300 hover:bg-zinc-50"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default FeaturedMaterials;
