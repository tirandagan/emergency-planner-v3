"use client";

import React, { useEffect, useState } from 'react';
import { ShoppingCart, Star, Truck, ExternalLink, Loader2, Construction } from 'lucide-react';
import { db } from '@/lib/db';
import { Product } from '@/types';

const Store: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'HOUSE_KIT' | 'AFFILIATE'>('ALL');

  useEffect(() => {
    const fetchGear = async () => {
      setLoading(true);
      const data = await db.getProducts();
      setProducts(data);
      setLoading(false);
    };
    fetchGear();
  }, []);

  const filteredProducts = filter === 'ALL'
    ? products
    : products.filter(p => p.type === filter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-background min-h-screen">
      <div className="bg-warning/10 border border-warning/50 rounded-lg p-4 mb-8 flex items-center gap-4">
        <Construction className="w-8 h-8 text-warning flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-warning-foreground text-lg">Under Construction</h3>
          <p className="text-muted-foreground">The marketplace is currently being developed. Inventory and checkout features are in beta preview.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-border pb-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Emergency Supplies</h2>
          <p className="text-muted-foreground mt-2">Curated emergency preparedness gear and kits.</p>
        </div>
        <div className="flex gap-4 mt-4 md:mt-0">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-4 py-2 rounded-lg transition-colors ${filter === 'ALL' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
          >
            All Items
          </button>
          <button
            onClick={() => setFilter('HOUSE_KIT')}
            className={`px-4 py-2 rounded-lg border transition-colors ${filter === 'HOUSE_KIT' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-primary border-primary hover:bg-primary/10'}`}
          >
            Official Kits
          </button>
          <button
            onClick={() => setFilter('AFFILIATE')}
            className={`px-4 py-2 rounded-lg transition-colors ${filter === 'AFFILIATE' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
          >
            Recommended
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-card border border-border rounded-xl overflow-hidden group hover:border-primary/50 hover:shadow-lg transition-all flex flex-col">
              <div className="relative h-48 overflow-hidden bg-muted">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500 opacity-90 group-hover:opacity-100" />
                {product.type === 'HOUSE_KIT' && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded flex items-center gap-1 shadow-md">
                    <Star className="w-3 h-3 fill-current" /> OFFICIAL KIT
                  </div>
                )}
                {product.type === 'AFFILIATE' && (
                  <div className="absolute top-2 right-2 bg-secondary text-secondary-foreground border border-border text-xs font-medium px-2 py-1 rounded shadow-sm">
                    PARTNER
                  </div>
                )}
              </div>
              <div className="p-4 flex flex-col flex-grow">
                <div className="mb-2">
                  <span className="text-xs text-muted-foreground uppercase font-medium tracking-wide">{product.category}</span>
                  <h3 className="text-lg font-semibold text-card-foreground leading-tight">{product.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">{product.description}</p>

                <div className="mt-auto flex items-center justify-between pt-4 border-t border-border">
                  <span className="text-xl font-bold text-card-foreground">${product.price}</span>
                  {product.type === 'HOUSE_KIT' ? (
                    <button className="flex items-center justify-center gap-2 bg-success hover:bg-success/90 text-success-foreground px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
                      <Truck className="w-4 h-4" /> Ship Now
                    </button>
                  ) : (
                    <a
                      href={product.affiliateLink || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" /> Check Price
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-16 bg-gradient-to-r from-muted to-card border border-border rounded-2xl p-8 lg:p-12 text-center relative overflow-hidden shadow-lg">
        <div className="relative z-10">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Can&rsquo;t Find What You Need?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Our AI can search other marketplaces to find specific emergency gear or specialized equipment for your preparedness needs.
          </p>
          <button className="px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-md">
            Search Marketplace
          </button>
        </div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 to-transparent pointer-events-none"></div>
      </div>
    </div>
  );
};

export default Store;
