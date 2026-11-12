import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../context/UIContext.jsx';
import useTitle from '../useTitle.js';

// Danh sách bộ sưu tập của tôi + form tạo mới
export default function Collections() {
  useTitle('Bộ sưu tập');
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/collections').then(setItems).catch((err) => setError(err.message));
  }, []);

  async function create(e) {
    e.preventDefault();
    try {
      const c = await api.post('/collections', form);
      setItems([c, ...items]);
      setForm({ name: '', description: '' });
      setError('');
      toast.success('Đã tạo bộ sưu tập');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <h1>Bộ sưu tập của tôi</h1>
      <p className="detail-meta">Gom các công thức yêu thích thành từng nhóm, ví dụ "Món cho cuối tuần".</p>
      <form className="admin-form" onSubmit={create}>
        <input placeholder="Tên bộ sưu tập" maxLength={60} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input placeholder="Mô tả ngắn (không bắt buộc)" maxLength={300} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <button className="btn btn-primary" type="submit">Tạo mới</button>
      </form>
      {error && <p className="alert">{error}</p>}
      {!items && !error && <p className="state">Đang tải...</p>}
      {items && items.length === 0 && <p className="state">Bạn chưa có bộ sưu tập nào. Hãy tạo bộ sưu tập đầu tiên ở trên.</p>}
      <div className="grid">
        {items?.map((c) => (
          <Link key={c._id} to={`/collections/${c._id}`} className="card">
            <div className="card-body">
              <h3>{c.name}</h3>
              {c.description && <p className="card-desc">{c.description}</p>}
              <div className="card-meta"><span>{c.count} công thức</span></div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
