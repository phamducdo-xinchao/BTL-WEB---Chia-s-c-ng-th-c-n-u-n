import { useState } from 'react';
import { formatVND } from '../constants.js';
import { useCartStore } from '../store/cartStore.js';
import { useToast } from '../context/UIContext.jsx';

// Thẻ sản phẩm: ảnh (hoặc biểu tượng), giá, tồn kho, nút thêm vào giỏ
export default function ProductCard({ product, compact = false }) {
  const add = useCartStore((s) => s.add);
  const toast = useToast();
  const [broken, setBroken] = useState(false);
  const out = product.stock <= 0;

  function handleAdd() {
    const r = add(product);
    if (r === 'out') toast.error('Sản phẩm đã hết hàng');
    else if (r === 'max') toast.error(`Chỉ còn ${product.stock} ${product.unit}, đã thêm tối đa`);
    else toast.success(`Đã thêm "${product.name}" vào giỏ`);
  }

  return (
    <div className={`card product-card ${compact ? 'compact' : ''}`}>
      <div className="card-media" style={{ background: '#e8f3e4' }}>
        {product.imageUrl && !broken ? (
          <img src={product.imageUrl} alt={product.name} loading="lazy" onError={() => setBroken(true)} />
        ) : (
          <span className="card-icon" aria-hidden="true">{product.emoji || '🧺'}</span>
        )}
        {out && <span className="badge badge-out">Hết hàng</span>}
      </div>
      <div className="card-body">
        <h3>{product.name}</h3>
        {!compact && product.description && <p className="card-desc">{product.description}</p>}
        <div className="price-row">
          <strong className="price">{formatVND(product.price)}</strong>
          <span className="unit">/ {product.unit}</span>
        </div>
        {!out && product.stock <= 10 && <small className="low-stock">Chỉ còn {product.stock}</small>}
        <button className="btn btn-primary btn-sm" disabled={out} onClick={handleAdd}>
          {out ? 'Hết hàng' : '＋ Thêm vào giỏ'}
        </button>
      </div>
    </div>
  );
}
