import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { formatVND } from '../constants.js';
import { selectSubtotal, useCartStore } from '../store/cartStore.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/UIContext.jsx';
import useTitle from '../useTitle.js';

export default function Checkout() {
  useTitle('Đặt hàng');
  const { user } = useAuth();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore(selectSubtotal);
  const clear = useCartStore((s) => s.clear);
  const navigate = useNavigate();
  const toast = useToast();

  const [cfg, setCfg] = useState(null);
  const [form, setForm] = useState(() => {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem('shipInfo')) || {}; } catch { /* bỏ qua */ }
    return {
      receiverName: saved.receiverName || user?.name || '', phone: saved.phone || '', deliveryMethod: 'delivery',
      province: saved.province || '', address: saved.address || '', pickupPoint: '', note: '', paymentMethod: 'cod',
    };
  });
  const [fee, setFee] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => {
    api.get('/products/config').then(setCfg).catch((err) => setError(err.message));
  }, []);

  // Phí ship do server tính, giao diện chỉ hiển thị lại
  const province = form.deliveryMethod === 'pickup' ? cfg?.pickupPoints.find((p) => p.id === form.pickupPoint)?.province || '' : form.province;
  useEffect(() => {
    const q = new URLSearchParams({ subtotal, deliveryMethod: form.deliveryMethod, province });
    api.get(`/products/shipping?${q}`).then((d) => setFee(d.shippingFee)).catch(() => {});
  }, [subtotal, form.deliveryMethod, province]);

  if (items.length === 0) {
    return (
      <div className="empty-page">
        <div className="empty-icon">🧺</div>
        <h1>Chưa có gì để đặt</h1>
        <p>Giỏ hàng của bạn đang trống.</p>
        <Link to="/shop" className="btn btn-primary">Vào cửa hàng</Link>
      </div>
    );
  }

  const pickup = form.deliveryMethod === 'pickup';

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const order = await api.post('/orders', { ...form, items: items.map((i) => ({ productId: i.id, qty: i.qty })) });
      try {
        const { receiverName, phone, province, address } = form;
        localStorage.setItem('shipInfo', JSON.stringify({ receiverName, phone, province: pickup ? '' : province, address: pickup ? '' : address }));
      } catch { /* bỏ qua */ }
      clear();
      // Chuyển khoản QR: đi thẳng tới trang thanh toán; trả khi nhận hàng: xem đơn
      navigate(order.paymentMethod === 'online' ? `/orders/${order._id}/pay` : `/orders/${order._id}`, { replace: true, state: { justOrdered: true } });
    } catch (err) {
      setError(err.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Link to="/cart" className="back">← Quay lại giỏ hàng</Link>
      <h1>Đặt hàng</h1>
      {error && <p className="alert">{error}</p>}
      <form className="cart-layout" onSubmit={submit}>
        <div className="checkout-fields">
          <fieldset className="panel">
            <legend>Người nhận</legend>
            <label>Họ tên<input value={form.receiverName} onChange={set('receiverName')} maxLength={60} required /></label>
            <label>Số điện thoại<input value={form.phone} onChange={set('phone')} inputMode="tel" placeholder="0901234567" required /></label>
          </fieldset>

          <fieldset className="panel">
            <legend>Cách nhận hàng</legend>
            <div className="choice-row">
              <label className={`choice ${!pickup ? 'on' : ''}`}>
                <input type="radio" name="dm" checked={!pickup} onChange={() => setForm({ ...form, deliveryMethod: 'delivery' })} />
                <span>🛵 Giao tận nơi</span>
              </label>
              <label className={`choice ${pickup ? 'on' : ''}`}>
                <input type="radio" name="dm" checked={pickup} onChange={() => setForm({ ...form, deliveryMethod: 'pickup' })} />
                <span>🏬 Nhận tại điểm</span>
              </label>
            </div>
            {pickup ? (
              <label>Điểm nhận hàng
                <select value={form.pickupPoint} onChange={set('pickupPoint')} required>
                  <option value="">-- Chọn điểm nhận --</option>
                  {cfg?.pickupPoints.map((p) => <option key={p.id} value={p.id}>{p.name} - {p.address}</option>)}
                </select>
              </label>
            ) : (
              <>
                <label>Tỉnh, thành phố
                  <select value={form.province} onChange={set('province')} required>
                    <option value="">-- Chọn tỉnh, thành phố --</option>
                    {cfg?.provinces.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </label>
                <label>Địa chỉ cụ thể
                  <input value={form.address} onChange={set('address')} maxLength={200} placeholder="Số nhà, đường, phường/xã" required />
                </label>
              </>
            )}
            <label>Ghi chú (không bắt buộc)
              <input value={form.note} onChange={set('note')} maxLength={300} placeholder="Ví dụ: giao giờ hành chính" />
            </label>
          </fieldset>

          <fieldset className="panel">
            <legend>Thanh toán</legend>
            <div className="choice-row">
              <label className={`choice ${form.paymentMethod === 'cod' ? 'on' : ''}`}>
                <input type="radio" name="pm" checked={form.paymentMethod === 'cod'} onChange={() => setForm({ ...form, paymentMethod: 'cod' })} />
                <span>💵 Khi nhận hàng</span>
              </label>
              <label className={`choice ${form.paymentMethod === 'online' ? 'on' : ''}`}>
                <input type="radio" name="pm" checked={form.paymentMethod === 'online'} onChange={() => setForm({ ...form, paymentMethod: 'online' })} />
                <span>📱 Chuyển khoản QR</span>
              </label>
            </div>
            {form.paymentMethod === 'online' && <p className="hint">Sau khi đặt hàng, bạn sẽ nhận mã QR để quét bằng ứng dụng ngân hàng. Đơn được giữ hàng trong lúc chờ thanh toán.</p>}
          </fieldset>
        </div>

        <aside className="panel summary">
          <h2>Đơn hàng</h2>
          {items.map((i) => (
            <div key={i.id} className="sum-row small"><span>{i.name} × {i.qty}</span><span>{formatVND(i.price * i.qty)}</span></div>
          ))}
          <hr />
          <div className="sum-row"><span>Tiền hàng</span><span>{formatVND(subtotal)}</span></div>
          <div className="sum-row"><span>Phí giao hàng</span><span>{fee === 0 ? 'Miễn phí' : formatVND(fee)}</span></div>
          <div className="sum-row total"><span>Tổng cộng</span><strong>{formatVND(subtotal + fee)}</strong></div>
          {cfg && <p className="hint">Miễn phí giao hàng cho đơn từ {formatVND(cfg.freeShipFrom)}. Nhận tại điểm luôn miễn phí.</p>}
          <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Đang đặt...' : 'Đặt hàng'}</button>
        </aside>
      </form>
    </>
  );
}
