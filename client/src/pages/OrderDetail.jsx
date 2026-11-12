import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { api } from '../api';
import { DELIVERY_METHOD, ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS } from '../constants.js';
import StatusBadge from '../components/StatusBadge.jsx';
import OrderItems from '../components/OrderItems.jsx';
import { useConfirm, useToast } from '../context/UIContext.jsx';
import useTitle from '../useTitle.js';

const STEPS = ['pending', 'shipping', 'done'];

export default function OrderDetail() {
  const { id } = useParams();
  const { state } = useLocation();
  const toast = useToast();
  const confirm = useConfirm();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  useTitle(order ? `Đơn #${order.code}` : 'Đơn hàng');

  useEffect(() => {
    api.get(`/orders/${id}`).then(setOrder).catch((err) => setError(err.message));
  }, [id]);

  if (error && !order) return <p className="alert">{error}</p>;
  if (!order) return <p className="state">Đang tải...</p>;

  const canPay = order.paymentMethod === 'online' && order.status === 'pending' && order.paymentStatus !== 'paid';
  const stepIndex = STEPS.indexOf(order.status);

  async function cancel() {
    const ok = await confirm({ title: 'Hủy đơn hàng?', message: 'Hàng sẽ được trả về kho. Hành động này không hoàn tác được.', okText: 'Hủy đơn' });
    if (!ok) return;
    try {
      setOrder(await api.post(`/orders/${id}/cancel`));
      toast.success('Đã hủy đơn hàng');
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <>
      <Link to="/orders" className="back">← Đơn hàng của tôi</Link>
      {state?.justOrdered && (
        <div className="success-banner" role="status">
          <span aria-hidden="true">✅</span>
          <div>
            <strong>Đặt hàng thành công!</strong>
            <p>Cảm ơn bạn đã mua nguyên liệu tại Góc Bếp. Chúng mình sẽ xác nhận đơn sớm nhất.</p>
          </div>
        </div>
      )}
      {state?.paid && (
        <div className="success-banner" role="status">
          <span aria-hidden="true">💚</span>
          <div>
            <strong>Đã ghi nhận thanh toán</strong>
            <p>Đơn của bạn đang chờ cửa hàng xác nhận và giao hàng.</p>
          </div>
        </div>
      )}
      <h1>Đơn #{order.code}</h1>
      <p className="detail-meta">Đặt lúc {new Date(order.createdAt).toLocaleString('vi-VN')}</p>
      {error && <p className="alert">{error}</p>}

      {order.status === 'cancelled' ? (
        <p className="alert">Đơn hàng này đã bị hủy.</p>
      ) : (
        <ol className="timeline" aria-label="Tiến trình đơn hàng">
          {STEPS.map((s, i) => (
            <li key={s} className={i <= stepIndex ? 'on' : ''}>{ORDER_STATUS[s].label}</li>
          ))}
        </ol>
      )}

      <div className="cart-layout">
        <div className="checkout-fields">
          <section className="panel">
            <h2>Trạng thái</h2>
            <div className="order-card-foot">
              <StatusBadge map={ORDER_STATUS} value={order.status} />
              <StatusBadge map={PAYMENT_STATUS} value={order.paymentStatus} />
            </div>
            <p className="hint">{PAYMENT_METHOD[order.paymentMethod]}</p>
            {canPay && (
              <div className="pay-box">
                <p>Đơn đang chờ thanh toán. Số tiền cần chuyển: <strong>{new Intl.NumberFormat('vi-VN').format(order.total)}đ</strong></p>
                <Link to={`/orders/${id}/pay`} className="btn btn-primary">Thanh toán bằng mã QR</Link>
              </div>
            )}
            {order.status === 'pending' && (
              <button className="btn btn-danger btn-sm" onClick={cancel}>Hủy đơn</button>
            )}
          </section>
          <section className="panel">
            <h2>Nhận hàng</h2>
            <p><strong>{order.receiverName}</strong> · {order.phone}</p>
            <p>{DELIVERY_METHOD[order.deliveryMethod]}: {order.address}{order.deliveryMethod === 'delivery' ? `, ${order.province}` : ''}</p>
            {order.note && <p className="hint">Ghi chú: {order.note}</p>}
          </section>
        </div>
        <aside className="panel summary">
          <h2>Chi tiết đơn</h2>
          <OrderItems order={order} />
        </aside>
      </div>
    </>
  );
}
