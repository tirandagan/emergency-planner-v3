/**
 * Custom hook for managing all modal states
 *
 * Consolidates 12+ modal states into a single hook for easier management.
 * Extracts ~80 lines of modal state management from main component.
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import type { Product, MasterItem, Category } from "@/lib/products-types";

export interface UseModalStateReturn {
  // Product edit modal
  isModalOpen: boolean;
  editingProduct: Product | null;
  openProductEdit: (product: Product | null) => void;
  closeProductEdit: () => void;

  // Master item modal
  isMasterItemModalOpen: boolean;
  editingMasterItem: MasterItem | null;
  targetCategoryForMasterItem: Category | null;
  openMasterItemEdit: (masterItem: MasterItem | null, category?: Category | null) => void;
  closeMasterItemEdit: () => void;

  // Choice modal (Amazon vs Manual)
  isChoiceModalOpen: boolean;
  openChoiceModal: () => void;
  closeChoiceModal: () => void;

  // Amazon search modal
  isAmazonSearchModalOpen: boolean;
  openAmazonSearch: () => void;
  closeAmazonSearch: () => void;

  // Bulk supplier modal
  isBulkSupplierModalOpen: boolean;
  bulkSupplierId: string;
  setBulkSupplierId: (id: string) => void;
  openBulkSupplierModal: () => void;
  closeBulkSupplierModal: () => void;

  // Category change modal
  isCategoryModalOpen: boolean;
  categoryModalProduct: Product | null;
  categoryModalCategory: string;
  setCategoryModalCategory: (id: string) => void;
  categoryModalSubCategory: string;
  setCategoryModalSubCategory: (id: string) => void;
  categoryModalMasterItem: string;
  setCategoryModalMasterItem: (id: string) => void;
  openCategoryModal: (product?: Product | null) => void;
  closeCategoryModal: () => void;

  // Pre-selected categories (for new product)
  preSelectedCategory: string;
  setPreSelectedCategory: (id: string) => void;
  preSelectedSubCategory: string;
  setPreSelectedSubCategory: (id: string) => void;
  preSelectedMasterItem: string;
  setPreSelectedMasterItem: (id: string) => void;

  // Paste confirmation modal
  pasteConfirmModal: { targetMasterItem: MasterItem } | null;
  openPasteConfirm: (masterItem: MasterItem) => void;
  closePasteConfirm: () => void;

  // Utility
  isAnyModalOpen: boolean;
}

/**
 * Manages all modal states
 *
 * @returns Object containing all modal states and handlers
 */
