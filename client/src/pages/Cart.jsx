import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { formatVND } from '../constants.js';
import { selectSubtotal, useCartStore } from '../store/cartStore.js';
import { useToast } from '../context/UIContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import useTitle from '../useTitle.js';

export default function Cart() {
  useTitle('Giỏ hàng');
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore(selectSubtotal);
  const { setQty, remove, clear, sync } = useCartStore();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [freeFrom, setFreeFrom] = useState(0);

  // Mở giỏ: đối chiếu giá và tồn kho mới nhất từ server
  useEffect(() => {
    api.get('/products/config').then((c) => setFreeFrom(c.freeShipFrom)).catch(() => {});
    const ids = useCartStore.getState().items.map((i) => i.id);
    if (ids.length === 0) return;
    api
      .get(`/products?ids=${ids.join(',')}&limit=50`)
      .then((d) => sync(d.products).forEach((n) => toast.error(n)))
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function checkout() {
    if (!user) navigate('/login', { state: { from: '/checkout' } });
    else navigate('/checkout');
  }

  if (items.length === 0) {
    return (
      <div className="empty-page">
        <div className="empty-icon">🧺</div>
        <h1>Giỏ hàng đang trống</h1>
        <p>Chọn vài nguyên liệu từ cửa hàng hoặc từ trang món ăn nhé.</p>
        <Link to="/shop" className="btn btn-primary">Vào cửa hàng</Link>
      </div>
    );
  }

  return (
    <>
      <h1>Giỏ hàng</h1>
      <div className="cart-layout">
        <div className="panel cart-list">
          {items.map((i) => (
            <div key={i.id} className="cart-row">
              <div className="cart-thumb" aria-hidden="true">{i.emoji || '🧺'}</div>
              <div className="cart-info">
                <strong>{i.name}</strong>
                <small>{formatVND(i.price)} / {i.unit}</small>
              </div>
              <div className="qty" role="group" aria-label={`Số lượng ${i.name}`}>
                <button className="btn btn-ghost btn-sm" onClick={() => setQty(i.id, i.qty - 1)} disabled={i.qty <= 1} aria-label="Giảm">−</button>
                <span>{i.qty}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setQty(i.id, i.qty + 1)} disabled={i.qty >= Math.min(i.stock, 99)} aria-label="Tăng">＋</button>
              </div>
              <strong className="line-total">{formatVND(i.price * i.qty)}</strong>
              <button className="link-btn" onClick={() => remove(i.id)}>Xóa</button>
            </div>
          ))}
          <button className="link-btn" onClick={clear}>Xóa toàn bộ giỏ</button>
        </div>
        <aside className="panel summary">
          <h2>Tạm tính</h2>
          <div className="sum-row"><span>Tiền hàng</span><strong>{formatVND(subtotal)}</strong></div>
          {freeFrom > 0 && (
            <div className="freeship">
              <div className="progress" aria-hidden="true"><div style={{ width: `${Math.min((subtotal / freeFrom) * 100, 100)}%` }} /></div>
              <p className="hint">{subtotal >= freeFrom ? '🎉 Đơn của bạn được miễn phí giao hàng.' : `Mua thêm ${formatVND(freeFrom - subtotal)} để được miễn phí giao hàng.`}</p>
            </div>
          )}
          <p className="hint">Phí giao hàng được tính ở bước đặt hàng, tùy tỉnh thành và cách nhận hàng.</p>
          <button className="btn btn-primary" onClick={checkout}>Tiến hành đặt hàng</button>
          <Link to="/shop" className="btn btn-ghost">Mua thêm</Link>
        </aside>
      </div>
    </>
  );
}
