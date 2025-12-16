"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { Product } from '@/types';
import { Trash2, Plus, Save, Package, Loader2 } from 'lucide-react';

const AdminPanel: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    type: 'AFFILIATE',
    rating: 5.0,
    image: 'https://images.unsplash.com/photo-1516937941348-c09645f31e88?q=80&w=2670&auto=format&fit=crop'
  });

  const refresh = async () => {
    setLoading(true);
    const data = await db.getProducts();
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to decommission this asset?')) {
      await db.deleteProduct(id);
      refresh();
    }
  };

  const handleSave = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.description) {
      alert('Missing required intelligence fields.');
      return;
    }
    try {
      await db.addProduct(newProduct as Omit<Product, 'id'>);
      setIsAdding(false);
      setNewProduct({
        type: 'AFFILIATE',
        rating: 5.0,
        image: 'https://images.unsplash.com/photo-1516937941348-c09645f31e88?q=80&w=2670&auto=format&fit=crop'
      });
      refresh();
    } catch (e) {
      alert('Failed to save asset. Check permissions.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-red-500 font-mono flex items-center gap-3">
            <Package className="h-8 w-8" />
            ADMIN COMMAND // LOGISTICS
          </h2>
          <p className="text-gray-400 mt-1">Manage inventory, affiliate links, and strategic assets.</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-tactical-accent text-black px-4 py-2 rounded font-bold hover:bg-yellow-400 transition-colors"
        >
          <Plus className="w-5 h-5" /> ADD ASSET
        </button>
      </div>

      {isAdding && (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 mb-8 shadow-2xl">
          <h3 className="text-xl font-bold text-white mb-4">New Asset Definition</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Asset Name</label>
              <input
                className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white"
                value={newProduct.name || ''}
                onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Price (USD)</label>
              <input
                type="number"
                className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white"
                value={newProduct.price || ''}
                onChange={e => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Category</label>
              <input
                className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white"
                value={newProduct.category || ''}
                onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                placeholder="e.g. Food, Water, Defense"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Logistics Type</label>
              <select
                className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white"
                value={newProduct.type}
                onChange={e => setNewProduct({ ...newProduct, type: e.target.value as any })}
              >
                <option value="AFFILIATE">Affiliate (Pass-through)</option>
                <option value="HOUSE_KIT">House Kit (Direct Sale)</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Description</label>
              <textarea
                className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white"
                rows={3}
                value={newProduct.description || ''}
                onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Image URL</label>
              <input
                className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white"
                value={newProduct.image || ''}
                onChange={e => setNewProduct({ ...newProduct, image: e.target.value })}
              />
            </div>
            {newProduct.type === 'AFFILIATE' && (
              <div className="md:col-span-2">
                <label className="block text-sm text-tactical-accent mb-1 font-bold">Affiliate Link</label>
                <input
                  className="w-full bg-gray-800 border border-tactical-accent rounded p-2 text-white"
                  value={newProduct.affiliateLink || ''}
                  placeholder="https://amazon.com/..."
                  onChange={e => setNewProduct({ ...newProduct, affiliateLink: e.target.value })}
                />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <button
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-green-700 text-white px-6 py-2 rounded font-bold hover:bg-green-600"
            >
              <Save className="w-4 h-4" /> Save Asset
            </button>
          </div>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden min-h-[300px]">
        {loading ? (
          <div className="flex justify-center items-center h-full pt-12">
            <Loader2 className="w-10 h-10 text-tactical-accent animate-spin" />
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-800 text-gray-400 text-sm uppercase">
              <tr>
                <th className="px-6 py-4">Asset</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-gray-800/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={p.image} className="w-10 h-10 rounded object-cover" />
                      <span className="font-bold text-white">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${p.type === 'HOUSE_KIT' ? 'bg-tactical-accent text-black' : 'bg-gray-700 text-gray-300'}`}>
                      {p.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-300 font-mono">${p.price}</td>
                  <td className="px-6 py-4 text-gray-400">{p.category}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-red-500 hover:text-red-400 p-2"
                      title="Decommission"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && products.length === 0 && (
          <div className="p-8 text-center text-gray-500">No assets in database.</div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
