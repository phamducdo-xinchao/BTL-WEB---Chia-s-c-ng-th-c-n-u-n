import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { formatVND, ORDER_STATUS, PAYMENT_STATUS } from '../constants.js';
import StatusBadge from '../components/StatusBadge.jsx';
import useTitle from '../useTitle.js';

// Lịch sử đơn hàng của tôi
export default function Orders() {
  useTitle('Đơn hàng của tôi');
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/orders').then(setOrders).catch((err) => setError(err.message));
  }, []);

  return (
    <>
      <h1>Đơn hàng của tôi</h1>
      {error && <p className="alert">{error}</p>}
      {!orders && !error && <p className="state">Đang tải...</p>}
      {orders?.length === 0 && (
        <div className="empty-page">
          <div className="empty-icon">🧾</div>
          <p>Bạn chưa có đơn hàng nào.</p>
          <Link to="/shop" className="btn btn-primary">Vào cửa hàng</Link>
        </div>
      )}
      <div className="order-list">
        {orders?.map((o) => (
          <Link key={o._id} to={`/orders/${o._id}`} className="panel order-card">
            <div className="order-card-head">
              <strong>#{o.code}</strong>
              <time>{new Date(o.createdAt).toLocaleString('vi-VN')}</time>
            </div>
            <p className="card-desc">{o.items.map((i) => `${i.name} × ${i.qty}`).join(', ')}</p>
            <div className="order-card-foot">
              <StatusBadge map={ORDER_STATUS} value={o.status} />
              <StatusBadge map={PAYMENT_STATUS} value={o.paymentStatus} />
              <strong className="price">{formatVND(o.total)}</strong>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
