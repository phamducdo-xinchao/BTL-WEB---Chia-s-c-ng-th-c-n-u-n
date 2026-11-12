import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import AuthLayout from '../components/AuthLayout.jsx';
import PasswordInput from '../components/PasswordInput.jsx';
import useTitle from '../useTitle.js';

export default function Login() {
  useTitle('Đăng nhập');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(form.email, form.password);
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Chào mừng trở lại"
      subtitle="Đăng nhập để lưu món yêu thích và chia sẻ công thức của bạn."
      onSubmit={handleSubmit}
      side={{
        heading: 'Vào bếp cùng Góc Bếp',
        text: 'Hàng trăm món ngon từ cộng đồng đang chờ bạn.',
        points: [['📖', 'Lưu công thức yêu thích'], ['📚', 'Gom món thành bộ sưu tập riêng'], ['⭐', 'Đánh giá và bình luận món ăn']],
      }}
    >
      {error && <p className="alert" role="alert">{error}</p>}
      <label>Email
        <input type="email" required autoComplete="email" placeholder="ban@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </label>
      <label>Mật khẩu
        <PasswordInput required autoComplete="current-password" placeholder="Nhập mật khẩu" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      </label>
      <button className="btn btn-primary" disabled={busy}>{busy ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
      <p className="auth-alt">Chưa có tài khoản? <Link to="/register">Đăng ký miễn phí</Link></p>
    </AuthLayout>
  );
}
