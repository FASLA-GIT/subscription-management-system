import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Trash2, 
  Search, 
  Layers, 
  Tag, 
  DollarSign, 
  FileText, 
  Check 
} from 'lucide-react';
import { ProductService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';

export default function Products() {
  const { isAdmin, isStaff } = useAuth();
  const { announce } = useAccessibility();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'software',
    sales_price: '',
    cost_price: '',
    notes: '',
    variants: [],
  });

  // Variant sub-form state
  const [variantName, setVariantName] = useState('');
  const [variantPrice, setVariantPrice] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setLoading(true);
      const data = await ProductService.getAll();
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleAddVariant = () => {
    if (!variantName.trim()) return;
    const newVariant = {
      id: Date.now(),
      name: variantName.trim(),
      additional_price: Number(variantPrice) || 0,
    };
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, newVariant],
    }));
    setVariantName('');
    setVariantPrice('');
    announce(`Added variant ${newVariant.name}`);
  };

  const handleRemoveVariant = (id) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter(v => v.id !== id),
    }));
    announce('Variant removed');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.sales_price) return;

    await ProductService.create({
      ...formData,
      sales_price: Number(formData.sales_price),
      cost_price: Number(formData.cost_price || 0),
    });

    setIsModalOpen(false);
    setFormData({
      name: '',
      type: 'software',
      sales_price: '',
      cost_price: '',
      notes: '',
      variants: [],
    });
    announce('New product created successfully');
    loadProducts();
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                          p.notes?.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || p.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#111D35] tracking-tight">
            Products & Variants Catalog
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Define recurring software products, add-on modules and pricing tiers.
          </p>
        </div>

        {isStaff && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            aria-label="Create a new product"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-[#1677F8] hover:bg-[#0A5CD6] text-white shadow-sm hover:shadow-[#1677F8]/25 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Add New Product</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3.5 rounded-2xl border border-[#E2E8F0] shadow-card edge-lighting">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search products by title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search products"
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#F5F7FB] border border-[#E2E8F0] rounded-xl text-[#111D35] focus-visible:ring-2 focus-visible:ring-[#1677F8]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label htmlFor="type-filter" className="text-xs font-semibold text-[#64748B] whitespace-nowrap">
            Filter by:
          </label>
          <select
            id="type-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs bg-[#F5F7FB] border border-[#E2E8F0] rounded-xl px-3 py-2 font-semibold text-[#111D35] focus-visible:ring-2 focus-visible:ring-[#1677F8]"
          >
            <option value="all">All Product Types</option>
            <option value="software">Software</option>
            <option value="addon">Add-on Module</option>
            <option value="service">Service & SLA</option>
          </select>
        </div>
      </div>

      {/* Products List / Grid */}
      {loading ? (
        <div className="text-center py-12 text-sm text-slate-500">Loading catalog...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300 p-8">
          <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No products found</p>
          <p className="text-xs text-slate-500 mt-1">Try modifying your search or click 'Add New Product'.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((prod) => (
            <Card key={prod.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-slate-100 text-slate-700 mb-1">
                      {prod.type}
                    </span>
                    <h2 className="text-base font-bold text-slate-900 leading-tight">
                      {prod.name}
                    </h2>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-sky-700">
                      ₹{Number(prod.sales_price).toLocaleString('en-IN')}
                    </p>
                    <p className="text-[10px] text-slate-400">Base Unit Price</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2">
                  {prod.notes || 'No description provided.'}
                </p>

                {/* Variants List */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
                    <Layers className="w-3.5 h-3.5 text-sky-600" />
                    <span>Variants & Add-ons ({prod.variants?.length || 0})</span>
                  </div>

                  {(!prod.variants || prod.variants.length === 0) ? (
                    <p className="text-[11px] text-slate-400 italic">No variants configured (uses standard base price).</p>
                  ) : (
                    <ul className="space-y-1.5" aria-label={`Variants for ${prod.name}`}>
                      {prod.variants.map((v) => (
                        <li 
                          key={v.id} 
                          className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-100"
                        >
                          <span className="font-medium text-slate-800">{v.name}</span>
                          <span className="font-bold text-emerald-700">
                            +₹{Number(v.additional_price).toLocaleString('en-IN')}
                            <span className="text-[10px] font-normal text-slate-500 ml-1">
                              (Total: ₹{(Number(prod.sales_price) + Number(v.additional_price)).toLocaleString('en-IN')})
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Cost Price: ₹{Number(prod.cost_price || 0).toLocaleString('en-IN')}</span>
                <span className="text-emerald-600 font-semibold">
                  Margin: {prod.sales_price > 0 ? Math.round(((prod.sales_price - (prod.cost_price || 0)) / prod.sales_price) * 100) : 0}%
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Product"
        subtitle="Create a new subscription product with optional custom variants"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="prod-name" className="block text-xs font-bold text-slate-700 mb-1">
              Product Name *
            </label>
            <input
              id="prod-name"
              type="text"
              required
              placeholder="e.g. Business Software Cloud"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus-visible:ring-2 focus-visible:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="prod-type" className="block text-xs font-bold text-slate-700 mb-1">
                Type
              </label>
              <select
                id="prod-type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus-visible:ring-2 focus-visible:ring-sky-500"
              >
                <option value="software">Software</option>
                <option value="addon">Add-on</option>
                <option value="service">Service SLA</option>
              </select>
            </div>

            <div>
              <label htmlFor="prod-sales-price" className="block text-xs font-bold text-slate-700 mb-1">
                Sales Price (₹) *
              </label>
              <input
                id="prod-sales-price"
                type="number"
                min="0"
                step="0.01"
                required
                placeholder="2000"
                value={formData.sales_price}
                onChange={(e) => setFormData({ ...formData, sales_price: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus-visible:ring-2 focus-visible:ring-sky-500"
              />
            </div>

            <div>
              <label htmlFor="prod-cost-price" className="block text-xs font-bold text-slate-700 mb-1">
                Cost Price (₹)
              </label>
              <input
                id="prod-cost-price"
                type="number"
                min="0"
                step="0.01"
                placeholder="800"
                value={formData.cost_price}
                onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus-visible:ring-2 focus-visible:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="prod-notes" className="block text-xs font-bold text-slate-700 mb-1">
              Description / Notes
            </label>
            <textarea
              id="prod-notes"
              rows={2}
              placeholder="Features, licensing details, and capabilities..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus-visible:ring-2 focus-visible:ring-sky-500"
            />
          </div>

          {/* Variants builder section */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Product Variants (e.g. Odoo Edition)</span>
              <span className="text-[11px] text-slate-500">Optional</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                placeholder="Variant name (e.g. Odoo Pack)"
                value={variantName}
                onChange={(e) => setVariantName(e.target.value)}
                aria-label="Variant name"
                className="w-full sm:flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
              />
              <input
                type="number"
                placeholder="Addl. Price (₹560)"
                value={variantPrice}
                onChange={(e) => setVariantPrice(e.target.value)}
                aria-label="Additional price"
                className="w-full sm:w-32 px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
              />
              <button
                type="button"
                onClick={handleAddVariant}
                className="w-full sm:w-auto px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-white hover:bg-slate-900"
              >
                Add Variant
              </button>
            </div>

            {formData.variants.length > 0 && (
              <div className="space-y-1.5 pt-2">
                {formData.variants.map((v) => (
                  <div key={v.id} className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs">
                    <span className="font-semibold text-slate-800">{v.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-700 font-bold">+₹{v.additional_price}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(v.id)}
                        aria-label={`Remove variant ${v.name}`}
                        className="text-rose-500 hover:text-rose-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs"
            >
              Save Product
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

