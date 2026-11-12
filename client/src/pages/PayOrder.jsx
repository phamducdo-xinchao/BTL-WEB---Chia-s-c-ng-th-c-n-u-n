import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { api } from '../api';
import { formatVND } from '../constants.js';
import { useToast } from '../context/UIContext.jsx';
import useTitle from '../useTitle.js';

const pad = (n) => String(n).padStart(2, '0');

// Trang thanh toán chuyển khoản bằng mã QR
export default function PayOrder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  useTitle('Thanh toán đơn hàng');

  const [order, setOrder] = useState(null);
  const [bank, setBank] = useState(null);
  const [session, setSession] = useState(null); // { token, amount, expiresAt }
  const [qr, setQr] = useState('');
  const [left, setLeft] = useState(0); // giây còn lại
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Tạo phiên thanh toán mới (server ký số tiền và hạn dùng)
  const startSession = useCallback(async (o) => {
    const s = await api.post(`/orders/${o._id}/payment-session`);
    setSession(s);
    setLeft(Math.max(Math.round((new Date(s.expiresAt) - Date.now()) / 1000), 0));
    setQr(await QRCode.toDataURL(`GOCBEP|${o.code}|${s.amount}|${s.token.split('.').pop().slice(0, 12)}`, { width: 280, margin: 1, color: { dark: '#123524' } }));
  }, []);

  useEffect(() => {
    Promise.all([api.get(`/orders/${id}`), api.get('/products/config')])
      .then(async ([o, cfg]) => {
        if (o.paymentMethod !== 'online' || o.status !== 'pending' || o.paymentStatus === 'paid') return navigate(`/orders/${id}`, { replace: true });
        setOrder(o);
        setBank(cfg.bank);
        await startSession(o);
      })
      .catch((err) => setError(err.message));
  }, [id, navigate, startSession]);

  // Đếm ngược mỗi giây
  useEffect(() => {
    if (!session) return;
    const t = setInterval(() => setLeft((s) => Math.max(s - 1, 0)), 1000);
    return () => clearInterval(t);
  }, [session]);

  async function confirmPaid() {
    setBusy(true);
    try {
      await api.post(`/orders/${id}/payment-result`, { token: session.token, success: true });
      toast.success('Thanh toán thành công');
      navigate(`/orders/${id}`, { replace: true, state: { paid: true } });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (error && !order) return <p className="alert">{error}</p>;
  if (!order || !session) return <p className="state">Đang tạo mã thanh toán...</p>;

  const expired = left <= 0;
  const copy = (text) => navigator.clipboard?.writeText(text).then(() => toast.success('Đã sao chép'), () => {});

  return (
    <div className="pay-page">
      <h1>Thanh toán đơn #{order.code}</h1>
      <p className="detail-meta">Quét mã QR bằng ứng dụng ngân hàng hoặc chuyển khoản theo thông tin bên cạnh.</p>
      {error && <p className="alert">{error}</p>}
      <div className="pay-grid">
        <div className="panel qr-panel">
          <div className={`qr-box ${expired ? 'expired' : ''}`}>
            <img src={qr} alt="Mã QR thanh toán" width="240" height="240" />
            {expired && <div className="qr-expired">Mã đã hết hạn</div>}
          </div>
          <p className={`countdown ${expired ? 'bad' : ''}`}>
            {expired ? 'Mã QR đã hết hạn' : <>Mã còn hiệu lực <strong>{pad(Math.floor(left / 60))}:{pad(left % 60)}</strong></>}
          </p>
          {expired && <button className="btn btn-primary" onClick={() => startSession(order).catch((e) => setError(e.message))}>Tạo mã mới</button>}
        </div>

        <div className="panel">
          <h2>Thông tin chuyển khoản</h2>
          <dl className="bank-info">
            <dt>Ngân hàng</dt><dd>{bank.name}</dd>
            <dt>Số tài khoản</dt><dd>{bank.account} <button className="link-btn" onClick={() => copy(bank.account)}>Sao chép</button></dd>
            <dt>Chủ tài khoản</dt><dd>{bank.owner}</dd>
            <dt>Số tiền</dt><dd><strong className="price">{formatVND(session.amount)}</strong> <button className="link-btn" onClick={() => copy(String(session.amount))}>Sao chép</button></dd>
            <dt>Nội dung</dt><dd><strong>{order.code}</strong> <button className="link-btn" onClick={() => copy(order.code)}>Sao chép</button></dd>
          </dl>
          <p className="hint">Vui lòng nhập đúng số tiền và nội dung chuyển khoản để đơn được ghi nhận.</p>
          <div className="actions">
            <button className="btn btn-primary" disabled={busy || expired} onClick={confirmPaid}>{busy ? 'Đang xác nhận...' : 'Tôi đã chuyển khoản'}</button>
            <Link to={`/orders/${id}`} className="btn btn-ghost">Thanh toán sau</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
