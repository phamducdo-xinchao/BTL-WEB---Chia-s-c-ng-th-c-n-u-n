import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import AuthLayout from '../components/AuthLayout.jsx';
import PasswordInput from '../components/PasswordInput.jsx';
import useTitle from '../useTitle.js';

const LABELS = ['Quá ngắn', 'Yếu', 'Trung bình', 'Khá', 'Mạnh'];

// Chấm độ mạnh của mật khẩu từ 0 đến 4
function strength(p) {
  if (p.length < 6) return 0;
  let s = 1;
  if (p.length >= 10) s++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
  if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) s++;
  return s;
}

export default function Register() {
  useTitle('Đăng ký');
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const score = strength(form.password);

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirm) return setError('Mật khẩu nhập lại không khớp');
    setError('');
    setBusy(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Tạo tài khoản"
      subtitle="Chỉ mất một phút để bắt đầu chia sẻ công thức."
      onSubmit={handleSubmit}
      side={{
        heading: 'Gia nhập cộng đồng nấu ăn',
        text: 'Chia sẻ bí quyết của bạn và học thêm món mới mỗi ngày.',
        points: [['🍲', 'Đăng công thức của riêng bạn'], ['❤', 'Thích và lưu món ngon'], ['💬', 'Trò chuyện cùng người nấu']],
      }}
    >
      {error && <p className="alert" role="alert">{error}</p>}
      <label>Tên hiển thị
        <input required maxLength={50} autoComplete="name" placeholder="Ví dụ: Lan Anh" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </label>
      <label>Email
        <input type="email" required autoComplete="email" placeholder="ban@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </label>
      <label>Mật khẩu
        <PasswordInput required minLength={6} autoComplete="new-password" placeholder="Tối thiểu 6 ký tự" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {form.password && (
          <span className="strength" data-level={score}>
            <span className="strength-bar"><span style={{ width: `${(score / 4) * 100}%` }} /></span>
            <small>{LABELS[score]}</small>
          </span>
        )}
      </label>
      <label>Nhập lại mật khẩu
        <PasswordInput required autoComplete="new-password" placeholder="Nhập lại mật khẩu" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
      </label>
      <button className="btn btn-primary" disabled={busy}>{busy ? 'Đang tạo...' : 'Tạo tài khoản'}</button>
      <p className="auth-alt">Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p>
    </AuthLayout>
  );
}
