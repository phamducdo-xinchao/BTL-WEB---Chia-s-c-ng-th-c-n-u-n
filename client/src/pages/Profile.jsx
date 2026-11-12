import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext.jsx';
import RecipeCard from '../components/RecipeCard.jsx';
import { useToast } from '../context/UIContext.jsx';
import useTitle from '../useTitle.js';

const TABS = [
  { key: 'recipes', label: 'Công thức của tôi', path: '/users/me/recipes', empty: 'Bạn chưa đăng công thức nào.' },
  { key: 'saved', label: 'Đã lưu', path: '/users/me/saved', empty: 'Bạn chưa lưu công thức nào.' },
  { key: 'account', label: 'Tài khoản' },
];

// Form đổi tên và đổi mật khẩu
function AccountForm() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user.name);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [error, setError] = useState('');

  async function saveName(e) {
    e.preventDefault();
    try {
      const data = await api.put('/users/me', { name });
      updateUser(data.user);
      setError('');
      toast.success('Đã cập nhật tên');
    } catch (err) {
      setError(err.message);
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    if (pw.newPassword !== pw.confirm) return setError('Mật khẩu nhập lại không khớp');
    try {
      await api.put('/users/me/password', { currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
      setError('');
      toast.success('Đã đổi mật khẩu');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="account">
      {error && <p className="alert">{error}</p>}
      <form className="form-card" onSubmit={saveName}>
        <h2>Thông tin cá nhân</h2>
        <label>Tên hiển thị<input value={name} onChange={(e) => setName(e.target.value)} maxLength={50} /></label>
        <label>Email<input value={user.email} disabled /></label>
        <button className="btn btn-primary" type="submit">Lưu tên</button>
      </form>
      <form className="form-card" onSubmit={savePassword}>
        <h2>Đổi mật khẩu</h2>
        <label>Mật khẩu hiện tại<input type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></label>
        <label>Mật khẩu mới (tối thiểu 6 ký tự)<input type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></label>
        <label>Nhập lại mật khẩu mới<input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></label>
        <button className="btn btn-primary" type="submit">Đổi mật khẩu</button>
      </form>
    </div>
  );
}

export default function Profile() {
  useTitle('Tài khoản của tôi');
  const { user } = useAuth();
  const [tab, setTab] = useState(TABS[0]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!tab.path) return;
    setLoading(true);
    setError('');
    api
      .get(tab.path)
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <>
      <h1>{user.name}</h1>
      <p className="detail-meta">{user.email}</p>
      <div className="chips tabs">
        {TABS.map((t) => (
          <button key={t.key} className={`chip ${tab.key === t.key ? 'active' : ''}`} onClick={() => setTab(t)}>{t.label}</button>
        ))}
      </div>
      {tab.key === 'account' && <AccountForm />}
      {tab.path && error && <p className="alert">{error}</p>}
      {tab.path && loading && <p className="state">Đang tải...</p>}
      {tab.path && !loading && !error && items.length === 0 && (
        <p className="state">{tab.empty} <Link to={tab.key === 'recipes' ? '/recipes/new' : '/'}>{tab.key === 'recipes' ? 'Đăng công thức đầu tiên' : 'Xem công thức'}</Link></p>
      )}
      <div className="grid">{tab.path && items.map((r) => <RecipeCard key={r._id} recipe={r} />)}</div>
    </>
  );
}
