import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { formatVND } from '../constants.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useConfirm, useToast } from '../context/UIContext.jsx';
import useTitle from '../useTitle.js';

export default function Admin() {
  useTitle('Quản trị');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const { user: me } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [editId, setEditId] = useState(null); // người dùng đang sửa
  const [edit, setEdit] = useState({ name: '', role: 'user', password: '' });
  const toast = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    Promise.all([api.get('/admin/stats'), api.get('/admin/users')])
      .then(([s, u]) => {
        setStats(s);
        setUsers(u);
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error && !stats) return <p className="alert">{error}</p>;
  if (!stats) return <p className="state">Đang tải...</p>;

  async function addUser(e) {
    e.preventDefault();
    try {
      const u = await api.post('/admin/users', form);
      setUsers([u, ...users]);
      setForm({ name: '', email: '', password: '', role: 'user' });
      setError('');
      toast.success('Đã thêm người dùng');
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(u) {
    setEditId(u.id);
    setEdit({ name: u.name, role: u.role, password: '' });
  }

  async function saveEdit(id) {
    try {
      const body = { name: edit.name, role: edit.role };
      if (edit.password) body.password = edit.password;
      const u = await api.put(`/admin/users/${id}`, body);
      setUsers(users.map((x) => (x.id === id ? u : x)));
      setEditId(null);
      setError('');
      toast.success('Đã cập nhật người dùng');
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeUser(u) {
    if (!(await confirm({ title: `Xóa ${u.name}?`, message: 'Công thức và bình luận của người này cũng sẽ bị xóa.', okText: 'Xóa' }))) return;
    try {
      await api.del(`/admin/users/${u.id}`);
      setUsers(users.filter((x) => x.id !== u.id));
      setError('');
      toast.success('Đã xóa người dùng');
    } catch (err) {
      setError(err.message);
    }
  }

  const max = Math.max(...stats.byCategory.map((c) => c.count), 1);

  return (
    <>
      <h1>Quản trị</h1>
      <div className="stats">
        <div className="panel"><strong>{stats.users}</strong> người dùng</div>
        <div className="panel"><strong>{stats.recipes}</strong> công thức</div>
        <div className="panel"><strong>{stats.comments}</strong> bình luận</div>
        <div className="panel"><strong>{formatVND(stats.revenue)}</strong> doanh thu đã thu</div>
        <Link to="/admin/shop" className="panel stat-link"><strong>{stats.orders}</strong> đơn hàng ({stats.pendingOrders} chờ xác nhận) <span>Quản lý cửa hàng →</span></Link>
      </div>

      <h2>Công thức theo danh mục</h2>
      <div className="bars">
        {stats.byCategory.map((c) => (
          <div key={c.category} className="bar-row">
            <span>{c.category}</span>
            <div className="bar"><div style={{ width: `${(c.count / max) * 100}%` }} /></div>
            <span>{c.count}</span>
          </div>
        ))}
      </div>

      <h2>Quản lý người dùng</h2>
      {error && <p className="alert">{error}</p>}
      <form className="admin-form" onSubmit={addUser}>
        <input placeholder="Tên" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input placeholder="Mật khẩu" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="user">Người dùng</option>
          <option value="admin">Quản trị</option>
        </select>
        <button className="btn btn-primary" type="submit">Thêm</button>
      </form>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Tên</th><th>Email</th><th>Vai trò</th><th>Số công thức</th><th>Ngày tạo</th><th></th></tr>
          </thead>
          <tbody>
            {users.map((u) =>
              editId === u.id ? (
                <tr key={u.id}>
                  <td><input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></td>
                  <td>{u.email}</td>
                  <td>
                    <select value={edit.role} disabled={u.id === me.id} onChange={(e) => setEdit({ ...edit, role: e.target.value })}>
                      <option value="user">Người dùng</option>
                      <option value="admin">Quản trị</option>
                    </select>
                  </td>
                  <td colSpan="2">
                    <input type="password" placeholder="Mật khẩu mới (bỏ trống nếu giữ nguyên)" value={edit.password} onChange={(e) => setEdit({ ...edit, password: e.target.value })} />
                  </td>
                  <td>
                    <button className="link-btn" onClick={() => saveEdit(u.id)}>Lưu</button>{' '}
                    <button className="link-btn" onClick={() => setEditId(null)}>Hủy</button>
                  </td>
                </tr>
              ) : (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role === 'admin' ? 'Quản trị' : 'Người dùng'}</td>
                  <td>{u.recipeCount}</td>
                  <td>{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td>
                    <button className="link-btn" onClick={() => startEdit(u)}>Sửa</button>
                    {u.id !== me.id && (<>{' '}<button className="link-btn" onClick={() => removeUser(u)}>Xóa</button></>)}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
      <p className="state">Quản trị viên có thể xóa mọi công thức và bình luận ngay tại trang chi tiết của chúng.</p>
    </>
  );
}
