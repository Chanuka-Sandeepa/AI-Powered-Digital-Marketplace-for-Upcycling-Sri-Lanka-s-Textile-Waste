import React, { useState, useEffect } from 'react';
import { Search, Plus, MapPin } from 'lucide-react';
import API from '../services/api.js';
import type { Material, User } from '../types/index.js';

interface FeaturedMaterialsProps {
  user: User | null;
  onLoginPrompt: () => void;
  onMaterialSelect: (material: Material) => void;
}

const FeaturedMaterials: React.FC<FeaturedMaterialsProps> = ({ user, onLoginPrompt, onMaterialSelect }) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  
  // Create listing form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    category: 'Cotton',
    condition: 'Clean',
    quantity: '',
    price: '',
    location: '',
    description: '',
    imageUrl: ''
  });

  const categories = ['All', 'Cotton', 'Denim', 'Polyester'];

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const params: any = {};
      if (category !== 'All') params.category = category;
      if (search) params.search = search;

      const response = await API.get('/materials', { params });
      setMaterials(response.data || []);
    } catch (error) {
      console.error('Failed to load materials from the backend', error);
      setMaterials([]);
      setLoadError('Could not load marketplace listings right now. Please try again shortly.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [category, search]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!user) {
      onLoginPrompt();
      return;
    }

    if (!formData.title || !formData.quantity || !formData.price || !formData.location || !formData.description) {
      setFormError('Please fill out all required fields.');
      return;
    }

    const imgUrlFallback = formData.imageUrl || 
      (formData.category === 'Cotton' ? 'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?auto=format&fit=crop&w=600&q=80' :
       formData.category === 'Denim' ? 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=600&q=80' :
       'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=600&q=80');

    try {
      const response = await API.post('/materials', {
        ...formData,
        imageUrl: imgUrlFallback,
        quantity: parseFloat(formData.quantity),
        price: parseFloat(formData.price)
      });

      setFormSuccess('Listing created successfully!');
      setFormData({
        title: '',
        category: 'Cotton',
        condition: 'Clean',
        quantity: '',
        price: '',
        location: '',
        description: '',
        imageUrl: ''
      });
      
      // Add the new material to list
      setMaterials(prev => [response.data, ...prev]);
      
      setTimeout(() => {
        setShowAddForm(false);
        setFormSuccess('');
      }, 2000);

    } catch (error: any) {
      console.error('Error creating listing', error);
      setFormError(error?.response?.data?.message || 'Failed to create listing. Please try again.');
    }
  };

  return (
    <section id="marketplace" className="w-full bg-white py-20">
      <div className="w-full w-full px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Available and ready</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">Featured Materials</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-zinc-500">
            Browse through quality textile waste items listed by certified garment manufacturers.
          </p>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-6">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`rounded-full px-4 py-2 text-xs font-medium transition-all ${
                  category === cat
                    ? 'bg-zinc-950 text-white shadow-sm'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search bar & Add Button */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-grow sm:w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search materials..."
                className="w-full rounded-full border border-gray-200 py-2 pl-9 pr-4 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <button
              onClick={() => {
                if (!user) {
                  onLoginPrompt();
                } else {
                  setShowAddForm(!showAddForm);
                }
              }}
              className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>List Material</span>
            </button>
          </div>
        </div>

        {/* Create Listing Form (Toggled Modal-style or in-line drop) */}
        {showAddForm && (
          <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/20 p-6 md:p-8 animate-in fade-in slide-in-from-top-4 duration-300">
            <h3 className="text-lg font-bold text-zinc-900 mb-6">List Textile Waste Material</h3>
            
            {formError && <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs text-red-600 font-medium">{formError}</div>}
            {formSuccess && <div className="mb-4 rounded-lg bg-emerald-100 p-3 text-xs text-emerald-800 font-semibold">{formSuccess}</div>}

            <form onSubmit={handleAddSubmit} className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Cotton Shredded Mix"
                  className="w-full rounded-lg border border-gray-200 p-2.5 text-xs bg-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-200 p-2.5 text-xs bg-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Cotton">Cotton</option>
                    <option value="Denim">Denim</option>
                    <option value="Polyester">Polyester</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2">Condition</label>
                  <input
                    type="text"
                    name="condition"
                    value={formData.condition}
                    onChange={handleInputChange}
                    placeholder="e.g. Shredded, Unsorted"
                    className="w-full rounded-lg border border-gray-200 p-2.5 text-xs bg-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2">Quantity (kg) *</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    placeholder="e.g. 500"
                    className="w-full rounded-lg border border-gray-200 p-2.5 text-xs bg-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2">Price per kg (LKR) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="e.g. 150"
                    className="w-full rounded-lg border border-gray-200 p-2.5 text-xs bg-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2">Location *</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g. Colombo, Sri Lanka"
                  className="w-full rounded-lg border border-gray-200 p-2.5 text-xs bg-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2">Description *</label>
                <textarea
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the textile waste details, source garment facility, contaminants if any..."
                  className="w-full rounded-lg border border-gray-200 p-2.5 text-xs bg-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2">Image URL (Optional)</label>
                <input
                  type="text"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  placeholder="Leave blank for automatic category default image"
                  className="w-full rounded-lg border border-gray-200 p-2.5 text-xs bg-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="rounded-lg border border-gray-200 px-5 py-2.5 text-xs font-semibold text-zinc-600 bg-white hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 shadow-sm"
                >
                  Publish Listing
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Listings Grid */}
        {loading ? (
          <div className="mt-16 flex justify-center items-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
          </div>
        ) : loadError ? (
          <div className="mt-16 text-center py-12 border border-dashed border-red-200 rounded-2xl bg-red-50/40">
            <p className="text-sm font-medium text-red-600">{loadError}</p>
          </div>
        ) : materials.length === 0 ? (
          <div className="mt-16 text-center py-12 border border-dashed border-gray-200 rounded-2xl">
            <p className="text-sm font-medium text-zinc-500">No textile materials found matching your criteria.</p>
          </div>
        ) : (
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {materials.map((item) => (
              <div
                key={item._id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md hover-lift transition-all"
              >
                {/* Product Image */}
                <div className="relative h-48 w-full overflow-hidden bg-zinc-100">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold text-zinc-950 uppercase tracking-wider backdrop-blur-sm shadow-sm">
                    {item.category}
                  </div>
                </div>

                {/* Card Info */}
                <div className="flex flex-grow flex-col p-5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex rounded-full bg-zinc-50 border border-zinc-100 px-2.5 py-0.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                      {item.condition}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-medium text-zinc-400">
                      <MapPin className="h-3 w-3 text-zinc-300" />
                      {item.location.split(',')[0]}
                    </span>
                  </div>

                  <h3 className="mt-3 text-base font-bold text-zinc-950 leading-tight">
                    {item.title}
                  </h3>

                  <div className="mt-4 grid grid-cols-2 border-t border-b border-gray-50 py-3 text-xs text-zinc-500">
                    <div>
                      <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Quantity</p>
                      <p className="font-bold text-zinc-900 mt-0.5">{item.quantity.toLocaleString()} kg</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Price</p>
                      <p className="font-bold text-zinc-900 mt-0.5">LKR {item.price}/kg</p>
                    </div>
                  </div>

                  <div className="mt-5 pt-1">
                    <button
                      onClick={() => onMaterialSelect(item)}
                      className="w-full rounded-full border border-zinc-200 bg-white py-2 text-center text-xs font-semibold text-zinc-800 hover:border-zinc-300 hover:bg-zinc-50 transition-all duration-200"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
};

export default FeaturedMaterials;
