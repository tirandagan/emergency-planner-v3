"use client";

import { useState, useEffect } from 'react';
import { Loader2, Check, X, Link as LinkIcon, RefreshCw, Edit2, Save, Trash2 } from 'lucide-react';
import { getPendingMasterItems, approveMasterItem, rejectMasterItem, getScrapedQueue, processScrapedItem, triggerBatchScraping, clearScrapedQueue } from '../actions';

// Modal Component
const Modal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel", isDestructive = false }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                <p className="text-gray-300 mb-6">{message}</p>
                <div className="flex gap-3 justify-end">
                    <button 
                        onClick={onCancel}
                        className="px-4 py-2 rounded font-medium text-gray-300 hover:bg-gray-700 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button 
                        onClick={onConfirm}
                        className={`px-4 py-2 rounded font-bold text-white transition-colors ${isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

interface EditingItem {
    id: string;
    title: string;
    price: string;
    image: string;
    url: string;
    asin: string;
}

export default function AdminDashboard() {
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [scrapedQueue, setScrapedQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null);

  // Modal State
  const [modalConfig, setModalConfig] = useState<{
      isOpen: boolean;
      title: string;
      message: string;
      onConfirm: () => void;
      isDestructive?: boolean;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const showModal = (title: string, message: string, onConfirm: () => void, isDestructive = false) => {
      setModalConfig({ isOpen: true, title, message, onConfirm, isDestructive });
  };

  const closeModal = () => {
      setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  const fetchAll = async () => {
    setLoading(true);
    const [pending, scraped] = await Promise.all([
        getPendingMasterItems(),
        getScrapedQueue()
    ]);
    setPendingItems(pending);
    setScrapedQueue(scraped);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleApprove = async (id: string) => {
    const success = await approveMasterItem(id);
    if (success) fetchAll();
  };

  const handleReject = async (id: string) => {
    showModal(
        "Delete Master Item", 
        "Are you sure you want to delete this pending item?", 
        async () => {
            const success = await rejectMasterItem(id);
            if (success) fetchAll();
            closeModal();
        },
        true
    );
  };

  const startEditing = (item: any) => {
      setEditingItem({
          id: item.id,
          title: item.scraped_title || '',
          price: '0', 
          image: item.scraped_image || '',
          url: item.url,
          asin: item.detected_ids?.asin || ''
      });
  };

  const saveEditing = async (item: any) => {
      if (!editingItem) return;
      
      const data = {
          master_item_id: item.master_item_id,
          title: editingItem.title,
          description: 'Imported from scrape (Admin Edited)',
          image: editingItem.image,
          asin: editingItem.asin,
          source: 'Scraper/Admin',
          price: parseFloat(editingItem.price) || 0,
          url: editingItem.url
      };

      const success = await processScrapedItem(item.id, 'approve', data);
      if (success) {
          setEditingItem(null);
          fetchAll();
      }
  };

  const cancelEditing = () => {
      setEditingItem(null);
  };

  const handleScrapedAction = async (id: string, action: 'approve' | 'reject', item?: any) => {
      if (action === 'approve' && item && !editingItem) {
          if (!item.scraped_title || item.scraped_title === 'Unknown Product') {
              startEditing(item);
              return;
          }
      }

      const data = item ? {
          master_item_id: item.master_item_id,
          title: item.scraped_title || 'Unknown',
          description: 'Imported from scrape',
          image: item.scraped_image,
          asin: item.detected_ids?.asin,
          source: 'Scraper',
          price: 0,
          url: item.url
      } : undefined;

      const success = await processScrapedItem(id, action, data);
      if (success) fetchAll();
  };

  const handleTriggerScrape = async () => {
      showModal(
          "Trigger Batch Scraping",
          "This will search for products for all active master items that lack specific products. It may take some time.",
          async () => {
            closeModal();
            setScraping(true);
            const res = await triggerBatchScraping();
            alert(res.message); // Using alert for result message is acceptable, or could create toast
            setScraping(false);
            fetchAll();
          }
      );
  };

  const handleClearQueue = async () => {
      showModal(
          "Clear Scraped Queue",
          "Are you sure you want to delete ALL pending items in the scraped queue? This cannot be undone.",
          async () => {
              const success = await clearScrapedQueue();
              if (success) fetchAll();
              closeModal();
          },
          true
      );
  };

  return (
    <div className="w-full text-white">
      <Modal 
        isOpen={modalConfig.isOpen} 
        title={modalConfig.title} 
        message={modalConfig.message} 
        onConfirm={modalConfig.onConfirm} 
        onCancel={closeModal}
        isDestructive={modalConfig.isDestructive}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
            <span className="text-tactical-accent">Approvals</span> & Queue
        </h1>
        
        <button 
            onClick={handleTriggerScrape}
            disabled={scraping}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {scraping ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {scraping ? 'Scraping...' : 'Find Products (Batch)'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Master Items */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Loader2 className="w-5 h-5 text-yellow-500" />
            Pending Master Items ({pendingItems.length})
          </h2>
          
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {loading && pendingItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : pendingItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">All items reviewed.</div>
            ) : (
              pendingItems.map(item => (
                <div key={item.id} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{item.name}</h3>
                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">{item.description}</p>
                    <div className="text-xs text-gray-600 mt-2 font-mono">{item.id}</div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button 
                      onClick={() => handleApprove(item.id)}
                      className="p-2 bg-green-900/30 hover:bg-green-900/50 text-green-400 border border-green-800 rounded transition-colors"
                      title="Approve"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleReject(item.id)}
                      className="p-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-800 rounded transition-colors"
                      title="Reject/Delete"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Scraped Queue */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-blue-500" />
                Scraped Product Queue ({scrapedQueue.length})
            </h2>
            {scrapedQueue.length > 0 && (
                <button 
                    onClick={handleClearQueue}
                    className="text-xs flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors"
                >
                    <Trash2 className="w-3 h-3" /> Clear Queue
                </button>
            )}
          </div>
          
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
             {loading && scrapedQueue.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : scrapedQueue.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Queue empty.</div>
            ) : (
              scrapedQueue.map(item => {
                  const isEditing = editingItem && editingItem.id === item.id;
                  
                  return (
                <div key={item.id} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                  <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 mr-2">
                        <div className="text-xs text-blue-400 mb-1">
                            For: {item.master_items?.name || 'Unknown Item'}
                        </div>
                        
                        {isEditing ? (
                            <div className="space-y-2 mb-2">
                                <input 
                                    type="text" 
                                    value={editingItem.title}
                                    onChange={e => setEditingItem({...editingItem, title: e.target.value})}
                                    className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                                    placeholder="Product Title"
                                />
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={editingItem.price}
                                        onChange={e => setEditingItem({...editingItem, price: e.target.value})}
                                        className="w-24 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                                        placeholder="Price"
                                    />
                                    <input 
                                        type="text" 
                                        value={editingItem.image}
                                        onChange={e => setEditingItem({...editingItem, image: e.target.value})}
                                        className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                                        placeholder="Image URL"
                                    />
                                </div>
                                <input 
                                        type="text" 
                                        value={editingItem.url}
                                        onChange={e => setEditingItem({...editingItem, url: e.target.value})}
                                        className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-gray-400"
                                        placeholder="Purchase URL"
                                />
                            </div>
                        ) : (
                            <>
                                <h3 className="font-bold text-white truncate w-full" title={item.scraped_title}>
                                    {item.scraped_title || 'No Title Found'}
                                </h3>
                                <a href={item.url} target="_blank" rel="noreferrer" className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 mt-1 break-all">
                                    <LinkIcon className="w-3 h-3 shrink-0" /> {item.url}
                                </a>
                            </>
                        )}
                      </div>
                      {(item.scraped_image || (isEditing && editingItem.image)) && (
                          <img 
                            src={isEditing ? editingItem.image : item.scraped_image} 
                            alt="Scraped" 
                            className="w-12 h-12 object-cover rounded border border-gray-700 shrink-0 bg-gray-800"
                            onError={(e) => (e.currentTarget.style.display = 'none')} 
                          />
                      )}
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                    {isEditing ? (
                        <>
                            <button 
                                onClick={() => saveEditing(item)}
                                className="flex-1 py-2 bg-green-900/30 hover:bg-green-900/50 text-green-400 border border-green-800 rounded text-xs font-bold transition-colors flex items-center justify-center gap-2"
                            >
                                <Save className="w-3 h-3" /> SAVE & ADD
                            </button>
                            <button 
                                onClick={cancelEditing}
                                className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 border border-gray-600 rounded text-xs font-bold transition-colors"
                            >
                                CANCEL
                            </button>
                        </>
                    ) : (
                        <>
                            <button 
                                onClick={() => startEditing(item)}
                                className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600 rounded text-xs font-bold transition-colors"
                                title="Edit Details"
                            >
                                <Edit2 className="w-3 h-3" />
                            </button>
                            <button 
                                onClick={() => handleScrapedAction(item.id, 'approve', item)}
                                className="flex-1 py-2 bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 border border-blue-800 rounded text-xs font-bold transition-colors flex items-center justify-center gap-2"
                            >
                                <Check className="w-3 h-3" /> ADD
                            </button>
                            <button 
                                onClick={() => handleScrapedAction(item.id, 'reject')}
                                className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 border border-gray-600 rounded text-xs font-bold transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </>
                    )}
                  </div>
                </div>
              )})
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



