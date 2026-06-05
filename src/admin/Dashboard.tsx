/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Building, ShieldCheck, Users, Box, TrendingUp, AlertCircle, Edit3, Save, 
  Handshake, DollarSign, ListOrdered, ToggleLeft, ToggleRight, Check, CheckCircle2, RefreshCw,
  Plus, Trash2, Sparkles, Search, ClipboardList, Clock, Truck, X, FileText, Phone, User, HelpCircle, Layers
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell 
} from 'recharts';
import { StaffUser, StoreConfig, Product, Order, DebtRecord, Language, CustomCategory } from '../types';

interface DashboardProps {
  language: Language;
  currentUser: StaffUser;
  authToken: string;
  onConfigChanged: (newConfig: StoreConfig) => void;
  currentConfig: StoreConfig;
  categories?: CustomCategory[];
  onCategoriesChanged?: (categories: CustomCategory[]) => void;
}

export default function Dashboard({
  language,
  currentUser,
  authToken,
  onConfigChanged,
  currentConfig,
  categories = [],
  onCategoriesChanged
}: DashboardProps) {
  // Tabs: 'ANALYTICS' | 'SETTINGS' | 'INVENTORY' | 'STAFF' | 'DEBTS' | 'ORDERS'
  const [activeTab, setActiveTab] = useState<'ANALYTICS' | 'SETTINGS' | 'INVENTORY' | 'STAFF' | 'DEBTS' | 'ORDERS'>('ANALYTICS');

  // Server state datasets
  const [config, setConfig] = useState<StoreConfig>(currentConfig);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [debts, setDebts] = useState<DebtRecord[]>([]);
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [inventoryForm, setInventoryForm] = useState<{ priceYER: number; stock: number; isAvailable: boolean }>({ priceYER: 0, stock: 0, isAvailable: true });
  
  // Enhanced Form states for full Product CRUD
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [fullEditingProduct, setFullEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<{
    id: string;
    nameAR: string;
    nameEN: string;
    descriptionAR: string;
    descriptionEN: string;
    category: string;
    brand: string;
    priceYER: number;
    imageUrl: string;
    isAvailable: boolean;
    stock: number;
    rechargeAmount: string;
  }>({
    id: '',
    nameAR: '',
    nameEN: '',
    descriptionAR: '',
    descriptionEN: '',
    category: categories[0]?.id || 'PHYSICAL_GROCERY',
    brand: '',
    priceYER: 1000,
    imageUrl: '',
    isAvailable: true,
    stock: 50,
    rechargeAmount: ''
  });
  
  // Custom Categories CRUD UI states
  const [inventorySubTab, setInventorySubTab] = useState<'PRODUCTS' | 'CATEGORIES'>('PRODUCTS');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [fullEditingCategory, setFullEditingCategory] = useState<CustomCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState<{
    id: string;
    nameAR: string;
    nameEN: string;
    icon: string;
    color: string;
  }>({
    id: '',
    nameAR: '',
    nameEN: '',
    icon: 'Layers',
    color: 'from-slate-900 to-slate-955'
  });

  // Interactive Product Table States
  const [adminProductSearch, setAdminProductSearch] = useState('');
  const [adminProductCategoryFilter, setAdminProductCategoryFilter] = useState('ALL');
  const [adminProductSort, setAdminProductSort] = useState<{ field: 'name' | 'price' | 'stock' | 'none'; direction: 'asc' | 'desc' }>({
    field: 'none',
    direction: 'asc'
  });
  
  const [newDebtName, setNewDebtName] = useState('');
  const [newDebtPhone, setNewDebtPhone] = useState('');
  const [newDebtAmount, setNewDebtAmount] = useState(0);
  const [newDebtNotes, setNewDebtNotes] = useState('');

  // Sub-tabs for ANALYTICS main view
  const [analyticsSubTab, setAnalyticsSubTab] = useState<'LEDGER' | 'GROWTH'>('LEDGER');

  // Ledger configuration filters
  const [selectedCashierOffice, setSelectedCashierOffice] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | 'COMPLETED' | 'PENDING'>('ALL');
  const [selectedPeriodFilter, setSelectedPeriodFilter] = useState<'ACTIVE_SHIFT' | 'ALL_TIME'>('ACTIVE_SHIFT');
  const [excludeArchivedPast, setExcludeArchivedPast] = useState<boolean>(true);

  // Matched orders tracking to move them to "رصيد تمت تسويته وتأكيده"
  const [matchedOrderIds, setMatchedOrderIds] = useState<string[]>([]);

  // High performance pagination states for massive speed-up on main table
  const [ledgerPage, setLedgerPage] = useState<number>(1);
  const LEDGER_PAGE_SIZE = 15;

  // Reset pagination on filter changes to keep safe state indexes
  useEffect(() => {
    setLedgerPage(1);
  }, [selectedCashierOffice, selectedStatusFilter, selectedPeriodFilter, excludeArchivedPast]);

  // RequestAnimationFrame scheduling helper to keep UI buttery smooth at high refresh rate
  const updateMatchedOrdersWithRAF = (newIds: string[] | ((prev: string[]) => string[])) => {
    requestAnimationFrame(() => {
      setMatchedOrderIds(newIds);
    });
  };

  // Automated simulation / interactive promotional campaign state
  const [simulationPromoPercent, setSimulationPromoPercent] = useState<number>(0);

  // Dynamic discrepancy engine cash entry
  const [actualRealCashOnHand, setActualRealCashOnHand] = useState<string>('');

  // Strategic hybrid manual/automatic inventory states
  const [inventoryMode, setInventoryMode] = useState<'AUTO' | 'MANUAL'>('AUTO');
  const [manualReadyCash, setManualReadyCash] = useState<string>('');
  const [manualPendingCash, setManualPendingCash] = useState<string>('');
  const [manualSettledCash, setManualSettledCash] = useState<string>('');
  const [manualExpectedLedger, setManualExpectedLedger] = useState<string>('');

  // Fetch all databases from Express backend
  const refreshAllData = async () => {
    setLoading(true);
    try {
      const [configRes, productsRes, ordersRes, debtsRes, categoriesRes] = await Promise.all([
        fetch('/api/config'),
        fetch('/api/products'),
        fetch('/api/orders'),
        fetch('/api/debts'),
        fetch('/api/categories').catch(() => null)
      ]);

      if (configRes.ok) {
        const confData = await configRes.json();
        setConfig(confData);
        onConfigChanged(confData);
      }
      if (productsRes.ok) setProducts(await productsRes.json());
      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (debtsRes.ok) setDebts(await debtsRes.json());
      if (categoriesRes && categoriesRes.ok) {
        const catData = await categoriesRes.json();
        onCategoriesChanged?.(catData);
      }

      // Preload mocked staff list
      setStaffList([
        { id: 'staff-admin', username: 'admin', role: 'ADMIN', permissions: { viewSales: true, viewRecharges: true, editInventory: true, manageStaff: true } },
        { id: 'staff-cashier', username: 'cashier', role: 'CASHIER', permissions: { viewSales: true, viewRecharges: false, editInventory: false, manageStaff: false } },
        { id: 'staff-telecom', username: 'telecom', role: 'COMMUNICATIONS', permissions: { viewSales: false, viewRecharges: true, editInventory: true, manageStaff: false } }
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  // Computed Interactive Filtered & Sorted Catalog Dataset
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Search filter
    if (adminProductSearch) {
      const q = adminProductSearch.toLowerCase().trim();
      result = result.filter(p => 
        p.nameAR.toLowerCase().includes(q) || 
        p.nameEN.toLowerCase().includes(q) || 
        p.id.toLowerCase().includes(q) || 
        (p.brand && p.brand.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (adminProductCategoryFilter !== 'ALL') {
      result = result.filter(p => p.category === adminProductCategoryFilter);
    }

    // Sorting
    if (adminProductSort.field !== 'none') {
      result.sort((a, b) => {
        let valA: any = '';
        let valB: any = '';

        if (adminProductSort.field === 'name') {
          valA = language === 'AR' ? a.nameAR : a.nameEN;
          valB = language === 'AR' ? b.nameAR : b.nameEN;
        } else if (adminProductSort.field === 'price') {
          valA = a.priceYER;
          valB = b.priceYER;
        } else if (adminProductSort.field === 'stock') {
          valA = a.stock ?? 999999;
          valB = b.stock ?? 999999;
        }

        if (valA < valB) return adminProductSort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return adminProductSort.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [products, adminProductSearch, adminProductCategoryFilter, adminProductSort, language]);

  const handleToggleSort = (field: 'name' | 'price' | 'stock') => {
    setAdminProductSort((prev) => {
      if (prev.field === field) {
        return {
          field,
          direction: prev.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return {
        field,
        direction: 'asc'
      };
    });
  };

  // Update administrative store settings (Admin only)
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken
        },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        const body = await res.json();
        setConfig(body.config);
        onConfigChanged(body.config);
        alert(language === 'AR' ? 'تم حفظ تكوينات المتجر بنجاح!' : 'Store custom settings saved successfully!');
      } else {
        alert(language === 'AR' ? 'غير مصرح للقيام بهذه العملية.' : 'Unauthorized action.');
      }
    } catch {
      alert('Error saving configuration.');
    }
  };

  // Update product inventory pricing/stock
  const handleSaveProductInventory = async (productId: string) => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken
        },
        body: JSON.stringify({
          id: productId,
          ...inventoryForm
        })
      });
      if (res.ok) {
        setEditingProduct(null);
        refreshAllData();
        alert(language === 'AR' ? 'تم تحديث الصنف بنجاح!' : 'Inventory item updated successfully!');
      } else {
        alert(language === 'AR' ? 'صلاحيات غير كافية لتعديل المنتجات!' : 'Unauthorized inventory modification.');
      }
    } catch {
      alert('API connection error.');
    }
  };

  // Full product save handler (Creates new or updates everything on existing products)
  const handleSaveFullProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.nameAR || !productForm.nameEN) {
      alert(language === 'AR' ? 'يرجى كتابة اسم المنتج بالعربية والإنجليزية!' : 'Please supply product name in both Arabic and English!');
      return;
    }
    
    setLoading(true);
    try {
      const isNew = isAddingProduct;
      const targetId = isNew ? (productForm.id.trim() || `prod-${Date.now()}`) : fullEditingProduct?.id;
      
      const payload = {
        ...productForm,
        id: targetId,
        priceYER: Number(productForm.priceYER),
        stock: productForm.stock !== undefined ? Number(productForm.stock) : undefined
      };

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsAddingProduct(false);
        setFullEditingProduct(null);
        setProductForm({
          id: '',
          nameAR: '',
          nameEN: '',
          descriptionAR: '',
          descriptionEN: '',
          category: categories[0]?.id || 'PHYSICAL_GROCERY',
          brand: '',
          priceYER: 1000,
          imageUrl: '',
          isAvailable: true,
          stock: 50,
          rechargeAmount: ''
        });
        refreshAllData();
        alert(language === 'AR' ? 'تم حفظ بيانات المنتج وتحديث مخزون الطيب بنجاح!' : 'Product details saved successfully!');
      } else {
        alert(language === 'AR' ? 'صلاحيات غير كافية لجدولة وحفظ المنتجات!' : 'Unauthorized product save.');
      }
    } catch (e) {
      alert('API connectivity failure.');
    } finally {
      setLoading(false);
    }
  };

  // Handler to permanently delete selected item
  const handleDeleteProduct = async (productId: string) => {
    const confirmDelete = confirm(language === 'AR' 
      ? 'هل أنت متأكد تماماً من رغبتك في حذف هذا الصنف من الكتالوج نهائياً؟' 
      : 'Are you sure you want to permanently delete this product?');
    if (!confirmDelete) return;

    setLoading(true);
    try {
      const res = await fetch('/api/products/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken
        },
        body: JSON.stringify({ id: productId })
      });

      if (res.ok) {
        setEditingProduct(null);
        setFullEditingProduct(null);
        refreshAllData();
        alert(language === 'AR' ? 'تم حذف الصنف بنجاح!' : 'Product deleted successfully!');
      } else {
        alert(language === 'AR' ? 'حدث خطأ أو صلاحياتك غير كافية لحذف منتجات!' : 'Failed or unauthorized deletion.');
      }
    } catch {
      alert('Error during delete.');
    } finally {
      setLoading(false);
    }
  };

  // Category save handler
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.id || !categoryForm.nameAR || !categoryForm.nameEN) {
      alert(language === 'AR' ? 'يرجى ملء جميع الحقول المطلوبة الكود والاسم بالعربي والإنجليزي!' : 'Please fill all required fields: Code, Name AR, and Name EN!');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken
        },
        body: JSON.stringify(categoryForm)
      });

      if (res.ok) {
        setIsAddingCategory(false);
        setFullEditingCategory(null);
        setCategoryForm({ id: '', nameAR: '', nameEN: '', icon: 'Layers', color: 'from-slate-900 to-slate-950' });
        refreshAllData();
        alert(language === 'AR' ? 'تم حفظ القسم بنجاح!' : 'Category details saved successfully!');
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(language === 'AR' ? `خطأ: ${errData.error || 'صلاحيات غير كافية'}` : `Error: ${errData.error || 'Unauthorized category action'}`);
      }
    } catch {
      alert('API connectivity failure.');
    } finally {
      setLoading(false);
    }
  };

  // Category delete handler
  const handleDeleteCategory = async (categoryId: string) => {
    const confirmDelete = confirm(language === 'AR'
      ? 'هل أنت متأكد تماماً من حذف هذا القسم؟ سيتم حذف التصنيف، ولكن تبقى منتجاته ويمكنك تعديل فئاتها.'
      : 'Are you sure you want to permanently delete this category? Products within it will remain but you may need to update their category association.');
    if (!confirmDelete) return;

    setLoading(true);
    try {
      const res = await fetch('/api/categories/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken
        },
        body: JSON.stringify({ id: categoryId })
      });

      if (res.ok) {
        refreshAllData();
        alert(language === 'AR' ? 'تم حذف القسم بنجاح!' : 'Category deleted successfully!');
      } else {
        alert(language === 'AR' ? 'فشل الحذف أو صلاحيات غير كافية.' : 'Failed or unauthorized category deletion.');
      }
    } catch {
      alert('Error during category delete.');
    } finally {
      setLoading(false);
    }
  };

  // Create or add a client debt
  const handleCreateDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDebtName.trim() || newDebtAmount <= 0) return;

    try {
      const res = await fetch('/api/debts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken
        },
        body: JSON.stringify({
          customerName: newDebtName.trim(),
          customerPhone: newDebtPhone.trim(),
          totalDebtYER: Number(newDebtAmount),
          notes: newDebtNotes.trim()
        })
      });
      if (res.ok) {
        setNewDebtName('');
        setNewDebtPhone('');
        setNewDebtAmount(0);
        setNewDebtNotes('');
        refreshAllData();
        alert(language === 'AR' ? 'تم تسجيل المديونية الجديدة بنجاح!' : 'New credit record generated.');
      } else {
        alert(language === 'AR' ? 'غير مصرح للتوثيق المزدوج!' : 'Unauthorized.');
      }
    } catch {
      alert('Network failure.');
    }
  };

  // Clear customer debt record completely
  const handleClearDebt = async (debtId: string) => {
    const doubleClick = confirm(language === 'AR' ? 'هل تم تسديد كامل المبلغ وتصفية الدفتر؟' : 'Clear full customer debt?');
    if (!doubleClick) return;

    try {
      const res = await fetch('/api/debts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken
        },
        body: JSON.stringify({
          id: debtId,
          totalDebtYER: 0 // setting to 0 clears out credit
        })
      });
      if (res.ok) {
        refreshAllData();
      }
    } catch {
      alert('Failed.');
    }
  };

  // Modify individual order dispatch statuses (cashier / admin)
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch('/api/orders/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken
        },
        body: JSON.stringify({ id: orderId, status })
      });
      if (res.ok) {
        refreshAllData();
      } else {
        alert(language === 'AR' ? 'مرفوض إدارياً!' : 'Action rejected.');
      }
    } catch {
      alert('Fail.');
    }
  };

  // Modify staff dynamic privileges (Admin absolute command)
  const handleTogglePermission = async (staffId: string, key: 'viewSales' | 'viewRecharges' | 'editInventory' | 'manageStaff', val: boolean) => {
    try {
      const staff = staffList.find(s => s.id === staffId);
      if (!staff) return;

      const updatedPerms = { ...staff.permissions, [key]: val };
      const res = await fetch('/api/staff/update-permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken
        },
        body: JSON.stringify({ id: staffId, permissions: updatedPerms })
      });

      if (res.ok) {
        setStaffList(prev => prev.map(s => s.id === staffId ? { ...s, permissions: updatedPerms } : s));
      } else {
        alert(language === 'AR' ? 'صلاحيات المدير المطلق مفقودة!' : 'Access denied.');
      }
    } catch {
      alert('Connection error.');
    }
  };

  // Analytics Computation Row
  const totalSalesYER = orders.filter(o => o.status === 'COMPLETED').reduce((acc, o) => acc + o.totalYER, 0);
  const activeDebtsTotalYER = debts.reduce((acc, d) => acc + d.totalDebtYER, 0);

  // Box Office Cashier Competition Statistics (مسابقة الصناديق)
  const cashierStatsMap: { [key: string]: { totalSales: number; trxCount: number } } = {
    'admin': { totalSales: 0, trxCount: 0 },
    'cashier': { totalSales: 0, trxCount: 0 },
    'telecom': { totalSales: 0, trxCount: 0 },
    'guest': { totalSales: 0, trxCount: 0 }
  };

  orders.forEach(order => {
    const cid = order.cashierId || 'guest';
    if (!cashierStatsMap[cid]) {
      cashierStatsMap[cid] = { totalSales: 0, trxCount: 0 };
    }
    if (order.status === 'COMPLETED') {
      cashierStatsMap[cid].totalSales += order.totalYER;
    }
    cashierStatsMap[cid].trxCount += 1;
  });

  const cashierLeaderboard = Object.keys(cashierStatsMap).map(cid => {
    let nameAR = 'سلة الخدمة الذاتية (guest)';
    let nameEN = 'Self-Service Portal (guest)';
    if (cid === 'admin') {
      nameAR = 'صندوق المدير العام (admin)';
      nameEN = 'General Manager Box (admin)';
    } else if (cid === 'cashier') {
      nameAR = 'صندوق مبيعات الكاشير (cashier)';
      nameEN = 'Cashier Sales Box (cashier)';
    } else if (cid === 'telecom') {
      nameAR = 'صندوق كاشير الشبكات (telecom)';
      nameEN = 'Telecom Dispatch Box (telecom)';
    }

    return {
      id: cid,
      nameAR,
      nameEN,
      totalSales: cashierStatsMap[cid].totalSales,
      trxCount: cashierStatsMap[cid].trxCount
    };
  }).sort((a, b) => b.totalSales - a.totalSales);

  // Grouped datasets for Bar chart
  const dailyReportData = [
    { name: '4 Days ago', amount: totalSalesYER * 0.15 },
    { name: '3 Days ago', amount: totalSalesYER * 0.22 },
    { name: '2 Days ago', amount: totalSalesYER * 0.35 },
    { name: 'Yesterday', amount: totalSalesYER * 0.45 },
    { name: 'Today (YER)', amount: totalSalesYER }
  ];

  // Grouped datasets for Pie chart (Categories)
  const categorySplitData = [
    { name: language === 'AR' ? 'خدمات رقمية' : 'Digital Hub', value: totalSalesYER * 0.6 },
    { name: language === 'AR' ? 'سلع عادية' : 'Physical Goods', value: totalSalesYER * 0.4 }
  ];
  
  const COLORS = ['#06b6d4', '#10b981'];

  // Check roles permissions
  const pCheck = currentUser.permissions;
  const isAdmin = currentUser.role === 'ADMIN';

  // Helper to check if order falls in active shift
  const isWithinActiveShift = (createdAtStr: string): boolean => {
    if (!createdAtStr) return false;
    const now = new Date();
    const orderDate = new Date(createdAtStr);
    const isSameDay = orderDate.toDateString() === now.toDateString();
    if (!isSameDay) return false;
    
    const currentHour = now.getHours();
    const orderHour = orderDate.getHours();
    
    // Shift A: Morning (6:00 to 18:00)
    // Shift B: Evening (18:00 to 6:00)
    const isNowMorning = currentHour >= 6 && currentHour < 18;
    const isOrderMorning = orderHour >= 6 && orderHour < 18;
    
    return isNowMorning === isOrderMorning;
  };

  // Filter based on selected criteria memoized to prevent constant recomputation
  const {
    filteredLedgerOrders,
    expectedReadyCash,
    expectedPendingCash,
    settledAndConfirmedCash,
    totalExpectedLedger,
    totalShiftCount,
    clearedShiftCount,
    shiftClearancePercent
  } = useMemo(() => {
    const filtered = orders.filter(o => {
      // Cashier filter
      if (selectedCashierOffice !== 'ALL' && o.cashierId !== selectedCashierOffice) return false;
      
      // Period filter
      if (selectedPeriodFilter === 'ACTIVE_SHIFT' && !isWithinActiveShift(o.createdAt)) return false;
      
      // Exclude archived past (past 48 hours for general view)
      if (excludeArchivedPast && selectedPeriodFilter === 'ALL_TIME' && o.createdAt && new Date(o.createdAt).getTime() < Date.now() - 48 * 60 * 60 * 1000) return false;
      
      return true;
    });

    const ready = filtered
      .filter(o => o.status === 'COMPLETED' && !matchedOrderIds.includes(o.id))
      .reduce((sum, o) => sum + o.totalYER, 0);

    const pending = filtered
      .filter(o => ['PENDING', 'PROCESSING'].includes(o.status) && !matchedOrderIds.includes(o.id))
      .reduce((sum, o) => sum + o.totalYER, 0);

    const settled = filtered
      .filter(o => matchedOrderIds.includes(o.id))
      .reduce((sum, o) => sum + o.totalYER, 0);

    const expected = filtered
      .filter(o => {
        if (selectedStatusFilter === 'COMPLETED' && o.status !== 'COMPLETED') return false;
        if (selectedStatusFilter === 'PENDING' && !['PENDING', 'PROCESSING'].includes(o.status)) return false;
        return true;
      })
      .reduce((sum, o) => sum + o.totalYER, 0);

    // Live shift calculations
    const activeShiftOrders = orders.filter(o => isWithinActiveShift(o.createdAt));
    const totalShift = activeShiftOrders.length;
    const clearedShift = activeShiftOrders.filter(o => o.status === 'COMPLETED' || matchedOrderIds.includes(o.id)).length;
    const clearancePercent = totalShift > 0 ? Math.round((clearedShift / totalShift) * 100) : 100;

    return {
      filteredLedgerOrders: filtered,
      expectedReadyCash: ready,
      expectedPendingCash: pending,
      settledAndConfirmedCash: settled,
      totalExpectedLedger: expected,
      totalShiftCount: totalShift,
      clearedShiftCount: clearedShift,
      shiftClearancePercent: clearancePercent
    };
  }, [orders, selectedCashierOffice, selectedPeriodFilter, selectedStatusFilter, excludeArchivedPast, matchedOrderIds]);

  // Paginated Ledger Orders and bounds
  const paginatedLedgerOrders = useMemo(() => {
    const startIndex = (ledgerPage - 1) * LEDGER_PAGE_SIZE;
    return filteredLedgerOrders.slice(startIndex, startIndex + LEDGER_PAGE_SIZE);
  }, [filteredLedgerOrders, ledgerPage]);

  const totalLedgerPages = Math.max(1, Math.ceil(filteredLedgerOrders.length / LEDGER_PAGE_SIZE));

  const now = new Date();
  const currentHour = now.getHours();
  const isMorningShift = currentHour >= 6 && currentHour < 18;
  const shiftNameAR = isMorningShift ? 'الوردية الصباحية ☀️ (06:00 ص - 06:00 م)' : 'الوردية المسائية 🌙 (06:00 م - 06:00 ص)';

  // Dynamic active ledger values (hybrid auto/manual approach)
  const activeReadyCash = inventoryMode === 'AUTO'
    ? expectedReadyCash
    : (manualReadyCash === '' ? expectedReadyCash : Number(manualReadyCash));

  const activePendingCash = inventoryMode === 'AUTO'
    ? expectedPendingCash
    : (manualPendingCash === '' ? expectedPendingCash : Number(manualPendingCash));

  const activeSettledCash = inventoryMode === 'AUTO'
    ? settledAndConfirmedCash
    : (manualSettledCash === '' ? settledAndConfirmedCash : Number(manualSettledCash));

  const activeExpectedLedger = inventoryMode === 'AUTO'
    ? totalExpectedLedger
    : (manualExpectedLedger === '' ? totalExpectedLedger : Number(manualExpectedLedger));

  // Discrepancy calculations based on active cash on hand
  const parsedActualCash = actualRealCashOnHand === '' ? activeReadyCash : Number(actualRealCashOnHand);
  const cashDiscrepancy = parsedActualCash - activeReadyCash;

  // Print Ledger report with custom/manual or automatic amounts
  const handlePrintLedgerReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }
    
    const formattedDate = new Date().toLocaleString('ar-YE', { hour12: true });
    
    const tableRows = filteredLedgerOrders.map((o, idx) => `
      <tr style="border-bottom: 1px solid #eee; text-align: right; font-size: 11px;">
        <td style="padding: 10px; text-align: center;">${idx + 1}</td>
        <td style="padding: 10px; font-family: monospace; font-weight: bold;">${o.id}</td>
        <td style="padding: 10px;">${o.customerName}</td>
        <td style="padding: 10px;">${o.paymentMethod || 'نقدي / صراف يمني'} (${o.cashierId})</td>
        <td style="padding: 10px; font-family: monospace; font-weight: bold;">${o.totalYER.toLocaleString()} YER</td>
        <td style="padding: 10px;">
          ${o.status === 'COMPLETED' 
            ? '<span style="color: #10b981; font-weight: bold; background: #e6f4ea; padding: 2px 8px; border-radius: 4px;">جاهز ومكتمل</span>' 
            : '<span style="color: #f59e0b; font-weight: bold; background: #fffbeb; padding: 2px 8px; border-radius: 4px;">معلّق</span>'
          }
        </td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>كشف جرد الصندوق والمطابقة المالية اليومية</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            margin: 30px;
            color: #1e293b;
            background-color: #ffffff;
            line-height: 1.5;
          }
          .header-table {
            width: 100%;
            margin-bottom: 25px;
            border-bottom: 3px double #0f172a;
            padding-bottom: 15px;
          }
          .header-title {
            font-size: 20px;
            font-weight: 800;
            color: #0f172a;
            margin: 0;
            text-align: center;
          }
          .header-subtitle {
            font-size: 11px;
            color: #64748b;
            text-align: center;
            margin-top: 5px;
          }
          .meta-section {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 15px;
            margin-bottom: 25px;
          }
          .meta-grid {
            display: grid;
            grid-template-cols: 1fr 1fr;
            gap: 12px;
            font-size: 12px;
          }
          .meta-item strong {
            color: #334155;
          }
          .cards-grid {
            display: grid;
            grid-template-cols: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 25px;
          }
          .card {
            border: 1px solid #cbd5e1;
            border-radius: 12px;
            padding: 12px;
            text-align: center;
            background-color: #f8fafc;
          }
          .card-title {
            font-size: 10px;
            color: #475569;
            font-weight: 700;
            margin-bottom: 6px;
          }
          .card-value {
            font-size: 15px;
            font-weight: bold;
            font-family: monospace;
            color: #0f172a;
          }
          .discrepancy-box {
            background-color: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 12px;
            padding: 15px;
            margin-bottom: 25px;
            font-size: 12px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            margin-bottom: 45px;
          }
          th {
            background-color: #f1f5f9;
            border-bottom: 2px solid #cbd5e1;
            padding: 12px 10px;
            font-size: 11px;
            text-align: right;
            color: #334155;
          }
          .signatures {
            margin-top: 50px;
            display: grid;
            grid-template-cols: 1fr 1fr 1fr;
            gap: 30px;
            text-align: center;
            font-size: 12px;
          }
          .sig-line {
            margin-top: 35px;
            border-top: 1px dashed #64748b;
            padding-top: 8px;
            color: #475569;
            font-weight: bold;
          }
          @media print {
            body { margin: 15px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td>
              <h1 class="header-title">كشف جرد الصندوق والمطابقة المالية اليومية</h1>
              <div class="header-subtitle">نوع الجرد: ${inventoryMode === 'AUTO' ? '🤖 جرد آلي ذكي مستند لقيود النظام' : '✍️ جرد يدوي مخصص (معدل يدوياً)'}</div>
            </td>
          </tr>
        </table>

        <div class="meta-section">
          <div class="meta-grid">
            <div class="meta-item"><strong>اسم مسؤول المطابقة ماليًا:</strong> ${currentUser.username} (${currentUser.role})</div>
            <div class="meta-item"><strong>تاريخ ووقت الكشف الفعلي:</strong> ${formattedDate}</div>
            <div class="meta-item"><strong>الفترة المستهدفة للجرد:</strong> ${selectedPeriodFilter === 'ACTIVE_SHIFT' ? 'الوردية الحية النشطة فقط' : 'شامل كل الفترات الزمنية المفتوحة'}</div>
            <div class="meta-item"><strong>صندوق الحصالة المحاسب:</strong> ${selectedCashierOffice === 'ALL' ? 'جَميع الصناديق وحصالات المعرض التراكمية' : selectedCashierOffice}</div>
          </div>
        </div>

        <h4 style="margin: 0 0 10px 0; font-size: 13px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">أرصدة كشف الصيدلية / المحافظ المالية</h4>
        <div class="cards-grid">
          <div class="card" style="border-right: 4px solid #10b981;">
            <div class="card-title">الرصيد الجاهز المستلم (🟢)</div>
            <div class="card-value">${activeReadyCash.toLocaleString()} YER</div>
          </div>
          <div class="card" style="border-right: 4px solid #f59e0b;">
            <div class="card-title">الأرصدة المعلقة بالتحويل (🟡)</div>
            <div class="card-value">${activePendingCash.toLocaleString()} YER</div>
          </div>
          <div class="card" style="border-right: 4px solid #06b6d4;">
            <div class="card-title">تمت تسويته وتأكيده اليوم</div>
            <div class="card-value">${activeSettledCash.toLocaleString()} YER</div>
          </div>
          <div class="card" style="border-right: 4px solid #475569;">
            <div class="card-title">إجمالي حساب الجرد المرشح</div>
            <div class="card-value">${activeExpectedLedger.toLocaleString()} YER</div>
          </div>
        </div>

        <div class="discrepancy-box" style="background-color: ${cashDiscrepancy < 0 ? '#fef2f2' : cashDiscrepancy > 0 ? '#fffbeb' : '#f0fdf4'}; border-color: ${cashDiscrepancy < 0 ? '#fecaca' : cashDiscrepancy > 0 ? '#fef3c7' : '#bbf7d0'};">
          <table style="width: 100%; margin: 0; padding: 0; border-collapse: collapse;">
            <tr style="background: none; border: none;">
              <td style="padding: 0; text-align: right; font-size: 12px; color: #0f172a;">
                <strong>المبلغ الفعلي المادي بالدرج (العد اليدوي):</strong> 
                <span style="font-family: monospace; font-weight: bold; font-size: 14px; margin-right: 5px;">
                  ${actualRealCashOnHand !== '' ? Number(actualRealCashOnHand).toLocaleString() : activeReadyCash.toLocaleString()} YER
                </span>
              </td>
              <td style="padding: 0; text-align: left; font-size: 12px;">
                <strong>حالة ونسبة التطابق:</strong>
                <span style="font-weight: 800; margin-right: 5px; color: ${cashDiscrepancy < 0 ? '#dc2626' : cashDiscrepancy > 0 ? '#d97706' : '#16a34a'} font-family: inherit;">
                  ${actualRealCashOnHand !== '' ? (
                    cashDiscrepancy < 0 
                      ? `🚨 عجز مالي بقيمة (${Math.abs(cashDiscrepancy).toLocaleString()}) ريال يمني`
                      : cashDiscrepancy > 0 
                        ? `💡 فائض مادي بالدرج بقيمة (${cashDiscrepancy.toLocaleString()}) ريال يمني`
                        : `🟢 حسابات مطابقة تماماً (100%)`
                  ) : 'مكتمل ومطابق لمقدار الرصيد الجاهز افتراضياً'}
                </span>
              </td>
            </tr>
          </table>
        </div>

        <h4 style="margin: 20px 0 10px 0; font-size: 13px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">تفاصيل السجل المالي والخيوط المحاسبية</h4>
        <table>
          <thead>
            <tr>
              <th style="width: 35px; text-align: center;">#</th>
              <th>رقم الطلبية</th>
              <th>العميل المستلم</th>
              <th>طريقة الدفع وموقع الحصالة</th>
              <th>المبلغ الاجمالي بالفرعي</th>
              <th>الحالة المحاسبية</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows || '<tr><td colspan="6" style="text-align: center; padding: 15px; color: #94a3b8;">لا توجد أي معاملات مسجلة ضمن فلاتر الجرد الحالية.</td></tr>'}
          </tbody>
        </table>

        <div class="signatures">
          <div>
            <div class="sig-line">إعداد ومطابقة أمين الصندوق</div>
          </div>
          <div>
            <div class="sig-line">توقيع مراجع جرد الخزينة المادي</div>
          </div>
          <div>
            <div class="sig-line">المصادقة والاعتماد العام</div>
          </div>
        </div>

        <div class="no-print" style="margin-top: 50px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 24px; font-size: 13px; background: #0f172a; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">طباعة الكشف الفوري / تصدير PDF</button>
          <button onclick="window.close()" style="padding: 10px 24px; font-size: 13px; background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; border-radius: 8px; cursor: pointer; margin-right: 10px; font-weight: bold;">الرجوع للوحة التحكم</button>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      
      {/* Dynamic Left Sidebar Menu Dashboard Toggling */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-5 flex flex-col justify-between hidden md:flex">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-850">
            <div className="w-8 h-8 rounded-lg bg-orange-500 text-slate-950 flex items-center justify-center font-bold">
              🛡️
            </div>
            <div>
              <span className="block font-black text-sm text-white uppercase tracking-wider">{currentUser.username}</span>
              <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest leading-none">
                {currentUser.role} {language === 'AR' ? 'موثق' : 'VERIFIED'}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-slate-550 uppercase tracking-widest font-mono font-bold mb-1 px-3">NAVIGATION CONTROL</span>
            
            {/* TAB SELECTORS */}
            <button
              onClick={() => setActiveTab('ANALYTICS')}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                activeTab === 'ANALYTICS' ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-950/20' : 'text-slate-400 hover:bg-slate-850 hover:text-white'
              }`}
            >
              <TrendingUp className="w-4.5 h-4.5" />
              <span>{language === 'AR' ? 'التقارير والإحصائيات' : 'Commercial Analytics'}</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => setActiveTab('SETTINGS')}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                  activeTab === 'SETTINGS' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:bg-slate-850 hover:text-white'
                }`}
              >
                <Building className="w-4.5 h-4.5" />
                <span>{language === 'AR' ? 'إعدادات متجر الطيب' : 'Store Configuration'}</span>
              </button>
            )}

            {(isAdmin || pCheck.editInventory) && (
              <button
                onClick={() => setActiveTab('INVENTORY')}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                  activeTab === 'INVENTORY' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:bg-slate-850 hover:text-white'
                }`}
              >
                <Box className="w-4.5 h-4.5" />
                <span>{language === 'AR' ? 'جرد وإدارة المخزون' : 'Inventory Manager'}</span>
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => setActiveTab('STAFF')}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                  activeTab === 'STAFF' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:bg-slate-850 hover:text-white'
                }`}
              >
                <Users className="w-4.5 h-4.5" />
                <span>{language === 'AR' ? 'مصفوفة صلاحيات الموظفين' : 'Staff Matrix privileges'}</span>
              </button>
            )}

            {(isAdmin || pCheck.viewSales) && (
              <button
                onClick={() => setActiveTab('DEBTS')}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                  activeTab === 'DEBTS' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:bg-slate-850 hover:text-white'
                }`}
              >
                <Handshake className="w-4.5 h-4.5" />
                <span>{language === 'AR' ? 'مراقبة ومتابعة الديون آجل' : 'Outstanding Client Debts'}</span>
              </button>
            )}

            {(isAdmin || pCheck.viewSales || pCheck.viewRecharges) && (
              <button
                onClick={() => setActiveTab('ORDERS')}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                  activeTab === 'ORDERS' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:bg-slate-850 hover:text-white'
                }`}
              >
                <ListOrdered className="w-4.5 h-4.5" />
                <span>{language === 'AR' ? 'طلبات الزبائن الفورية' : 'Active Client Orders'}</span>
              </button>
            )}

          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={refreshAllData}
            disabled={loading}
            className="w-full py-2 bg-slate-950 border border-slate-800 rounded-xl text-[10px] text-cyan-400 font-mono flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>MAPPED DATABASE REFRESH</span>
          </button>
          <span className="text-[9px] text-slate-6 text-center select-none opacity-40">STORE_ROUTER SECURITY ENGINE</span>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
        
        {/* Mobile menu and indicator */}
        <div className="flex md:hidden items-center justify-between overflow-x-auto bg-slate-900 border border-slate-850 p-2.5 rounded-2xl gap-2 scrollbar-none mb-4">
          <button onClick={() => setActiveTab('ANALYTICS')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black shrink-0 ${activeTab === 'ANALYTICS' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}>التحليلات</button>
          {isAdmin && <button onClick={() => setActiveTab('SETTINGS')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black shrink-0 ${activeTab === 'SETTINGS' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}>الإعدادات</button>}
          {(isAdmin || pCheck.editInventory) && <button onClick={() => setActiveTab('INVENTORY')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black shrink-0 ${activeTab === 'INVENTORY' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}>المخزون</button>}
          {isAdmin && <button onClick={() => setActiveTab('STAFF')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black shrink-0 ${activeTab === 'STAFF' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}>الصلاحيات</button>}
          {(isAdmin || pCheck.viewSales) && <button onClick={() => setActiveTab('DEBTS')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black shrink-0 ${activeTab === 'DEBTS' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}>الديون</button>}
          <button onClick={() => setActiveTab('ORDERS')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black shrink-0 ${activeTab === 'ORDERS' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}>الطلبات</button>
        </div>

        {/* Dynamic header summary statistics block */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5">
          
          <div className="bg-slate-900 rounded-3xl border border-slate-850 p-5.5 flex justify-between items-center shadow-lg">
            <div>
              <span className="block text-slate-500 text-[10px] font-black tracking-widest uppercase font-mono">{language === 'AR' ? 'مبيعات الصندوق الصافية' : 'BOX OFFICE TOTAL SALES'}</span>
              <span className="text-2xl font-mono font-black text-emerald-400 mt-1 block">{(totalSalesYER).toLocaleString()} YER</span>
              <span className="text-[10px] text-slate-450 font-mono block">≈ ${(totalSalesYER / config.exchangeRateUSD).toFixed(1)} USD • {(totalSalesYER / config.exchangeRateSAR).toFixed(1)} SAR</span>
            </div>
            <div className="p-3 bg-emerald-950 rounded-2xl text-emerald-400">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl border border-slate-850 p-5.5 flex justify-between items-center shadow-lg">
            <div>
              <span className="block text-slate-500 text-[10px] font-black tracking-widest uppercase font-mono">{language === 'AR' ? 'عصارة الديون والذمم الآجلة' : 'TOTAL CUSTOMER DEBTS LEDGER'}</span>
              <span className="text-2xl font-mono font-black text-rose-452 text-rose-400 mt-1 block">{activeDebtsTotalYER.toLocaleString()} YER</span>
              <span className="text-[10px] text-slate-450 font-mono block">({debts.filter(d => d.totalDebtYER > 0).length} {language === 'AR' ? 'حسابات نشطة' : 'Active accounts'})</span>
            </div>
            <div className="p-3 bg-red-950 rounded-2xl text-red-400">
              <Handshake className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl border border-slate-850 p-5.5 flex justify-between items-center shadow-lg">
            <div>
              <span className="block text-slate-500 text-[10px] font-black tracking-widest uppercase font-mono">{language === 'AR' ? 'طاقم العمل والتشغيل' : 'OFFICIAL STAFF ENGAGEMENTS'}</span>
              <span className="text-2xl font-mono font-black text-cyan-400 mt-1 block">{staffList.length} {language === 'AR' ? 'حسابات' : 'Terminal Accounts'}</span>
              <span className="text-[10px] text-slate-450 font-mono block">{language === 'AR' ? 'بيئة تشغيل STORE_ROUTER معينة' : 'STORE_ROUTER network sandbox initialized'}</span>
            </div>
            <div className="p-3 bg-cyan-950 rounded-2xl text-cyan-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>

        </div>

        {/* 1️⃣ ANALYTICS TAB CONTENT */}
        {activeTab === 'ANALYTICS' && (
          <div className="space-y-6 w-full animate-fadeIn" dir="rtl">
            
            {/* Title & Guidance Header */}
            <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                  <span className="p-1.5 bg-cyan-950 text-cyan-400 rounded-xl">📊</span>
                  <span>منظومة الجرد المالي والتقارير الاستراتيجية VIP</span>
                </h2>
                <p className="text-xs text-slate-400">
                  قم بمطابقة ومقارنة أرصدة الحصالات، جرد صناديق الدفع (الماضي لا)، واطلع على مقترحات التطوير التشغيلية المدعومة ببيانات المخزون.
                </p>
              </div>
              <div className="flex bg-slate-950 p-1 border border-slate-850 rounded-2xl gap-1.5 shrink-0 select-none">
                <button
                  type="button"
                  onClick={() => setAnalyticsSubTab('LEDGER')}
                  className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                    analyticsSubTab === 'LEDGER'
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>جرد ومطابقة الصناديق 🏦</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAnalyticsSubTab('GROWTH')}
                  className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                    analyticsSubTab === 'GROWTH'
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>تحليلات النمو والتطوير 📈</span>
                </button>
              </div>
            </div>

            {/* Dynamic 4-Column Summary Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5">
              
              <div className="bg-[#0b1220]/60 border border-slate-850/80 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-cyan-500/30 transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="block text-slate-500 text-[10px] font-bold tracking-widest uppercase font-mono">إجمالي صفقات وحجوزات السلة</span>
                    <span className="text-xl font-mono font-black text-cyan-400 mt-1.5 block">{orders.length} طلبات دفعت</span>
                    <span className="text-[10px] text-slate-450 mt-1 block">مقسمة ومثبتة بالنظام وفي الـ Local</span>
                  </div>
                  <div className="p-2.5 bg-cyan-950/40 rounded-xl text-cyan-400">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="bg-[#0b1220]/60 border border-slate-850/80 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="block text-slate-500 text-[10px] font-bold tracking-widest uppercase font-mono">العوائد الفعلية النشطة</span>
                    <span className="text-xl font-mono font-black text-emerald-400 mt-1.5 block">
                      {(orders.filter(o => o.status === 'COMPLETED').reduce((sum, o) => sum + o.totalYER, 0)).toLocaleString()} YER
                    </span>
                    <span className="text-[10px] text-slate-450 mt-1 block">
                      ≈ {(config.exchangeRateSAR > 0 ? (orders.filter(o => o.status === 'COMPLETED').reduce((sum, o) => sum + o.totalYER, 0) / config.exchangeRateSAR) : 0).toFixed(0)} ر.س • تستبعد طلبات الملغية
                    </span>
                  </div>
                  <div className="p-2.5 bg-emerald-950/40 rounded-xl text-emerald-400">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="bg-[#0b1220]/60 border border-slate-850/80 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-amber-500/30 transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="block text-slate-500 text-[10px] font-bold tracking-widest uppercase font-mono">الطلبيات الجديدة "قيد الانتظار"</span>
                    <span className="text-xl font-mono font-black text-amber-450 text-amber-400 mt-1.5 block">
                      {orders.filter(o => ['PENDING', 'PROCESSING'].includes(o.status)).length} معالجة فورية
                    </span>
                    <span className="text-[10px] text-slate-450 mt-1 block">بحاجة لنقرة تحويل شحن</span>
                  </div>
                  <div className="p-2.5 bg-amber-950/40 rounded-xl text-amber-400">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="bg-[#0b1220]/60 border border-slate-850/80 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-purple-500/30 transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="block text-slate-500 text-[10px] font-bold tracking-widest uppercase font-mono">الأصناف المتوفرة بالمعرض</span>
                    <span className="text-xl font-mono font-black text-purple-400 mt-1.5 block">{products.length} أصناف</span>
                    <span className="text-[10px] text-slate-450 mt-1 block">تدعم الإضافة والتعديل والفلترة</span>
                  </div>
                  <div className="p-2.5 bg-purple-950/40 rounded-xl text-purple-400">
                    <Box className="w-5 h-5" />
                  </div>
                </div>
              </div>

            </div>

            {/* --- CORE LEDGER SUBTAB --- */}
            {analyticsSubTab === 'LEDGER' && (
              <div className="space-y-6 animate-fadeIn">
                
                {/* 📊 LIVE SHIFT DASHBOARD (مؤشر الوردية الحية) */}
                <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-850 pb-4">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase block">LIVE SHIFT DASHBOARD</span>
                      <h3 className="text-sm font-black text-white flex items-center gap-2">
                        <span>مؤشر الوردية الحية والتشغيلية النشطة 📊</span>
                      </h3>
                      <p className="text-[11px] text-slate-450">
                        متابعة حية لأداء الوردية الحالية استناداً لتوقيت الكاشير الفعلي لضمان مطابقة متواصلة وسرعة تصفية المعاملات.
                      </p>
                    </div>
                    <div className="px-3.5 py-1.5 bg-cyan-950 border border-cyan-850 text-cyan-300 text-xs font-bold rounded-xl shrink-0">
                      {shiftNameAR}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5 font-sans">
                    
                    <div className="bg-slate-950 p-4 border border-slate-850 rounded-2xl flex flex-col justify-between">
                      <span className="text-[10px] text-slate-550 block font-sans">إجمالي عمليات الوردية الحالية</span>
                      <span className="text-xl font-mono font-black text-white mt-1">{totalShiftCount} طلبات</span>
                      <span className="text-[9px] text-slate-500 block mt-1">تراكمت اليوم في الفترة المحددة للوردية</span>
                    </div>

                    <div className="bg-slate-950 p-4 border border-slate-850 rounded-2xl flex flex-col justify-between">
                      <span className="text-[10px] text-slate-550 block font-sans">الطلبات المصفّاة والمطابقة</span>
                      <span className="text-xl font-mono font-black text-emerald-400 mt-1">{clearedShiftCount} / {totalShiftCount} طلب</span>
                      <span className="text-[9px] text-slate-500 block mt-1 font-sans">معاملات مكتملة وجاهزة بالوردية الحية والنشطة</span>
                    </div>

                    <div className="bg-slate-950 p-4 border border-slate-850 rounded-2xl space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[10px] text-slate-400 block font-bold">كفاءة تصفية الوردية الحالية:</span>
                        <span className={`font-mono font-black p-1 rounded-md text-[10px] ${
                          shiftClearancePercent >= 80 ? 'text-emerald-400 bg-emerald-950/40' :
                          shiftClearancePercent >= 50 ? 'text-amber-400 bg-amber-950/40' : 'text-red-400 bg-red-950/40'
                        }`}>
                          {shiftClearancePercent}%
                        </span>
                      </div>
                      {/* High precision visual progress bar */}
                      <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                        <div 
                          className="h-full bg-gradient-to-l from-cyan-500 to-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${shiftClearancePercent}%` }}
                        ></div>
                      </div>
                      <span className="text-[9px] text-slate-500 block text-right font-sans">
                        {shiftClearancePercent === 100 ? '🎉 تم إنهاء وتصفية كافة معاملات الوردية الحالية!' : '💡 يوصى الموظفين بتسريع ترحيل المعاملات العالقة للحفاظ على جرد نظيف.'}
                      </span>
                    </div>

                  </div>
                </div>

                {/* Manual ledger check controls card */}
                <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-xl relative">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-slate-850">
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-black text-white flex items-center gap-2">
                        <span>تكوين فلاتر الجرد اليدوي لمطابقة الأرصدة ⚙️</span>
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        قم بتصفية معاملات النظام، وعزل الصناديق لتسهيل التحقق المالي والعد البديل.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                      {/* Segmented Mode Button Switch (جرد آلي vs جرد يدوي) */}
                      <div className="flex bg-slate-950 p-1 border border-slate-850 rounded-2xl select-none">
                        <button
                          type="button"
                          onClick={() => setInventoryMode('AUTO')}
                          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                            inventoryMode === 'AUTO' 
                              ? 'bg-slate-800 text-cyan-400 border border-cyan-900/40 shadow-lg' 
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>جرد آلي ذكي</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setInventoryMode('MANUAL')}
                          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                            inventoryMode === 'MANUAL' 
                              ? 'bg-slate-800 text-amber-400 border border-amber-900/40 shadow-lg' 
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>جرد يدوي مخصص</span>
                        </button>
                      </div>

                      {/* Exclude archived checked status */}
                      <label className="flex items-center gap-2 bg-slate-950 px-4 py-2 border border-slate-850 rounded-2xl text-xs cursor-pointer hover:bg-slate-850/50 transition">
                        <input
                          type="checkbox"
                          checked={excludeArchivedPast}
                          onChange={(e) => setExcludeArchivedPast(e.target.checked)}
                          className="rounded border-slate-800 text-cyan-500 focus:ring-cyan-500 h-4 w-4 bg-slate-950 accent-cyan-500"
                        />
                        <span className="font-bold text-slate-300">استبعاد الماضي المؤرشف (الماضي لا ⏳)</span>
                      </label>
                    </div>
                  </div>

                  {/* Filter controls row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                    
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-slate-400 font-bold">1. تحديد صندوق الدفع / المحفظة المالي (الصندوق)</label>
                      <select
                        value={selectedCashierOffice}
                        onChange={(e) => setSelectedCashierOffice(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="ALL">كافة الصناديق وحصالات المتجر (الكل)</option>
                        <option value="cashier">صندوق مبيعات الكاشير (cashier)</option>
                        <option value="telecom">صندوق كاشير الشبكات (telecom)</option>
                        <option value="admin">صندوق المدير العام (admin)</option>
                        <option value="guest">سلة الخدمة الذاتية (guest)</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-slate-400 font-bold">2. تصنيف حالة العمليات (جاهز ومكتمل / معلق)</label>
                      <div className="grid grid-cols-3 bg-slate-950 p-1 border border-slate-850 rounded-2xl select-none">
                        <button
                          type="button"
                          onClick={() => setSelectedStatusFilter('ALL')}
                          className={`py-2 text-[11px] font-bold rounded-xl transition ${
                            selectedStatusFilter === 'ALL' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          الكل
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedStatusFilter('COMPLETED')}
                          className={`py-2 text-[11px] font-bold rounded-xl transition ${
                            selectedStatusFilter === 'COMPLETED' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          العمليات الجاهزة
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedStatusFilter('PENDING')}
                          className={`py-2 text-[11px] font-bold rounded-xl transition ${
                            selectedStatusFilter === 'PENDING' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          المعلقة
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-slate-400 font-bold">3. تحديد فترة الجرد (الماضي لا 🚫)</label>
                      <select
                        value={selectedPeriodFilter}
                        onChange={(e) => setSelectedPeriodFilter(e.target.value as 'ACTIVE_SHIFT' | 'ALL_TIME')}
                        className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="ACTIVE_SHIFT">الوردية النشطة فقط (استبعاد الماضي المستمر)</option>
                        <option value="ALL_TIME">جميع الفترات الزمنية للمطابقة</option>
                      </select>
                    </div>

                  </div>

                  {/* Inside Filter statistics Sub-grid (4 cards) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-950 p-4 border border-slate-850 rounded-2xl shadow-inner text-right">
                    
                    <div className="space-y-1 p-3">
                      <span className="text-[10px] text-slate-550 font-black block font-sans">الرصيد الجاهز المستلم (🟢)</span>
                      {inventoryMode === 'MANUAL' ? (
                        <div className="relative mt-1">
                          <input
                            type="text"
                            value={manualReadyCash}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, '');
                              setManualReadyCash(val);
                            }}
                            placeholder={expectedReadyCash.toString()}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-450 focus:ring-1 focus:ring-emerald-500/20 rounded-xl px-2 py-1 text-center font-mono font-bold text-emerald-400 text-sm focus:outline-none"
                          />
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-500 font-bold select-none pointer-events-none font-sans">YER</span>
                        </div>
                      ) : (
                        <span className="text-base font-bold font-mono text-emerald-400 block font-sans">
                          {expectedReadyCash.toLocaleString()} YER
                        </span>
                      )}
                      <span className="text-[9px] text-slate-500 block font-sans">
                        ≈ {(config.exchangeRateSAR > 0 ? (activeReadyCash / config.exchangeRateSAR) : 0).toFixed(0)} ر.س • رصيد حقيقي
                      </span>
                    </div>

                    <div className="space-y-1 p-3 border-r border-slate-850/60 font-sans">
                      <span className="text-[10px] text-slate-550 font-black block font-sans">الأرصدة المعلقة بالتحويل (🟡)</span>
                      {inventoryMode === 'MANUAL' ? (
                        <div className="relative mt-1">
                          <input
                            type="text"
                            value={manualPendingCash}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, '');
                              setManualPendingCash(val);
                            }}
                            placeholder={expectedPendingCash.toString()}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-amber-450 focus:ring-1 focus:ring-amber-500/20 rounded-xl px-2 py-1 text-center font-mono font-bold text-amber-400 text-sm focus:outline-none"
                          />
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-500 font-bold select-none pointer-events-none font-sans">YER</span>
                        </div>
                      ) : (
                        <span className="text-base font-bold font-mono text-amber-400 block font-sans">
                          {expectedPendingCash.toLocaleString()} YER
                        </span>
                      )}
                      <span className="text-[9px] text-slate-500 block font-sans">
                        ≈ {(config.exchangeRateSAR > 0 ? (activePendingCash / config.exchangeRateSAR) : 0).toFixed(0)} ر.س • بالانتظار
                      </span>
                    </div>

                    <div className="space-y-1 p-3 border-r border-slate-850/60 font-sans">
                      <span className="text-[10px] text-slate-550 font-black block font-sans">رصيد تمت تسويته وتأكيده</span>
                      {inventoryMode === 'MANUAL' ? (
                        <div className="relative mt-1">
                          <input
                            type="text"
                            value={manualSettledCash}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, '');
                              setManualSettledCash(val);
                            }}
                            placeholder={settledAndConfirmedCash.toString()}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-450 focus:ring-1 focus:ring-cyan-500/20 rounded-xl px-2 py-1 text-center font-mono font-bold text-cyan-400 text-sm focus:outline-none"
                          />
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-500 font-bold select-none pointer-events-none font-sans">YER</span>
                        </div>
                      ) : (
                        <span className="text-base font-bold font-mono text-cyan-400 block font-sans">
                          {settledAndConfirmedCash.toLocaleString()} YER
                        </span>
                      )}
                      <span className="text-[9px] text-slate-500 block text-right font-sans">
                        {inventoryMode === 'MANUAL' ? 'تعديل يدوي ومطابقة متقدمة' : `${filteredLedgerOrders.filter(o => matchedOrderIds.includes(o.id)).length} معاملات تمت تصفيتها يدوياً اليوم`}
                      </span>
                    </div>

                    <div className="space-y-1 p-3 border-r border-slate-850/60 font-sans font-sans">
                      <span className="text-[10px] text-slate-550 font-black block font-sans">إجمالي حساب الجرد المرشح</span>
                      {inventoryMode === 'MANUAL' ? (
                        <div className="relative mt-1">
                          <input
                            type="text"
                            value={manualExpectedLedger}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, '');
                              setManualExpectedLedger(val);
                            }}
                            placeholder={totalExpectedLedger.toString()}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-slate-400 focus:ring-1 focus:ring-slate-500/20 rounded-xl px-2 py-1 text-center font-mono font-bold text-white text-sm focus:outline-none"
                          />
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-500 font-bold select-none pointer-events-none font-sans">YER</span>
                        </div>
                      ) : (
                        <span className="text-base font-bold font-mono text-white block font-sans font-mono animate-pulse">
                          {totalExpectedLedger.toLocaleString()} YER
                        </span>
                      )}
                      <span className="text-[9px] text-slate-500 block font-sans font-sans">
                        {inventoryMode === 'MANUAL' ? 'الاحتساب المقدر اليدوي المفتوح' : `من ${filteredLedgerOrders.length} معاملة في الفلاتر`}
                      </span>
                    </div>

                  </div>

                  {/* 💡 DISCREPANCY ENGINE PANEL (محرك احتساب الفوارق الذكي) */}
                  <div className="flex flex-col gap-3 p-5 bg-slate-950 border border-slate-800 rounded-2xl">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-1 text-right font-sans">
                        <span className="text-xs font-semibold text-white flex items-center gap-1.5 font-sans">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                          <span>المطابقة الفعلية وحساب الفوارق اليدوية بالخزينة:</span>
                        </span>
                        <p className="text-[10px] text-slate-400">
                          أدخل أدناه إجمالي النقد الفعلي الذي قمت بعدّه يدوياً في الخزنة للمطابقة التلقائية ماليًا.
                        </p>
                      </div>
                      <div className="relative w-full sm:w-64">
                        <input
                          type="number"
                          value={actualRealCashOnHand}
                          onChange={(e) => setActualRealCashOnHand(e.target.value)}
                          placeholder={`${activeReadyCash} YER`}
                          className="w-full bg-slate-900 border border-slate-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 rounded-xl px-4 py-2.5 text-center font-mono font-black text-amber-300 text-sm"
                        />
                        {actualRealCashOnHand && (
                          <button
                            type="button"
                            onClick={() => setActualRealCashOnHand('')}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer text-xs"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Live alerts computed dynamically */}
                    <div className="mt-1 font-sans">
                      {actualRealCashOnHand !== '' ? (
                        cashDiscrepancy < 0 ? (
                          <div className="p-3 bg-red-955 bg-red-950/45 border border-red-900/40 rounded-xl text-red-200 text-xs flex items-center gap-2 justify-between animate-fadeIn font-sans">
                            <span className="font-extrabold text-right">🚨 تنبيه عجز مالي بالصندوق: يوجد عجز غير مطبق بقيمة ({Math.abs(cashDiscrepancy).toLocaleString()}) ريال يمني!</span>
                            <span className="font-mono text-[10px] px-2 py-0.5 bg-red-900/40 text-red-100 rounded select-none">DEFICIT</span>
                          </div>
                        ) : cashDiscrepancy > 0 ? (
                          <div className="p-3 bg-amber-955 bg-amber-950/45 border border-amber-900/35 rounded-xl text-amber-350 text-xs flex items-center gap-2 justify-between animate-fadeIn font-sans">
                            <span className="font-extrabold text-right">💡 تنبيه زيادة بالدرج: سجل الكاشير فائضًا يبلغ ({cashDiscrepancy.toLocaleString()}) ريال يمني ماديًا!</span>
                            <span className="font-mono text-[10px] px-2 py-0.5 bg-amber-900/40 text-amber-100 rounded select-none font-bold">SURPLUS</span>
                          </div>
                        ) : (
                          <div className="p-3 bg-emerald-955 bg-emerald-950/45 border border-emerald-900/35 rounded-xl text-emerald-300 text-xs flex items-center gap-2 justify-between font-sans">
                            <span className="font-extrabold text-right">🟢 الحسابات متطابقة 100% وتطابق الرصيد مستوفى بالكامل ومطابق ماليًا!</span>
                            <span className="font-mono text-[10px] px-2 py-0.5 bg-emerald-900/50 text-emerald-100 rounded font-bold select-none">BALANCED</span>
                          </div>
                        )
                      ) : (
                        <div className="p-3 bg-slate-900/40 border border-slate-850/60 rounded-xl text-slate-400 text-[11px] text-center">
                          💡 أدخل قيمة نقدية بالعملة المحلية في الخزينة لبدء المطابقة.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-850 bg-slate-950/70 will-change-gpu">
                    <table className="w-full text-right text-xs font-sans">
                      <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-850">
                        <tr>
                          {/* Master Bulk Checkbox Selection Header */}
                          <th className="px-4 py-3 text-center w-12">
                            <input
                              type="checkbox"
                              checked={
                                filteredLedgerOrders.filter(o => !matchedOrderIds.includes(o.id)).length > 0 &&
                                filteredLedgerOrders.filter(o => !matchedOrderIds.includes(o.id)).every(o => matchedOrderIds.includes(o.id))
                              }
                              disabled={filteredLedgerOrders.filter(o => !matchedOrderIds.includes(o.id)).length === 0}
                              onChange={(e) => {
                                const unMatched = filteredLedgerOrders.filter(o => !matchedOrderIds.includes(o.id));
                                if (unMatched.length > 0) {
                                  if (e.target.checked) {
                                    updateMatchedOrdersWithRAF([...matchedOrderIds, ...unMatched.map(o => o.id)]);
                                  }
                                } else {
                                  const filteredIdsSet = new Set(filteredLedgerOrders.map(o => o.id));
                                  updateMatchedOrdersWithRAF(matchedOrderIds.filter(id => !filteredIdsSet.has(id)));
                                }
                              }}
                              className="rounded border-slate-800 text-cyan-500 focus:ring-cyan-500 bg-slate-900 accent-cyan-500 h-3.5 w-3.5 cursor-pointer"
                              title="تحديد الكل للتسوية الجماعية"
                            />
                          </th>
                          <th className="px-4 py-3 font-semibold">رقم الطلب</th>
                          <th className="px-4 py-3 font-semibold">صاحب الطلب والتاريخ</th>
                          <th className="px-4 py-3 font-semibold">طريقة السداد / الصندوق</th>
                          <th className="px-4 py-3 font-semibold">مبلغ الحساب المقابل</th>
                          <th className="px-4 py-3 font-semibold">أثر الحالة</th>
                          <th className="px-4 py-3 font-semibold text-center">إجراء المطابقة الفوري</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850/60 font-sans">
                        {paginatedLedgerOrders.map((order) => {
                          const isMatched = matchedOrderIds.includes(order.id);
                          const sarVal = config.exchangeRateSAR > 0 ? (order.totalYER / config.exchangeRateSAR) : (order.totalYER / 140);
                          
                          return (
                            <tr key={order.id} className={`hover:bg-slate-900/35 transition ${isMatched ? 'opacity-60 bg-emerald-950/5' : ''} will-change-gpu`}>
                              {/* Individual Selection Checkbox */}
                              <td className="px-4 py-3.5 text-center">
                                <input
                                  type="checkbox"
                                  checked={isMatched}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      if (!matchedOrderIds.includes(order.id)) {
                                        updateMatchedOrdersWithRAF([...matchedOrderIds, order.id]);
                                      }
                                    } else {
                                      updateMatchedOrdersWithRAF(matchedOrderIds.filter(id => id !== order.id));
                                    }
                                  }}
                                  className="rounded border-slate-800 text-cyan-500 focus:ring-cyan-500 bg-slate-900 accent-cyan-500 h-3.5 w-3.5 cursor-pointer"
                                />
                              </td>
                              <td className="px-4 py-3.5 font-mono">
                                <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-black text-cyan-400 font-mono">
                                  {order.id}
                                </span>
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-bold text-white text-xs">{order.customerName}</span>
                                  {order.customerPhone && (
                                    <span className="text-[10px] text-slate-550 font-mono inline-flex items-center gap-1">
                                      <Phone className="w-3 h-3" /> {order.customerPhone}
                                    </span>
                                  )}
                                  <span className="text-[9px] text-slate-600 font-mono">
                                    {new Date(order.createdAt).toLocaleString('ar-YE', { hour12: true })}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3.5">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-950/40 border border-blue-900/40 text-blue-300 rounded-xl text-[10px] font-bold">
                                  <ShieldCheck className="w-3 h-3 text-blue-400" />
                                  {order.paymentMethod || 'جوالي 770493341'} ({order.cashierId})
                                </span>
                              </td>
                              <td className="px-4 py-3.5 font-mono text-slate-350">
                                <div className="flex flex-col font-sans">
                                  <span className="font-bold text-xs text-slate-200">{order.totalYER.toLocaleString()} ريال يمني</span>
                                  <span className="text-[10px] text-slate-400 font-mono">({sarVal.toFixed(0)} ر.س)</span>
                                </div>
                              </td>
                              <td className="px-4 py-3.5">
                                {order.status === 'COMPLETED' ? (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-950/65 text-emerald-400 font-bold text-[10px] border border-emerald-900/40 rounded-full">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                    جاهز ومكتمل (رصيد حقيقي)
                                  </span>



                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-950/65 text-amber-400 font-bold text-[10px] border border-amber-900/40 rounded-full">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                                      معلق (رصيد بالانتظار)
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3.5 text-center">
                                  {isMatched ? (
                                    <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-black bg-emerald-950/30 px-3 py-1.5 border border-emerald-900/30 rounded-xl">
                                      <CheckCircle2 className="w-4 h-4" />
                                      تمت المطابقة والضبط
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => updateMatchedOrdersWithRAF([...matchedOrderIds, order.id])}
                                      className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-600 active:scale-95 text-slate-950 text-[11px] font-black rounded-xl transition cursor-pointer"
                                    >
                                      تأكيد مطابقة الرصيد بالبوابة
                                    </button>
                                  )}
                                </td>
                              </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Supportive Alert Block */}
                  <div className="p-4 bg-amber-950/20 border border-amber-900/30 rounded-2xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="block text-xs font-bold text-amber-400">إشعار إرشادي لدقة الأرصدة وجرد الخزنة</span>
                      <p className="text-[11px] text-amber-200/80 leading-relaxed">
                        ⚠️ دليل المطابقة الحسابية وجرد الصناديق: المطابقة الدقيقة تتطلب مقارنة الحصيلة في الخزائن والبريد الإلكتروني للتحويل مع الأرقام المسردة أعلاه. اضغط على زر "تأكيد مطابقة الرصيد بالبوابة" لتأكيد تصفية كل معاملة ومطابقتها للتأكد من خلو الوردية الحالية من الفوارق المالية.
                      </p>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* --- GROWTH & CHARTS REPORT SUBTAB --- */}
            {analyticsSubTab === 'GROWTH' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn text-right">
                
                {/* Sales Bar chart */}
                <div className="lg:col-span-8 bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-xl">
                  <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">{language === 'AR' ? 'مخطط المبيعات اليومي المتصاعد' : 'Daily Rolling Revenue Stream'}</h3>
                  <div className="w-full h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyReportData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                        <YAxis stroke="#64748b" fontSize={11} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                        <Bar dataKey="amount" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Cake chart splitting category types */}
                <div className="lg:col-span-4 bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-xl flex flex-col justify-between text-right">
                  <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">جرد تقسيم فئات المبيعات الكلية</h3>
                  <div className="w-full h-64 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categorySplitData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {categorySplitData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-around text-xs mt-2 border-t border-slate-850 pt-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-cyan-500"></span>
                      <span className="text-slate-400">فئات وخدمات رقمية</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                      <span className="text-slate-400">بضائع ومشتريات ملموسة</span>
                    </div>
                  </div>
                </div>

                {/* Cashier Competition Leaderboard */}
                <div className="lg:col-span-12 mt-4 bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-xl text-right">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5 mb-1 text-right">
                        <span>🏆 مسابقة صناديق الكاشير التنافسية (Leaderboard)</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        تحديث حي وترتيب فوري لمستوى حجم مبيعات كل صندوق في الهايبر ماركت
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-amber-950/40 border border-amber-900/50 rounded-full text-[10px] text-amber-300 font-bold tracking-widest uppercase self-start md:self-auto">
                      المسابقة نشطة ⚡
                    </span>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    {/* Leaderboard Chart comparison */}
                    <div className="xl:col-span-5 bg-slate-950 rounded-2xl border border-slate-850 p-4">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-4 text-center">
                        المقارنة البيانية للمبيعات بالريال اليمني
                      </span>
                      <div className="w-full h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={cashierLeaderboard}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="id" stroke="#64748b" fontSize={10} />
                            <YAxis stroke="#64748b" fontSize={10} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                            <Bar dataKey="totalSales" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Leaderboard Table listing */}
                    <div className="xl:col-span-7 overflow-x-auto rounded-2xl border border-slate-850 bg-slate-950 whitespace-nowrap">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-900/60 text-[10px] text-slate-400 uppercase border-b border-slate-850">
                          <tr>
                            <th className="px-4 py-3 text-center">الترتيب</th>
                            <th className="px-4 py-3">مسمى صندوق الكاشير</th>
                            <th className="px-4 py-3 text-center">العمليات</th>
                            <th className="px-4 py-3 text-center">إجمالي المبيعات</th>
                            <th className="px-4 py-3 text-center">نسبة المساهمة</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                          {cashierLeaderboard.map((item, index) => {
                            const totalAllCashiers = cashierLeaderboard.reduce((s, c) => s + c.totalSales, 0) || 1;
                            const percentage = ((item.totalSales / totalAllCashiers) * 100).toFixed(1);
                            
                            let medal = '';
                            if (index === 0) medal = '🥇 الأول';
                            else if (index === 1) medal = '🥈 الثاني';
                            else if (index === 2) medal = '🥉 الثالث';
                            else medal = `🎖️ ${index + 1}`;

                            return (
                              <tr key={item.id} className={`${index === 0 ? 'bg-amber-950/10' : 'hover:bg-slate-900/30'}`}>
                                <td className="px-4 py-3.5 text-center font-bold">
                                  <span className={`px-2 py-0.5 rounded text-[10px] ${
                                    index === 0 ? 'bg-amber-500/20 text-amber-300 font-black border border-amber-500/30' :
                                    index === 1 ? 'bg-slate-500/20 text-slate-300 font-bold' :
                                    index === 2 ? 'bg-orange-500/10 text-orange-300 font-semibold' :
                                    'text-slate-500'
                                  }`}>
                                    {medal}
                                  </span>
                                </td>
                                <td className="px-4 py-3.5">
                                  <div className="flex flex-col">
                                    <span className={`font-bold text-xs ${index === 0 ? 'text-amber-300' : 'text-slate-100'}`}>
                                      {language === 'AR' ? item.nameAR : item.nameEN}
                                    </span>
                                    <span className="text-[9px] text-slate-500 font-mono">id: {item.id}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3.5 text-center font-mono text-slate-300">
                                  {item.trxCount} عمليات
                                </td>
                                <td className="px-4 py-3.5 text-center font-mono font-bold text-white">
                                  {item.totalSales.toLocaleString()} YER
                                </td>
                                <td className="px-4 py-3.5 text-center">
                                  <div className="flex items-center gap-1.5 justify-center max-w-[100px] mx-auto">
                                    <div className="w-12 bg-slate-800 rounded-full h-1.5">
                                      <div 
                                        className={`h-1.5 rounded-full ${index === 0 ? 'bg-amber-400' : 'bg-cyan-500'}`} 
                                        style={{ width: `${Math.min(100, Math.max(5, Number(percentage)))}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-400 font-bold">{percentage}%</span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* 💡 AL-DHEEBANI AUTOMATED INTELLIGENT STRATEGIC ADVISORY & RECOMMENDATIONS TERMINAL */}
                <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-xl space-y-6 text-right mt-6 animate-fadeIn">
                  
                  {/* Title and Badge Header */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-850">
                    <div className="space-y-1">
                      <h3 className="text-base font-black text-white flex items-center gap-2">
                        <span className="p-1.5 bg-yellow-950 text-amber-400 rounded-xl">💡</span>
                        <span>منصة التوصيات التشغيلية الاستشارية للنمو والربحية</span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        تحليلات واقتراحات تلقائية ذكية تعتمد على حجم المعاملات والمخزون الحي والديون النشطة لدعم كفاءة متجر آل ذيبان.
                      </p>
                    </div>
                    
                    {simulationPromoPercent > 0 && (
                      <span className="px-3.5 py-1.5 bg-amber-500/25 border border-amber-500/45 rounded-xl text-xs text-amber-300 font-extrabold animate-pulse flex items-center gap-1.5 self-start md:self-auto justify-end">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                        حملة ترويجية نشطة ({simulationPromoPercent}%) ⚡
                      </span>
                    )}
                  </div>

                  {/* Business Insights Grid (Dynamic evaluations based on actual live state!) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    
                    {/* Insights Card 1: Low stock and restock operations */}
                    <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-cyan-400 font-bold bg-cyan-950/50 px-2 py-0.5 border border-cyan-900/30 rounded-md">
                            تحذيرات المخزون والتموين ⚠️
                          </span>
                          <span className="text-xs text-slate-500 font-mono">Stock Alerts</span>
                        </div>
                        <h4 className="text-xs font-black text-slate-200">الأصناف الحرجة التي شارف مخزونها على النهاية:</h4>
                        
                        {/* List items with < 5 stock */}
                        <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                          {products.filter(p => p.stock < 5).length > 0 ? (
                            products.filter(p => p.stock < 5).slice(0, 3).map(p => (
                              <div key={p.id} className="p-2 bg-slate-900 rounded-xl border border-slate-800 text-[11px] flex justify-between items-center">
                                <span className="font-bold text-slate-300 truncate max-w-[120px]">{p.nameAR}</span>
                                <span className={`px-2 py-0.5 rounded font-mono font-bold leading-none ${
                                  p.stock === 0 ? 'bg-red-950/55 text-red-400 border border-red-900/40' : 'bg-amber-950/55 text-amber-400 border border-amber-900/40'
                                }`}>
                                  {p.stock === 0 ? 'نفذ' : `${p.stock} حبات`}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-4 text-slate-600 text-[11px]">
                              👍 مخزون جميع البضائع الملموسة بحالة ممتازة ومثالية.
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-450 leading-relaxed pt-2 border-t border-slate-850/50 text-slate-450">
                        💡 **اقتراح التموين:** ننصح بجدولة توريد عاجلة للمنتجات أعلاه لتفادي خسارة المبيعات المباشرة.
                      </div>
                    </div>

                    {/* Insights Card 2: Strategic financial exposure (outstanding debt) */}
                    <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-red-400 font-bold bg-red-950/40 px-2 py-0.5 border border-red-900/30 rounded-md">
                            تنبيه مخاطر الذمم والديون 📉
                          </span>
                          <span className="text-xs text-slate-500 font-mono">Credit Risk</span>
                        </div>
                        <h4 className="text-xs font-black text-slate-200">العملاء الأعلى مديونية بالدفتر آجل:</h4>

                        <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                          {debts.filter(d => d.totalDebtYER > 15000).length > 0 ? (
                            debts.filter(d => d.totalDebtYER > 15000).slice(0, 3).map(d => (
                              <div key={d.id} className="p-2 bg-slate-900 rounded-xl border border-slate-800 text-[11px] flex justify-between items-center">
                                <span className="font-bold text-slate-300 truncate max-w-[120px]">{d.customerName}</span>
                                <span className="font-mono text-red-400 font-black">
                                  {d.totalDebtYER.toLocaleString()} YER
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-4 text-slate-600 text-[11px]">
                              🟢 ديون العملاء المفتوحة ضمن الحدود النقدية الآمنة للمتجر.
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-450 leading-relaxed pt-2 border-t border-slate-850/50 text-slate-450">
                        ⚠️ **اقتراح الفحص:** يوصى بمراجعة الحد الائتماني لكل عميل، وتجميد التحويلات الفورية التلقائية لمن يتجاوز 25,000 ريال يمني.
                      </div>
                    </div>

                    {/* Insights Card 3: Traffic and categories trends */}
                    <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-900/25 px-2 py-0.5 border border-emerald-900/30 rounded-md">
                            فرص الاستثمار الأفضل رواجاً 🚀
                          </span>
                          <span className="text-xs text-slate-500 font-mono">Performance Trends</span>
                        </div>
                        <h4 className="text-xs font-black text-slate-200">الصندوق المتصدر في الوردية:</h4>

                        <div className="p-3 bg-slate-900 rounded-xl border border-slate-850 space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-amber-400">
                              🥇 {cashierLeaderboard[0] ? (language === 'AR' ? cashierLeaderboard[0].nameAR : cashierLeaderboard[0].nameEN) : 'صندوق مبيعات الكاشير'}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">Rank #1</span>
                          </div>
                          <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                            <span>إجمالي المبيعات المحققة:</span>
                            <span className="font-bold text-white">
                              {cashierLeaderboard[0] ? cashierLeaderboard[0].totalSales.toLocaleString() : '0'} YER
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1 text-[11px] text-slate-400 leading-normal">
                          <span>الخدمات الأكثر طلباً:</span>
                          <span className="font-bold text-cyan-400 block">باقات يمن موبايل و فلكسي الرقمية السريعة</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-450 leading-relaxed pt-2 border-t border-slate-850/50 text-slate-450">
                        📈 **اقتراح النمو:** زيادة ترويج البطاقات الرقمية بالجملة واستثمار السيولة المحصلة في توسعة مستودع المواد التموينية الأكثر استقراراً في السعر.
                      </div>
                    </div>

                  </div>

                  {/* Dynamic Simulation Actions Console Card */}
                  <div className="p-5 bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800 rounded-2xl">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>🛠️ وحدة محاكاة التسويق واتخاذ القرارات التشغيلية السريعة</span>
                        </span>
                        <p className="text-[11px] text-slate-400">
                          قم بتطبيق حلول ترويجية فورية في النظام بهدف تنشيط المبيعات وتسريع تدوير المخزون الراكد، أو تصدير التقارير.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2.5 w-full lg:w-auto">
                        {simulationPromoPercent === 0 ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSimulationPromoPercent(10);
                            }}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 transition-colors text-slate-950 text-xs font-black rounded-xl cursor-pointer"
                          >
                            ⚡ إطلاق حملة خصم ترويجي 10% فوراً
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSimulationPromoPercent(0);
                            }}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors text-slate-300 text-xs font-medium rounded-xl cursor-pointer"
                          >
                            ❌ إلغاء وتصفية الحملة النشطة
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            alert('تمت جدولة وتأكيد مراجعة الجرد البديل وتحديث الوردية وحفظ الملاحظات بنجاح 🚀');
                          }}
                          className="px-4 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-850 text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
                        >
                          📋 جدولة جرد يدوي شامل
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            window.print();
                          }}
                          className="px-4 py-2 bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-850/50 text-xs font-black rounded-xl cursor-pointer flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>تحميل بيان التوصيات PDF</span>
                        </button>
                      </div>
                    </div>

                    {/* Active Promotion Info Box */}
                    {simulationPromoPercent > 0 && (
                      <div className="mt-4 p-3 bg-amber-950/20 border border-amber-900/30 rounded-xl text-amber-200/90 text-[11px] leading-relaxed animate-pulse">
                        💡 **حملة ترويجية نشطة:** يُظهر النظام لزوار المعرض أسعاراً تفضيلية منخفضة بنسبة {simulationPromoPercent}% على بعض فئات البطاقات الرقمية والسلع لزيادة رغبة الشراء الفورية اليوم وتحقيق مبيعات قياسية.
                      </div>
                    )}
                  </div>

                </div>

              </div>
            )}

          </div>
        )}

        {/* 2️⃣ STORE SETTINGS TAB CONTENT (ADMIN ONLY) */}
        {activeTab === 'SETTINGS' && isAdmin && (
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-xl max-w-3xl animate-fadeIn">
            <h3 className="text-sm font-bold text-white mb-1 uppercase tracking-wider">{language === 'AR' ? 'تعديل هوية وإعدادات النظام المشتركة' : 'Global Core Configurations Console'}</h3>
            <p className="text-xs text-slate-500 mb-6">{language === 'AR' ? 'تؤثر التعديلات هنا فوراً على الهيدر وشريط التمرير ومحرك الصرف أمام كل المتسوقين.' : 'Modifying values instantly propagates change flags down to index, header and cart templates.'}</p>
            
            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-bold">{language === 'AR' ? 'الاسم التجاري عربي:' : 'Trade Identity (Arabic):'}</label>
                  <input
                    type="text"
                    required
                    value={config.shopNameAR}
                    onChange={(e) => setConfig({ ...config, shopNameAR: e.target.value })}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-bold">{language === 'AR' ? 'الاسم التجاري إنجليزي:' : 'Trade Identity (English):'}</label>
                  <input
                    type="text"
                    required
                    value={config.shopNameEN}
                    onChange={(e) => setConfig({ ...config, shopNameEN: e.target.value })}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-bold">{language === 'AR' ? 'أيقونة اللوجو شعار الطمغة:' : 'App Logo Emoji:'}</label>
                  <input
                    type="text"
                    required
                    value={config.logoEmoji}
                    onChange={(e) => setConfig({ ...config, logoEmoji: e.target.value })}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-center text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-bold">{language === 'AR' ? 'صرف صرف الدولار مقابل الريال اليمني YER:' : 'Exchange Rate USD/YER:'}</label>
                  <input
                    type="number"
                    required
                    value={config.exchangeRateUSD}
                    onChange={(e) => setConfig({ ...config, exchangeRateUSD: Number(e.target.value) })}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono text-center"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-bold">{language === 'AR' ? 'صرف صرف السعودي مقابل الريال اليمني YER:' : 'Exchange Rate SAR/YER:'}</label>
                  <input
                    type="number"
                    required
                    value={config.exchangeRateSAR}
                    onChange={(e) => setConfig({ ...config, exchangeRateSAR: Number(e.target.value) })}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono text-center"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-bold">{language === 'AR' ? 'شريط الإعلانات عربي:' : 'Marquee Announcement Ticker (Arabic):'}</label>
                <textarea
                  required
                  value={config.tickerTextAR}
                  onChange={(e) => setConfig({ ...config, tickerTextAR: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white h-20 resize-none focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-bold">{language === 'AR' ? 'شريط الإعلانات إنجليزي:' : 'Marquee Announcement Ticker (English):'}</label>
                <textarea
                  required
                  value={config.tickerTextEN}
                  onChange={(e) => setConfig({ ...config, tickerTextEN: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white h-20 resize-none focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                className="py-3 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer md:w-fit self-end"
              >
                <Save className="w-4.5 h-4.5" />
                <span>{language === 'AR' ? 'حفظ المكونات الحالية' : 'Save Configurations Lock'}</span>
              </button>
            </form>
          </div>
        )}

        {/* 3️⃣ INVENTORY TAB CONTENT */}
        {activeTab === 'INVENTORY' && (isAdmin || pCheck.editInventory) && (
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-xl animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3 border-b border-slate-850 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">{language === 'AR' ? 'إدارة الأصناف وجرد الكتالوج الشامل' : 'Commercial Warehouse Catalog and Stock Control'}</h3>
                <p className="text-[11px] text-slate-500 mt-1">{language === 'AR' ? 'تحكم كامل بأسعار وصور وأقسام المنتجات الرقمية والملموسة وتحديثها فوريًا بالمعرض.' : 'Add, edit, categorize, price, and delete products inside the system'}</p>
              </div>
              
              {inventorySubTab === 'PRODUCTS' && !isAddingProduct && !fullEditingProduct && (
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingProduct(true);
                    setFullEditingProduct(null);
                    setProductForm({
                      id: `prod-${Date.now()}`,
                      nameAR: '',
                      nameEN: '',
                      descriptionAR: '',
                      descriptionEN: '',
                      category: categories[0]?.id || 'PHYSICAL_GROCERY',
                      brand: '',
                      priceYER: 1000,
                      imageUrl: 'https://images.unsplash.com/photo-1546054454-aa26e2b734c7?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
                      isAvailable: true,
                      stock: 50,
                      rechargeAmount: ''
                    });
                  }}
                  className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-455 hover:to-indigo-555 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-lg select-none cursor-pointer self-start"
                >
                  <Plus className="w-4 h-4 text-slate-950" />
                  <span>{language === 'AR' ? 'إضافة صنف جديد' : 'Add New Product'}</span>
                </button>
              )}

              {inventorySubTab === 'CATEGORIES' && !isAddingCategory && !fullEditingCategory && (
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingCategory(true);
                    setFullEditingCategory(null);
                    setCategoryForm({
                      id: '',
                      nameAR: '',
                      nameEN: '',
                      icon: 'Layers',
                      color: 'from-slate-900 to-slate-955'
                    });
                  }}
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-455 hover:to-teal-555 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-lg select-none cursor-pointer self-start"
                >
                  <Plus className="w-4 h-4 text-slate-950" />
                  <span>{language === 'AR' ? 'إضافة قسم جديد' : 'Add New Category'}</span>
                </button>
              )}
            </div>

            {/* SUB-TABS SELECTOR FOR INVENTORY */}
            <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-850 mb-6 w-fit select-none font-sans">
              <button
                type="button"
                onClick={() => setInventorySubTab('PRODUCTS')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  inventorySubTab === 'PRODUCTS'
                    ? 'bg-slate-800 text-cyan-400 font-extrabold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                📦 {language === 'AR' ? 'المنتجات والسلع' : 'Products & Catalog'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setInventorySubTab('CATEGORIES');
                  setIsAddingCategory(false);
                  setFullEditingCategory(null);
                  setCategoryForm({ id: '', nameAR: '', nameEN: '', icon: 'Layers', color: 'from-slate-900 to-slate-950' });
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  inventorySubTab === 'CATEGORIES'
                    ? 'bg-slate-800 text-cyan-400 font-extrabold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🏷️ {language === 'AR' ? 'أقسام المتجر الرئيسية' : 'Store Categories'}
              </button>
            </div>

            {inventorySubTab === 'PRODUCTS' ? (
              <>
                {/* Dynamic Product Form Panel (Expandable slide-down for Add/Edit) */}
                {(isAddingProduct || fullEditingProduct) && (
              <motion.form
                onSubmit={handleSaveFullProduct}
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', damping: 22, stiffness: 160 }}
                className="mb-8 p-5 bg-slate-950 border border-slate-800 rounded-3xl space-y-4 shadow-2xl text-slate-100"
              >
                <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                  <span className="text-xs font-black text-amber-400 tracking-wider uppercase flex items-center gap-1.5 font-mono">
                    <Sparkles className="w-4.5 h-4.5 text-amber-400" />
                    <span>{isAddingProduct 
                      ? (language === 'AR' ? 'تسجيل صنف جديد فخم' : 'Register New Hybrid Catalog Product')
                      : (language === 'AR' ? `تعديل الصنف الشامل: ${fullEditingProduct?.nameAR}` : `Deep Edit Product: ${fullEditingProduct?.nameEN}`)}
                    </span>
                  </span>
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsAddingProduct(false);
                      setFullEditingProduct(null);
                    }}
                    className="text-slate-400 hover:text-white text-xs font-sans px-3 py-1 bg-slate-900 rounded-lg hover:bg-slate-850 border border-slate-800"
                  >
                    {language === 'AR' ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* ID */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{language === 'AR' ? 'رقم الكود الفرعي (ID/كود):' : 'Unique ID / Code:'}</label>
                    <input
                      type="text"
                      disabled={!!fullEditingProduct}
                      placeholder="eg. ph-el-honey5"
                      value={productForm.id}
                      onChange={(e) => setProductForm({ ...productForm, id: e.target.value })}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-700 disabled:opacity-50"
                    />
                  </div>

                  {/* Name AR */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{language === 'AR' ? 'اسم الصنف بالعربية:' : 'Product Name (Arabic):'}</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: عسل سدر عاصم"
                      value={productForm.nameAR}
                      onChange={(e) => setProductForm({ ...productForm, nameAR: e.target.value })}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-705"
                    />
                  </div>

                  {/* Name EN */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{language === 'AR' ? 'الاسم بالإنجليزية:' : 'Product Name (English):'}</label>
                    <input
                      type="text"
                      required
                      placeholder="eg. Premium Sidr Honey"
                      value={productForm.nameEN}
                      onChange={(e) => setProductForm({ ...productForm, nameEN: e.target.value })}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-705 font-mono"
                    />
                  </div>

                  {/* Price */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">{language === 'AR' ? 'السعر كاش بالريال اليمني (YER):' : 'Base Selling YER Price:'}</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={productForm.priceYER}
                      onChange={(e) => setProductForm({ ...productForm, priceYER: Number(e.target.value) })}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>

                  {/* Stock */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{language === 'AR' ? 'الكمية المستودعية (المخزون):' : 'Warehouse Stock Count:'}</label>
                    <input
                      type="number"
                      value={productForm.stock}
                      onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>

                  {/* Category select */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">{language === 'AR' ? 'تصنيف الصنف (القسم الرئيسي):' : 'Category Section:'}</label>
                    <select
                      value={productForm.category}
                      onChange={(e: any) => setProductForm({ ...productForm, category: e.target.value })}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-sans cursor-pointer focus:outline-none"
                    >
                      {categories && categories.length > 0 ? (
                        categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {language === 'AR' ? `${c.icon || '🏷️'} ${c.nameAR}` : `${c.icon || '🏷️'} ${c.nameEN}`}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="PHYSICAL_GROCERY">{language === 'AR' ? '🥩 سلع مادية ومواد غذائية تنزيلية' : 'Groceries & Foods'}</option>
                          <option value="PHYSICAL_ELECTRONICS">{language === 'AR' ? '🔌 أجهزة كهربائية وإلكترونيات ملموسة' : 'Electronics & Hardware'}</option>
                          <option value="DIGITAL_RECHARGE">{language === 'AR' ? '📶 باقات شحن فوري وأرصدة' : 'Telecom Airtime Credits'}</option>
                          <option value="DIGITAL_GAME">{language === 'AR' ? '🎮 شدات وأكواد ألعاب فوري' : 'Digital Games & Pin codes'}</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Brand / Provider */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{language === 'AR' ? 'العلامة التجارية / الشركة:' : 'Brand / Network Operator:'}</label>
                    <input
                      type="text"
                      placeholder="eg. MTN, Sabafon, Ghee, Al-Okbi"
                      value={productForm.brand || ''}
                      onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-700"
                    />
                  </div>

                  {/* Image URL */}
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{language === 'AR' ? 'رابط خادم الصورة للسلعة:' : 'Visual Image CDN URL:'}</label>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/..."
                      value={productForm.imageUrl}
                      onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-705 font-mono"
                    />
                  </div>

                  {/* Description AR */}
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{language === 'AR' ? 'شرح ووصف الغلاف عربي:' : 'Arabic Description:'}</label>
                    <input
                      type="text"
                      value={productForm.descriptionAR}
                      onChange={(e) => setProductForm({ ...productForm, descriptionAR: e.target.value })}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-705"
                    />
                  </div>

                  {/* Description EN */}
                  <div className="flex flex-col gap-1 md:col-span-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{language === 'AR' ? 'شرح بالإنجليزية:' : 'English Description:'}</label>
                    <input
                      type="text"
                      value={productForm.descriptionEN}
                      onChange={(e) => setProductForm({ ...productForm, descriptionEN: e.target.value })}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-705 font-mono"
                    />
                  </div>

                  {/* Availability Checked */}
                  <div className="flex items-center gap-3 bg-slate-900 p-2.5 rounded-xl border border-slate-800 self-end">
                    <input
                      type="checkbox"
                      id="form-is-available"
                      checked={productForm.isAvailable}
                      onChange={(e) => setProductForm({ ...productForm, isAvailable: e.target.checked })}
                      className="w-4 h-4 text-cyan-500 bg-slate-950 border-slate-800 rounded cursor-pointer"
                    />
                    <label htmlFor="form-is-available" className="text-xs text-slate-300 font-bold cursor-pointer select-none">
                      {language === 'AR' ? 'عرض فوري للجمهور بالمعرض' : 'Available for Customers'}
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-850">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-450 hover:to-teal-550 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{language === 'AR' ? 'حفظ الصنف ونشره بالخادم' : 'Deploy Product to Live Catalog'}</span>
                  </button>
                </div>
              </motion.form>
            )}
            
            {/* 🛠️ HIGHLY INTERACTIVE PRODUCT CATALOG CONTROLS TOOLBAR */}
            <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4 mb-4 flex flex-col sm:flex-row items-center gap-3 justify-between select-none">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <span className={`absolute inset-y-0 ${language === 'AR' ? 'left-3' : 'right-3'} flex items-center pointer-events-none`}>
                    <Search className="h-4 w-4 text-slate-500" />
                  </span>
                  <input
                    type="text"
                    placeholder={language === 'AR' ? 'البحث عن منتج بالاسم أو كود...' : 'Search by name, ID or brand...'}
                    value={adminProductSearch}
                    onChange={(e) => setAdminProductSearch(e.target.value)}
                    className={`w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl ${language === 'AR' ? 'pl-9 pr-3' : 'pr-9 pl-3'} py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none`}
                  />
                  {adminProductSearch && (
                    <button
                      type="button"
                      onClick={() => setAdminProductSearch('')}
                      className={`absolute inset-y-0 ${language === 'AR' ? 'left-3' : 'right-3'} flex items-center text-slate-500 hover:text-white`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <select
                  value={adminProductCategoryFilter}
                  onChange={(e) => setAdminProductCategoryFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-sans cursor-pointer focus:outline-none focus:border-cyan-500"
                >
                  <option value="ALL">📍 {language === 'AR' ? 'جميع الأقسام' : 'All Categories'}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon && c.icon.length <= 3 ? c.icon : '🏷️'} {language === 'AR' ? c.nameAR : c.nameEN}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset interactive parameters helper */}
              {(adminProductSearch !== '' || adminProductCategoryFilter !== 'ALL' || adminProductSort.field !== 'none') && (
                <button
                  type="button"
                  onClick={() => {
                    setAdminProductSearch('');
                    setAdminProductCategoryFilter('ALL');
                    setAdminProductSort({ field: 'none', direction: 'asc' });
                  }}
                  className="px-3 py-1.5 text-[10px] font-black uppercase text-amber-500 border border-amber-500/30 hover:bg-amber-500/10 rounded-lg flex items-center gap-1 cursor-pointer transition-colors w-full sm:w-auto justify-center"
                >
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>{language === 'AR' ? 'تعيين افتراضي' : 'Reset Filters'}</span>
                </button>
              )}

              <div className="text-[10px] text-slate-500 font-bold font-mono uppercase bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-850/60 w-full sm:w-auto text-center">
                {language === 'AR' ? `متاح: ${filteredAndSortedProducts.length} من أصل ${products.length}` : `Result: ${filteredAndSortedProducts.length} of ${products.length} products`}
              </div>
            </div>

            <div className="overflow-x-auto relative rounded-2xl border border-slate-850 bg-slate-950 whitespace-nowrap">
              <table className="w-full text-right md:text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-[10px] text-slate-450 uppercase font-mono border-b border-slate-850">
                  <tr>
                    <th 
                      onClick={() => handleToggleSort('name')}
                      className="px-5 py-4 cursor-pointer hover:bg-slate-800/40 hover:text-cyan-400 select-none transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <span>{language === 'AR' ? 'الصنف ومدرجه' : 'Product Descriptor'}</span>
                        {adminProductSort.field === 'name' ? (
                          <span className="text-[10px] text-cyan-400 font-mono">{adminProductSort.direction === 'asc' ? '▲' : '▼'}</span>
                        ) : (
                          <span className="text-[9px] text-slate-600 opacity-40 font-mono">⇅</span>
                        )}
                      </div>
                    </th>
                    <th className="px-5 py-4 text-center">{language === 'AR' ? 'القسم' : 'Category'}</th>
                    <th 
                      onClick={() => handleToggleSort('price')}
                      className="px-5 py-4 text-center cursor-pointer hover:bg-slate-805/40 hover:text-cyan-400 select-none transition-colors"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>{language === 'AR' ? 'السعر كاش YER' : 'Base Price (YER)'}</span>
                        {adminProductSort.field === 'price' ? (
                          <span className="text-[10px] text-cyan-400 font-mono">{adminProductSort.direction === 'asc' ? '▲' : '▼'}</span>
                        ) : (
                          <span className="text-[9px] text-slate-600 opacity-40 font-mono">⇅</span>
                        )}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleToggleSort('stock')}
                      className="px-5 py-4 text-center cursor-pointer hover:bg-slate-805/40 hover:text-cyan-400 select-none transition-colors"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>{language === 'AR' ? 'البوك / المخزن تصفية' : 'Inventory / Status'}</span>
                        {adminProductSort.field === 'stock' ? (
                          <span className="text-[10px] text-cyan-400 font-mono">{adminProductSort.direction === 'asc' ? '▲' : '▼'}</span>
                        ) : (
                          <span className="text-[9px] text-slate-600 opacity-40 font-mono">⇅</span>
                        )}
                      </div>
                    </th>
                    <th className="px-5 py-4 text-center">{language === 'AR' ? 'عمليات وتعديل' : 'Actions Lock'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {filteredAndSortedProducts.map((prod) => {
                    const isEditing = editingProduct === prod.id;
                    return (
                      <tr key={prod.id} className="hover:bg-slate-900/40">
                        {/* Name */}
                        <td className="px-5 py-4 flex items-center gap-3">
                          <img src={prod.imageUrl} className="w-10 h-10 rounded-lg object-cover" />
                          <div className="flex flex-col">
                            <span className="font-bold text-white text-xs">{language === 'AR' ? prod.nameAR : prod.nameEN}</span>
                            <span className="text-[10px] text-slate-500 font-mono">ID: {prod.id}</span>
                          </div>
                        </td>
                        {/* Category */}
                        <td className="px-5 py-4 text-center">
                          <span className="px-2.5 py-1 text-[9px] font-black uppercase rounded bg-slate-900 border border-slate-800 text-slate-400">
                            {prod.category}
                          </span>
                        </td>
                        {/* Price */}
                        <td className="px-5 py-4 text-center font-mono font-bold text-white">
                          {isEditing ? (
                            <input
                              type="number"
                              value={inventoryForm.priceYER}
                              onChange={(e) => setInventoryForm({ ...inventoryForm, priceYER: Number(e.target.value) })}
                              className="w-24 bg-slate-900 border border-slate-700 rounded p-1 text-center font-mono text-xs"
                            />
                          ) : (
                            `${prod.priceYER.toLocaleString()} YER`
                          )}
                        </td>
                        {/* Stock */}
                        <td className="px-5 py-4 text-center">
                          {isEditing ? (
                            prod.stock !== undefined ? (
                              <input
                                type="number"
                                value={inventoryForm.stock}
                                onChange={(e) => setInventoryForm({ ...inventoryForm, stock: Number(e.target.value) })}
                                className="w-16 bg-slate-900 border border-slate-700 rounded p-1 text-center font-mono text-xs"
                              />
                            ) : (
                              <span className="text-slate-500 font-mono">Unlimited (API)</span>
                            )
                          ) : (
                            prod.stock !== undefined ? (
                              <span className={`font-mono text-xs px-2 py-0.5 rounded ${prod.stock <= 5 ? 'text-amber-400 bg-amber-950/20 font-bold' : 'text-slate-400'}`}>
                                {prod.stock} Items
                              </span>
                            ) : (
                              <span className="text-cyan-400 font-mono text-[10px] uppercase font-bold">📡 Direct API Delivery</span>
                            )
                          )}
                        </td>
                        {/* Actions */}
                        <td className="px-5 py-4 text-center">
                          {isEditing ? (
                            <div className="flex justify-center gap-1.5">
                              <button
                                onClick={() => handleSaveProductInventory(prod.id)}
                                className="p-1 px-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] rounded flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Save</span>
                              </button>
                              <button
                                onClick={() => setEditingProduct(null)}
                                className="p-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] rounded cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              {/* Quick edit */}
                              <button
                                onClick={() => {
                                  setEditingProduct(prod.id);
                                  setInventoryForm({
                                    priceYER: prod.priceYER,
                                    stock: prod.stock || 0,
                                    isAvailable: prod.isAvailable
                                  });
                                }}
                                className="px-2 py-1 bg-slate-900 border border-slate-800 hover:border-cyan-500 text-[10px] font-bold text-cyan-400 rounded-lg flex items-center gap-1 cursor-pointer"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>{language === 'AR' ? 'سريع' : 'Quick'}</span>
                              </button>

                              {/* Deep Edit */}
                              <button
                                onClick={() => {
                                  setFullEditingProduct(prod);
                                  setIsAddingProduct(false);
                                  setProductForm({
                                    id: prod.id,
                                    nameAR: prod.nameAR,
                                    nameEN: prod.nameEN,
                                    descriptionAR: prod.descriptionAR || '',
                                    descriptionEN: prod.descriptionEN || '',
                                    category: prod.category || 'PHYSICAL_GROCERY',
                                    brand: prod.brand || '',
                                    priceYER: prod.priceYER,
                                    imageUrl: prod.imageUrl,
                                    isAvailable: prod.isAvailable,
                                    stock: prod.stock || 0,
                                    rechargeAmount: prod.rechargeAmount || ''
                                  });
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="px-2 py-1 bg-slate-900 border border-slate-800 hover:border-amber-400 text-[10px] font-bold text-amber-400 rounded-lg flex items-center gap-1 cursor-pointer"
                              >
                                <Sparkles className="w-3 h-3" />
                                <span>{language === 'AR' ? 'كامل' : 'Full'}</span>
                              </button>

                              {/* Hard Delete */}
                              <button
                                onClick={() => {
                                  if (confirm(language === 'AR' ? 'هل أنت متأكد من حذف هذا المنتج نهائياً من الهايبر ماركت؟' : 'Are you sure you want to permanently delete this product?')) {
                                    handleDeleteProduct(prod.id);
                                  }
                                }}
                                className="p-1 px-1.5 bg-red-950/40 border border-red-900/40 hover:border-red-500 hover:bg-red-900/20 text-red-400 rounded-lg cursor-pointer transition-colors"
                                title="Delete Product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          /* CATEGORIES SUB-TAB CONTENT */
          <div className="space-y-6">
            {/* Dynamic Category Form Panel */}
            {(isAddingCategory || fullEditingCategory) && (
              <form onSubmit={handleSaveCategory} className="p-5 bg-slate-950 border border-slate-800 rounded-3xl space-y-4 shadow-2xl animate-fadeIn text-slate-100">
                <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                  <span className="text-xs font-black text-emerald-400 tracking-wider uppercase flex items-center gap-1.5 font-mono">
                    <Sparkles className="w-4.5 h-4.5 text-emerald-400" />
                    <span>
                      {isAddingCategory 
                        ? (language === 'AR' ? 'إنشاء قسم رئيسي جديد' : 'Create New Store Category')
                        : (language === 'AR' ? `تعديل القسم: ${fullEditingCategory?.nameAR}` : `Edit Category: ${fullEditingCategory?.nameEN}`)
                      }
                    </span>
                  </span>
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsAddingCategory(false);
                      setFullEditingCategory(null);
                    }}
                    className="text-slate-400 hover:text-white text-xs font-sans px-3 py-1 bg-slate-900 rounded-lg hover:bg-slate-850 border border-slate-800"
                  >
                    {language === 'AR' ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* ID / Code of category */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {language === 'AR' ? 'كود القسم الفريد (ID بالإنجليزية فقط):' : 'Unique Category ID (uppercase, no space):'}
                    </label>
                    <input
                      type="text"
                      required
                      disabled={!!fullEditingCategory}
                      placeholder="e.g. ELECTRONICS, CARDS, HONEY"
                      value={categoryForm.id}
                      onChange={(e) => setCategoryForm({ ...categoryForm, id: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white uppercase font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  {/* Icon */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {language === 'AR' ? 'أيقونة القسم (إما اسم أيقونة أو إيموجي):' : 'Category Icon (lucide name e.g. Smartphone, Laptop, Apple, Gamepad2 or an Emoji):'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Smartphone / Gamepad2 / Apple / Laptop / 🍯 / 🥩"
                      value={categoryForm.icon}
                      onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-sans focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  {/* Name AR */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {language === 'AR' ? 'الاسم باللغة العربية:' : 'Name (Arabic):'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="أجهزة المنزل الذكية"
                      value={categoryForm.nameAR}
                      onChange={(e) => setCategoryForm({ ...categoryForm, nameAR: e.target.value })}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-sans focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  {/* Name EN */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {language === 'AR' ? 'الاسم باللغة الإنجليزية:' : 'Name (English):'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Smart Home Appliances"
                      value={categoryForm.nameEN}
                      onChange={(e) => setCategoryForm({ ...categoryForm, nameEN: e.target.value })}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-sans focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  {/* Color gradient styling config */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {language === 'AR' ? 'نمط التدرج اللوني لخلفية الزر (Tailwind gradient):' : 'Background Gradient Class (Tailwind CSS):'}
                    </label>
                    <input
                      type="text"
                      placeholder="from-slate-900 to-indigo-950/20"
                      value={categoryForm.color}
                      onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1 w-full sm:w-fit self-end text-center"
                >
                  <Check className="w-4.5 h-4.5" />
                  <span>{language === 'AR' ? 'حفظ القسم' : 'Save Category'}</span>
                </button>
              </form>
            )}

            {/* Categories List grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" dir={language === 'AR' ? 'rtl' : 'ltr'}>
              {categories.map((cat) => {
                const productCount = products.filter(p => p.category === cat.id).length;
                return (
                  <div 
                    key={cat.id} 
                    className="bg-slate-950 border border-slate-850 hover:border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3 transition-all group hover:bg-[#0c1324]/50"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-850 flex items-center justify-center text-white">
                          {cat.icon && cat.icon.length <= 3 ? (
                            <span className="text-xl leading-none">{cat.icon}</span>
                          ) : (
                            <Layers className="w-5 h-5 text-emerald-400" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-white group-hover:text-emerald-400 transition-colors">
                            {language === 'AR' ? cat.nameAR : cat.nameEN}
                          </h4>
                          <p className="text-[10px] text-slate-500 font-mono uppercase mt-0.5">{cat.id}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Edit */}
                        <button
                          onClick={() => {
                            setFullEditingCategory(cat);
                            setIsAddingCategory(false);
                            setCategoryForm({
                              id: cat.id,
                              nameAR: cat.nameAR,
                              nameEN: cat.nameEN,
                              icon: cat.icon || 'Layers',
                              color: cat.color || 'from-slate-900 to-slate-955'
                            });
                          }}
                          className="p-1 px-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 rounded-lg text-[10px] font-bold flex items-center justify-center cursor-pointer"
                          title="Edit Category Name & Icon"
                        >
                          <Sparkles className="w-3 h-3" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-1 px-1.5 bg-slate-900 hover:bg-red-950/40 text-red-450 border border-slate-800 hover:border-red-900 rounded-lg text-[10px] font-bold flex items-center justify-center cursor-pointer"
                          title="Delete Category"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-900/60 pt-3">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                        {language === 'AR' ? 'عدد المنتجات المسجلة:' : 'Registered Products:'}
                      </span>
                      <span className="text-xs font-black text-indigo-400 font-mono bg-indigo-950/40 px-2 py-0.5 rounded-md border border-indigo-900/40">
                        {productCount} {language === 'AR' ? 'صنف' : 'items'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    )}

    {/* 4️⃣ STAFF PRIVILEGES TAB CONTENT */}
        {activeTab === 'STAFF' && isAdmin && (
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-xl animate-fadeIn">
            <h3 className="text-sm font-bold text-white mb-1 uppercase tracking-wider">{language === 'AR' ? 'نظام الصلاحيات الصارم وهيكلية التشغيل' : 'Staffing Corporate Permissions Blueprint Matrix'}</h3>
            <p className="text-xs text-slate-500 mb-6">{language === 'AR' ? 'حدد للموظفين صلاحياتهم بدقة لمنع الخلط وتذبذب البيانات بين الصناديق والشبكات.' : 'Limit dashboard nodes or inventory grids across cashiers and telecom clerks.'}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {staffList.map((staff) => (
                <div key={staff.id} className="bg-slate-950 border border-slate-850 rounded-2xl p-5 flex flex-col justify-between shadow-lg relative">
                  <div>
                    <div className="flex items-center gap-2 mb-3.5">
                      <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center font-black text-amber-500">
                        👤
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">{staff.username}</h4>
                        <span className="text-[10px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-400 uppercase font-mono">{staff.role}</span>
                      </div>
                    </div>

                    {/* Permissions checklist */}
                    <div className="space-y-3.5 mt-4 pt-4 border-t border-slate-900">
                      <span className="text-[9px] text-slate-550 uppercase tracking-wider font-mono font-bold block mb-1">PRIVILEGES ASSIGNED</span>
                      
                      {/* View Sales */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">{language === 'AR' ? 'رؤية المبيعات والمداخيل:' : 'View Revenues:'}</span>
                        <button
                          onClick={() => handleTogglePermission(staff.id, 'viewSales', !staff.permissions.viewSales)}
                          className="cursor-pointer"
                        >
                          {staff.permissions.viewSales ? <ToggleRight className="w-7 h-7 text-emerald-400" /> : <ToggleLeft className="w-7 h-7 text-slate-650 text-slate-600" />}
                        </button>
                      </div>

                      {/* View Recharges */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">{language === 'AR' ? 'رؤية باقات شحن الرصيد:' : 'View Telecommunications:'}</span>
                        <button
                          onClick={() => handleTogglePermission(staff.id, 'viewRecharges', !staff.permissions.viewRecharges)}
                          className="cursor-pointer"
                        >
                          {staff.permissions.viewRecharges ? <ToggleRight className="w-7 h-7 text-emerald-400" /> : <ToggleLeft className="w-7 h-7 text-slate-650 text-slate-600" />}
                        </button>
                      </div>

                      {/* Edit inventory */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">{language === 'AR' ? 'تعديل السلع والمخزون:' : 'Edit Stock and Prices:'}</span>
                        <button
                          onClick={() => handleTogglePermission(staff.id, 'editInventory', !staff.permissions.editInventory)}
                          className="cursor-pointer"
                        >
                          {staff.permissions.editInventory ? <ToggleRight className="w-7 h-7 text-emerald-400" /> : <ToggleLeft className="w-7 h-7 text-slate-650 text-slate-600" />}
                        </button>
                      </div>

                      {/* Manage Staff staff */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">{language === 'AR' ? 'إدارة الموظفين والامتيازات:' : 'Manage Privileges:'}</span>
                        <button
                          onClick={() => handleTogglePermission(staff.id, 'manageStaff', !staff.permissions.manageStaff)}
                          className="cursor-pointer"
                        >
                          {staff.permissions.manageStaff ? <ToggleRight className="w-7 h-7 text-emerald-400" /> : <ToggleLeft className="w-7 h-7 text-slate-650 text-slate-600" />}
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5️⃣ CLIENTS DEBTS TAB CONTENT */}
        {activeTab === 'DEBTS' && (isAdmin || pCheck.viewSales) && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
            
            {/* Registered clients ledgers */}
            <div className="lg:col-span-8 bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">{language === 'AR' ? 'دفتر الديون النشطة والذمم المفتوحة للمتجر' : 'Outstanding Client Accounts Ledger'}</h3>
              
              <div className="overflow-x-auto relative rounded-2xl border border-slate-850 bg-slate-950 whitespace-nowrap">
                <table className="w-full text-right md:text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-[10px] text-slate-450 uppercase font-mono border-b border-slate-850">
                    <tr>
                      <th className="px-4 py-3">{language === 'AR' ? 'اسم العميل' : 'Debtor Details'}</th>
                      <th className="px-4 py-3 text-center">{language === 'AR' ? 'رقم الهاتف' : 'Phone'}</th>
                      <th className="px-4 py-3 text-center">{language === 'AR' ? 'المبلغ المتبقي YER' : 'Total Debt (YER)'}</th>
                      <th className="px-4 py-3 text-center">{language === 'AR' ? 'ملاحظة الذمة' : 'Notes'}</th>
                      <th className="px-4 py-3 text-center">{language === 'AR' ? 'تسوية وتصفية' : 'Settle'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {debts.filter(d => d.totalDebtYER > 0).map((debt) => (
                      <tr key={debt.id} className="hover:bg-slate-900/30">
                        <td className="px-4 py-3.5 font-bold text-white">{debt.customerName}</td>
                        <td className="px-4 py-3.5 text-center font-mono text-slate-400">{debt.customerPhone || 'دون هاتف'}</td>
                        <td className="px-4 py-3.5 text-center font-mono font-black text-rose-400">{debt.totalDebtYER.toLocaleString()} YER</td>
                        <td className="px-4 py-3.5 text-center text-slate-400 max-w-xs truncate">{debt.notes || '—'}</td>
                        <td className="px-4 py-3.5 text-center">
                          <button
                            onClick={() => handleClearDebt(debt.id)}
                            className="px-3 py-1.5 bg-emerald-950 border border-emerald-800/80 text-emerald-400 hover:border-emerald-500 rounded-lg text-[11px] font-black cursor-pointer mx-auto"
                          >
                            تصفية الحساب
                          </button>
                        </td>
                      </tr>
                    ))}
                    {debts.filter(d => d.totalDebtYER > 0).length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-slate-500 text-xs">
                          {language === 'AR' ? 'لا توجود أي ديون نشطة بالدفتر حالياً.' : 'No active debts detected in memory database! Excellent credit.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Register new debt record */}
            <div className="lg:col-span-4 bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-xl h-fit">
              <h3 className="text-sm font-bold text-white mb-1 uppercase tracking-wider">{language === 'AR' ? 'تسجيل دين آجل جديد' : 'Open Custom Client Account'}</h3>
              <p className="text-xs text-slate-500 mb-4">{language === 'AR' ? 'يرجى تسجيل ديون الشحن والمنتجات آجل باسم وصحيفة العميل بدقة.' : 'Create a debt entry in YER to track accounts receivable.'}</p>
              
              <form onSubmit={handleCreateDebt} className="space-y-3.5">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">{language === 'AR' ? 'اسم العميل ثلاثي:' : 'Debtor Full Name:'}</label>
                  <input
                    type="text"
                    required
                    value={newDebtName}
                    onChange={(e) => setNewDebtName(e.target.value)}
                    placeholder="e.g. ناصر اليافعي"
                    className="bg-slate-950 text-xs py-2 px-3.5 rounded-xl border border-slate-800 text-white"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">{language === 'AR' ? 'رقم الهاتف المعين:' : 'Telephone Link:'}</label>
                  <input
                    type="tel"
                    value={newDebtPhone}
                    onChange={(e) => setNewDebtPhone(e.target.value)}
                    placeholder="77xxxxxxx"
                    className="bg-slate-950 text-xs py-2 px-3.5 rounded-xl border border-slate-800 text-white font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">{language === 'AR' ? 'المبلغ المستحق (ريال يمني YER):' : 'Debt Value (YER):'}</label>
                  <input
                    type="number"
                    required
                    value={newDebtAmount || ''}
                    onChange={(e) => setNewDebtAmount(Number(e.target.value))}
                    placeholder="YER..."
                    className="bg-slate-950 text-xs py-2 px-3.5 rounded-xl border border-slate-800 text-white font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">{language === 'AR' ? 'بيان المديونية وتفاصيل التزويد:' : 'Ledger Allocation Notes:'}</label>
                  <textarea
                    value={newDebtNotes}
                    onChange={(e) => setNewDebtNotes(e.target.value)}
                    placeholder="e.g. باقة مزايا يمن موبايل وشاحن انكر"
                    className="bg-slate-950 text-xs py-2 px-3.5 rounded-xl border border-slate-800 text-white h-16 resize-none focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-black text-xs rounded-xl shadow transition-all cursor-pointer"
                >
                  {language === 'AR' ? 'توثيق الدين بالدفتر' : 'Register Receivable'}
                </button>
              </form>
            </div>

          </div>
        )}

        {/* 6️⃣ CLIENT ORDERS TAB CONTENT */}
        {activeTab === 'ORDERS' && (
          <div className="bg-slate-900 border border-slate-855 rounded-3xl p-6 shadow-xl animate-fadeIn space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">{language === 'AR' ? 'لوحة تزويد وإدارة طلبات الزبائن وتزويد الرصيد' : 'Active Digital Charge & Goods Shipping Terminal'}</h3>
            
            <div className="overflow-x-auto relative rounded-2xl border border-slate-850 bg-slate-955 whitespace-nowrap">
              <table className="w-full text-right md:text-left text-xs text-slate-250">
                <thead className="bg-slate-900 text-[10px] text-slate-450 uppercase font-mono border-b border-slate-850">
                  <tr>
                    <th className="px-4 py-3">{language === 'AR' ? 'رقم الطلب / الكود' : 'Order ID'}</th>
                    <th className="px-4 py-3">{language === 'AR' ? 'الزبون والاتصال' : 'Buyer & Phone'}</th>
                    <th className="px-4 py-3">{language === 'AR' ? 'السلع والخدمات المطلوبة' : 'Package / Details'}</th>
                    <th className="px-4 py-3 text-center">{language === 'AR' ? 'الإجمالي' : 'Grand Total'}</th>
                    <th className="px-4 py-3 text-center">{language === 'AR' ? 'التوقيت' : 'Time'}</th>
                    <th className="px-4 py-3 text-center">{language === 'AR' ? 'حالة الطلب' : 'Status Dispatch'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-900/35">
                      <td className="px-4 py-4 font-mono font-black text-cyan-300">{order.id}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-white">{order.customerName}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{order.customerPhone}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1 max-w-sm">
                          {order.items.map((item, i) => (
                            <div key={i} className="text-xs">
                              <span className="font-medium text-slate-100">
                                {language === 'AR' ? item.product.nameAR : item.product.nameEN} ({item.quantity}x)
                              </span>
                              {item.rechargeDetails && (
                                <span className="block text-[10px] text-cyan-400 font-mono">
                                  {item.rechargeDetails.phoneNumber ? `🌐 Carrier: ${item.rechargeDetails.phoneNumber}` : `🎮 Player ID: ${item.rechargeDetails.playerId}`}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center font-mono font-black text-emerald-400">
                        {order.totalYER.toLocaleString()} YER
                      </td>
                      <td className="px-4 py-4 text-center text-[10px] text-slate-500 font-mono">
                        {new Date(order.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                          className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black tracking-wide border bg-slate-900 focus:outline-none cursor-pointer ${
                            order.status === 'COMPLETED' 
                              ? 'border-emerald-700 text-emerald-450 text-emerald-400' 
                              : order.status === 'PROCESSING' 
                                ? 'border-cyan-705 text-cyan-454 text-cyan-400 animate-pulse' 
                                : order.status === 'PENDING'
                                  ? 'border-amber-700 text-amber-400'
                                  : 'border-red-800 text-red-400'
                          }`}
                        >
                          <option value="PENDING">{language === 'AR' ? 'قيد المراجعة' : 'Pending'}</option>
                          <option value="PROCESSING">{language === 'AR' ? 'جاري الشحن/التوصيل' : 'Processing'}</option>
                          <option value="COMPLETED">{language === 'AR' ? 'مكتمل ومسدد' : 'Completed'}</option>
                          <option value="CANCELLED">{language === 'AR' ? 'ملغي' : 'Cancelled'}</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

    </div>
  );
}
