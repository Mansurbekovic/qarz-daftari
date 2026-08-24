import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';
import { fmtMoney, exportToCSV } from '../utils/helpers';
import { PRODUCT_CATEGORIES } from '../utils/constants';
import ProductModal from '../components/modals/ProductModal';
import BarcodeScanner from '../components/modals/BarcodeScanner';

export default function Warehouse() {
  const { db, deleteProduct, adjustProductStock } = useApp();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [quickAdjustId, setQuickAdjustId] = useState(null);
  const [quickAdjustDelta, setQuickAdjustDelta] = useState('');

  if (!db) return null;

  const products = db.products || [];

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.includes(search));
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesLowStock = !onlyLowStock || (p.stock <= (p.minStock || 5));
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  // Calculate Warehouse Totals
  const totalItemsCount = products.length;
  const totalStockCount = products.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
  const totalSaleValue = products.reduce((sum, p) => sum + ((Number(p.price) || 0) * (Number(p.stock) || 0)), 0);
  const totalCostValue = products.reduce((sum, p) => sum + ((Number(p.costPrice) || 0) * (Number(p.stock) || 0)), 0);
  const totalProfitPotential = totalSaleValue - totalCostValue;
  const lowStockCount = products.filter(p => (Number(p.stock) || 0) <= (Number(p.minStock) || 5)).length;

  const handleExportCSV = () => {
    if (products.length === 0) {
      toast('Eksport qilish uchun mahsulot yo\'q', 'warning');
      return;
    }
    const headers = ['Mahsulot nomi', 'Shtrix-kod', 'Kategoriya', 'Qoldiq', 'Birlik', 'Sotish narxi', 'Tannarx', 'Jami sotish qiymati'];
    const rows = products.map(p => [
      p.name,
      p.barcode || '—',
      p.category || 'Boshqa',
      p.stock,
      p.unit,
      p.price,
      p.costPrice || 0,
      p.price * p.stock
    ]);
    exportToCSV(headers, rows, `omborxona-qoldiq-${new Date().toISOString().slice(0, 10)}.csv`);
    toast('Omborxona ma\'lumotlari yuklandi');
  };

  const handleQuickAdjustSubmit = (productId) => {
    const delta = Number(quickAdjustDelta);
    if (isNaN(delta) || delta === 0) {
      setQuickAdjustId(null);
      return;
    }
    adjustProductStock(productId, delta, delta > 0 ? 'Tezkor qabul' : 'Tezkor chiqim');
    toast(`Qoldiq ${delta > 0 ? '+' : ''}${delta} ga o'zgartirildi`);
    setQuickAdjustId(null);
    setQuickAdjustDelta('');
  };

  return (
    <div className="warehouse-page">
      {/* Top Stat Cards */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: '20px' }}>
        <div className="stat-card">
          <div className="stat-label">Jami tovar turlari</div>
          <div className="stat-value gold">{totalItemsCount} <span style={{ fontSize: '14px', fontWeight: 'normal' }}>xil ({totalStockCount} dona)</span></div>
          <div className="stat-note">Ombordagi mavjud assortiment</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Ombor umumiy qiymati</div>
          <div className="stat-value teal">{fmtMoney(totalSaleValue, db.currency)}</div>
          <div className="stat-note">Tannarxi: {fmtMoney(totalCostValue, db.currency)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Kutilayotgan sof foyda</div>
          <div className="stat-value">{fmtMoney(totalProfitPotential, db.currency)}</div>
          <div className="stat-note">To'liq sotilgandagi marja</div>
        </div>

        <div className={`stat-card ${lowStockCount > 0 ? 'warning-card' : ''}`}>
          <div className="stat-label">Kam qolgan mahsulotlar</div>
          <div className="stat-value rust" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {lowStockCount > 0 ? `⚠️ ${lowStockCount} ta` : '✅ Hammasi yetarli'}
          </div>
          <div className="stat-note">
            {lowStockCount > 0 ? (
              <button
                type="button"
                className="btn-link"
                style={{ color: 'var(--rust)', textDecoration: 'underline', padding: 0, fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => setOnlyLowStock(!onlyLowStock)}
              >
                {onlyLowStock ? 'Barchasini ko\'rish' : 'Faqat kam qolganlarni ko\'rsatish'}
              </button>
            ) : 'Qoldiqlar me\'yorida'}
          </div>
        </div>
      </div>

      {/* Action and Filter Bar */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Search & Filters */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', flex: '1', minWidth: '280px' }}>
            <input
              type="text"
              className="input"
              placeholder="🔍 Nomi yoki shtrix-kod bo'yicha qidirish..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ maxWidth: '300px' }}
            />

            <select
              className="input"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              style={{ maxWidth: '180px' }}
            >
              <option value="all">Barcha kategoriyalar</option>
              {PRODUCT_CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <button
              type="button"
              className={`btn ${onlyLowStock ? 'btn-danger' : 'btn-outline'}`}
              onClick={() => setOnlyLowStock(!onlyLowStock)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span>⚠️</span> Kam qolganlar ({lowStockCount})
            </button>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setShowScanner(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span>📷</span> Skaner
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleExportCSV}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span>📥</span> Excel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setEditingProductId(null);
                setShowProductModal(true);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span>➕</span> Yangi Mahsulot
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-sec)' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📦</div>
            <h4 style={{ fontSize: '16px', marginBottom: '6px' }}>Mahsulotlar topilmadi</h4>
            <p style={{ fontSize: '13px', marginBottom: '16px' }}>
              {products.length === 0 ? 'Omboringizda hali mahsulotlar kiritilmagan.' : 'Qidiruv bo\'yicha hech narsa chiqmadi.'}
            </p>
            {products.length === 0 && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setEditingProductId(null);
                  setShowProductModal(true);
                }}
              >
                ➕ Birinchi mahsulotni qo'shish
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-user-table">
              <thead>
                <tr>
                  <th>Mahsulot nomi</th>
                  <th>Kategoriya</th>
                  <th>Shtrix-kod</th>
                  <th>Sotish narxi</th>
                  <th>Tannarx</th>
                  <th>Qoldiq</th>
                  <th style={{ textAlign: 'right' }}>Amallar</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => {
                  const isLow = (Number(p.stock) || 0) <= (Number(p.minStock) || 5);
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text)' }}>{p.name}</div>
                        {isLow && (
                          <span className="risk-badge high" style={{ fontSize: '10.5px', marginTop: '3px', display: 'inline-block' }}>
                            ⚠️ Qoldiq kam!
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="category-tag">{p.category || 'Boshqa'}</span>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: '12px', opacity: 0.85 }}>
                          {p.barcode || '—'}
                        </span>
                      </td>
                      <td>
                        <strong>{fmtMoney(p.price, db.currency)}</strong>
                      </td>
                      <td style={{ color: 'var(--text-sec)', fontSize: '13px' }}>
                        {p.costPrice ? fmtMoney(p.costPrice, db.currency) : '—'}
                      </td>
                      <td>
                        {quickAdjustId === p.id ? (
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <input
                              type="number"
                              className="input"
                              placeholder="+/- son"
                              value={quickAdjustDelta}
                              onChange={e => setQuickAdjustDelta(e.target.value)}
                              style={{ width: '80px', padding: '4px 6px', fontSize: '12px' }}
                              autoFocus
                            />
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => handleQuickAdjustSubmit(p.id)}
                            >
                              ✓
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              onClick={() => setQuickAdjustId(null)}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              fontWeight: 700,
                              color: isLow ? 'var(--rust, #D9534F)' : 'var(--teal, #1F6E5C)'
                            }}>
                              {p.stock} {p.unit}
                            </span>
                            <button
                              type="button"
                              className="btn-quick-adjust"
                              title="Qoldiqni tez o'zgartirish"
                              onClick={() => {
                                setQuickAdjustId(p.id);
                                setQuickAdjustDelta('');
                              }}
                            >
                              ✏️
                            </button>
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => {
                              setEditingProductId(p.id);
                              setShowProductModal(true);
                            }}
                          >
                            Tahrirlash
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => {
                              if (window.confirm(`"${p.name}" mahsulotini o'chirishni tasdiqlaysizmi?`)) {
                                deleteProduct(p.id);
                              }
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showProductModal && (
        <ProductModal
          productId={editingProductId}
          onClose={() => setShowProductModal(false)}
        />
      )}

      {showScanner && (
        <BarcodeScanner
          onScan={(code) => {
            setSearch(code);
            setShowScanner(false);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