export function useModalState(): UseModalStateReturn {
  // Product edit modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const openProductEdit = useCallback((product: Product | null): void => {
    setEditingProduct(product);
    setIsModalOpen(true);
  }, []);

  const closeProductEdit = useCallback((): void => {
    setEditingProduct(null);
    setIsModalOpen(false);
  }, []);

  // Master item modal
  const [isMasterItemModalOpen, setIsMasterItemModalOpen] = useState(false);
  const [editingMasterItem, setEditingMasterItem] = useState<MasterItem | null>(null);
  const [targetCategoryForMasterItem, setTargetCategoryForMasterItem] = useState<Category | null>(null);

  const openMasterItemEdit = useCallback((masterItem: MasterItem | null, category: Category | null = null): void => {
    setEditingMasterItem(masterItem);
    setTargetCategoryForMasterItem(category);
    setIsMasterItemModalOpen(true);
  }, []);

  const closeMasterItemEdit = useCallback((): void => {
    setEditingMasterItem(null);
    setTargetCategoryForMasterItem(null);
    setIsMasterItemModalOpen(false);
  }, []);

  // Choice modal
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);

  const openChoiceModal = useCallback((): void => {
    setIsChoiceModalOpen(true);
  }, []);

  const closeChoiceModal = useCallback((): void => {
    setIsChoiceModalOpen(false);
  }, []);

  // Amazon search modal
  const [isAmazonSearchModalOpen, setIsAmazonSearchModalOpen] = useState(false);

  const openAmazonSearch = useCallback((): void => {
    setIsAmazonSearchModalOpen(true);
  }, []);

  const closeAmazonSearch = useCallback((): void => {
    setIsAmazonSearchModalOpen(false);
  }, []);

  // Bulk supplier modal
  const [isBulkSupplierModalOpen, setIsBulkSupplierModalOpen] = useState(false);
  const [bulkSupplierId, setBulkSupplierId] = useState("");

  const openBulkSupplierModal = useCallback((): void => {
    setIsBulkSupplierModalOpen(true);
  }, []);

  const closeBulkSupplierModal = useCallback((): void => {
    setBulkSupplierId("");
    setIsBulkSupplierModalOpen(false);
  }, []);

  // Category change modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryModalProduct, setCategoryModalProduct] = useState<Product | null>(null);
  const [categoryModalCategory, setCategoryModalCategory] = useState("");
  const [categoryModalSubCategory, setCategoryModalSubCategory] = useState("");
  const [categoryModalMasterItem, setCategoryModalMasterItem] = useState("");

  const openCategoryModal = useCallback((product: Product | null = null): void => {
    setCategoryModalProduct(product);
    if (!product) {
      // Bulk mode - reset selections
      setCategoryModalCategory("");
      setCategoryModalSubCategory("");
      setCategoryModalMasterItem("");
    }
    setIsCategoryModalOpen(true);
  }, []);

  const closeCategoryModal = useCallback((): void => {
    setCategoryModalProduct(null);
    setCategoryModalCategory("");
    setCategoryModalSubCategory("");
    setCategoryModalMasterItem("");
    setIsCategoryModalOpen(false);
  }, []);

  // Pre-selected categories (for new product)
  const [preSelectedCategory, setPreSelectedCategory] = useState("");
  const [preSelectedSubCategory, setPreSelectedSubCategory] = useState("");
  const [preSelectedMasterItem, setPreSelectedMasterItem] = useState("");

  // Paste confirmation modal
  const [pasteConfirmModal, setPasteConfirmModal] = useState<{ targetMasterItem: MasterItem } | null>(null);

  const openPasteConfirm = useCallback((masterItem: MasterItem): void => {
    setPasteConfirmModal({ targetMasterItem: masterItem });
  }, []);

  const closePasteConfirm = useCallback((): void => {
    setPasteConfirmModal(null);
  }, []);

  // Check if any modal is open
  const isAnyModalOpen = useMemo(() => {
    return isModalOpen ||
           isMasterItemModalOpen ||
           isChoiceModalOpen ||
           isAmazonSearchModalOpen ||
           isBulkSupplierModalOpen ||
           isCategoryModalOpen ||
           pasteConfirmModal !== null;
  }, [isModalOpen, isMasterItemModalOpen, isChoiceModalOpen, isAmazonSearchModalOpen, isBulkSupplierModalOpen, isCategoryModalOpen, pasteConfirmModal]);

  return {
    // Product edit modal
    isModalOpen,
    editingProduct,
    openProductEdit,
    closeProductEdit,

    // Master item modal
    isMasterItemModalOpen,
    editingMasterItem,
    targetCategoryForMasterItem,
    openMasterItemEdit,
    closeMasterItemEdit,

    // Choice modal
    isChoiceModalOpen,
    openChoiceModal,
    closeChoiceModal,

    // Amazon search modal
    isAmazonSearchModalOpen,
    openAmazonSearch,
    closeAmazonSearch,

    // Bulk supplier modal
    isBulkSupplierModalOpen,
    bulkSupplierId,
    setBulkSupplierId,
    openBulkSupplierModal,
    closeBulkSupplierModal,

    // Category change modal
    isCategoryModalOpen,
    categoryModalProduct,
    categoryModalCategory,
    setCategoryModalCategory,
    categoryModalSubCategory,
    setCategoryModalSubCategory,
    categoryModalMasterItem,
    setCategoryModalMasterItem,
    openCategoryModal,
    closeCategoryModal,

    // Pre-selected categories
    preSelectedCategory,
    setPreSelectedCategory,
    preSelectedSubCategory,
    setPreSelectedSubCategory,
    preSelectedMasterItem,
    setPreSelectedMasterItem,

    // Paste confirmation modal
    pasteConfirmModal,
    openPasteConfirm,
    closePasteConfirm,

    // Utility
    isAnyModalOpen,
  };
}
