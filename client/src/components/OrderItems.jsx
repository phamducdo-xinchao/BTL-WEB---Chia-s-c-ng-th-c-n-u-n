import { formatVND } from '../constants.js';

// Bảng các dòng hàng và tổng tiền của một đơn (dùng ở trang khách và trang admin)
export default function OrderItems({ order }) {
  return (
    <div className="order-items">
      {order.items.map((i, k) => (
        <div key={k} className="sum-row small"><span>{i.name} × {i.qty} {i.unit}</span><span>{formatVND(i.price * i.qty)}</span></div>
      ))}
      <hr />
      <div className="sum-row small"><span>Tiền hàng</span><span>{formatVND(order.subtotal)}</span></div>
      <div className="sum-row small"><span>Phí giao hàng</span><span>{order.shippingFee === 0 ? 'Miễn phí' : formatVND(order.shippingFee)}</span></div>
      <div className="sum-row total"><span>Tổng cộng</span><strong>{formatVND(order.total)}</strong></div>
    </div>
  );
}
