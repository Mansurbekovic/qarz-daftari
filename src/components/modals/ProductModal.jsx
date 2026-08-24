import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useToast } from '../../contexts/ToastContext';
import { PRODUCT_CATEGORIES, MEASURE_UNITS } from '../../utils/constants';
import { fmtMoney } from '../../utils/helpers';
import BarcodeScanner from './BarcodeScanner';

export default function ProductModal({ productId, onClose }) {
  const { db, addProduct, updateProduct } = useApp();
  const { toast } = useToast();

  const isEdit = Boolean(productId);
  const existingProduct = isEdit ? (db.products || []).find(p => p.id === productId) : null;

  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState(PRODUCT_CATEGORIES[0]);
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [stock, setStock] = useState('');
  const [unit, setUnit] = useState('dona');
  const [minStock, setMinStock] = useState('5');
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    if (existingProduct) {
      setName(existingProduct.name || '');
      setBarcode(existingProduct.barcode || '');
      setCategory(existingProduct.category || PRODUCT_CATEGORIES[0]);
      setPrice(existingProduct.price || '');
      setCostPrice(existingProduct.costPrice || '');
      setStock(existingProduct.stock || '');
      setUnit(existingProduct.unit || 'dona');
      setMinStock(existingProduct.minStock || '5');
    }
  }, [existingProduct]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast('Mahsulot nomini kiriting', 'error');
      return;
    }
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      toast('Sotish narxini to\'g\'ri kiriting', 'error');
      return;
    }

    const payload = {
      name: name.trim(),
      barcode: barcode.trim(),
      category,
      price: numPrice,
      costPrice: Number(costPrice) || 0,
      stock: Number(stock) || 0,
      unit,
      minStock: Number(minStock) || 5,
    };

    if (isEdit) {
      updateProduct(productId, payload);
    } else {
      addProduct(payload);
    }
    onClose();
  };

  const marginPerUnit = (Number(price) || 0) - (Number(costPrice) || 0);

  return (
    <>
      <div className="modal-backdrop">
        <div className="modal" style={{ maxWidth: '580px', width: '95%' }}>
          <div className="modal-head">
            <h3>{isEdit ? '📦 Mahsulotni tahrirlash' : '📦 Yangi mahsulot qo\'shish'}</h3>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Product Name */}
              <div>
                <label className="field-label">Mahsulot / Tovar nomi *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Masalan: Qop Un 50kg, O'simlik yog'i 5L..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              {/* Barcode with scanner button */}
              <div>
                <label className="field-label">Shtrix-kod / Barcode</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="input"
                    placeholder="Shtrix-kod raqami (ixtiyoriy)"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setShowScanner(true)}
                    style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span>📷</span> Skanerlash
                  </button>
                </div>
              </div>

              {/* Category & Unit */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="field-label">Kategoriya</label>
                  <select
                    className="input"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {PRODUCT_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="field-label">O'lchov birligi</label>
                  <select
                    className="input"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                  >
                    {MEASURE_UNITS.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Prices: Sale & Cost */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="field-label">Sotish narxi ({db?.currency || 'so\'m'}) *</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="0"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="field-label">Tannarxi / Kelish narxi</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="0"
                    min="0"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                  />
                </div>
              </div>

              {/* Stock & Min Stock Alert */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="field-label">Mavjud qoldiq soni</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="0"
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                  />
                </div>

                <div>
                  <label className="field-label">Minimal qoldiq ogohlantirish</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="5"
                    min="0"
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value)}
                  />
                </div>
              </div>

              {/* Live Profit Preview */}
              {Number(price) > 0 && (
                <div style={{
                  padding: '12px 14px',
                  background: 'rgba(212, 175, 55, 0.08)',
                  border: '1px solid rgba(212, 175, 55, 0.25)',
                  borderRadius: '10px',
                  fontSize: '13px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>Bir birlikdan sof foyda (marja):</span>
                  <strong style={{ color: marginPerUnit >= 0 ? 'var(--teal, #1F6E5C)' : 'var(--rust, #8B3A2B)' }}>
                    {fmtMoney(marginPerUnit, db?.currency)}
                  </strong>
                </div>
              )}

              <div className="modal-actions" style={{ marginTop: '8px' }}>
                <button type="button" className="btn btn-outline" onClick={onClose}>
                  Bekor qilish
                </button>
                <button type="submit" className="btn btn-primary">
                  {isEdit ? '💾 Saqlash' : '➕ Omborga qo\'shish'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {showScanner && (
        <BarcodeScanner
          onScan={(code) => setBarcode(code)}
          onClose={() => setShowScanner(false)}
        />
      )}
    </>
  );
}
