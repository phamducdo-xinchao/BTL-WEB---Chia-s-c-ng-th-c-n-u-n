import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { DELIVERY_METHOD, formatVND, ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS } from '../constants.js';
import StatusBadge from '../components/StatusBadge.jsx';
import OrderItems from '../components/OrderItems.jsx';
import { useConfirm, useToast } from '../context/UIContext.jsx';
import useTitle from '../useTitle.js';

const EMPTY = { name: '', price: '', unit: '', stock: '', emoji: '🧺', imageUrl: '', description: '', active: true, recipes: [] };

export default function AdminShop() {
  useTitle('Quản lý cửa hàng');
  const [tab, setTab] = useState('products');
  return (
    <>
      <Link to="/admin" className="back">← Quản trị</Link>
      <h1>Quản lý cửa hàng</h1>
      <div className="chips tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'products'} className={`chip ${tab === 'products' ? 'active' : ''}`} onClick={() => setTab('products')}>Sản phẩm</button>
        <button role="tab" aria-selected={tab === 'orders'} className={`chip ${tab === 'orders' ? 'active' : ''}`} onClick={() => setTab('orders')}>Đơn hàng</button>
      </div>
      {tab === 'products' ? <ProductsTab /> : <OrdersTab />}
    </>
  );
}

// ---------- Sản phẩm: thêm, sửa, xóa, gắn công thức ----------
function ProductsTab() {
  const toast = useToast();
  const confirm = useConfirm();
  const [products, setProducts] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [recipeQuery, setRecipeQuery] = useState('');
  const [recipeResults, setRecipeResults] = useState([]);

  useEffect(() => {
    api.get('/products/admin/all').then(setProducts).catch((err) => setError(err.message));
  }, []);

  // Tìm công thức để gắn vào sản phẩm
  useEffect(() => {
    if (!recipeQuery.trim()) return setRecipeResults([]);
    const t = setTimeout(() => {
      api.get(`/recipes?search=${encodeURIComponent(recipeQuery.trim())}&limit=6`).then((d) => setRecipeResults(d.recipes)).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [recipeQuery]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const linked = (id) => form.recipes.some((r) => r._id === id);
  const link = (r) => !linked(r._id) && setForm({ ...form, recipes: [...form.recipes, { _id: r._id, title: r.title }] });
  const unlink = (id) => setForm({ ...form, recipes: form.recipes.filter((r) => r._id !== id) });

  function reset() {
    setForm(EMPTY);
    setEditId(null);
    setRecipeQuery('');
    setError('');
  }

  function startEdit(p) {
    setEditId(p._id);
    setForm({ name: p.name, price: String(p.price), unit: p.unit, stock: String(p.stock), emoji: p.emoji || '🧺', imageUrl: p.imageUrl, description: p.description, active: p.active, recipes: p.recipes });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function save(e) {
    e.preventDefault();
    try {
      const body = { ...form, price: Number(form.price), stock: Number(form.stock), recipes: form.recipes.map((r) => r._id) };
      if (editId) {
        const p = await api.put(`/products/${editId}`, body);
        setProducts(products.map((x) => (x._id === editId ? p : x)));
        toast.success('Đã cập nhật sản phẩm');
      } else {
        const p = await api.post('/products', body);
        setProducts([p, ...products]);
        toast.success('Đã thêm sản phẩm');
      }
      reset();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(p) {
    const ok = await confirm({ title: 'Xóa sản phẩm?', message: `Xóa "${p.name}"? Các đơn cũ vẫn giữ nguyên thông tin đã mua.`, okText: 'Xóa' });
    if (!ok) return;
    try {
      await api.del(`/products/${p._id}`);
      setProducts(products.filter((x) => x._id !== p._id));
      if (editId === p._id) reset();
      toast.success('Đã xóa sản phẩm');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <h2>{editId ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h2>
      {error && <p className="alert">{error}</p>}
      <form className="panel product-form" onSubmit={save}>
        <label>Tên sản phẩm<input value={form.name} onChange={set('name')} maxLength={100} required /></label>
        <label>Giá (đồng)<input type="number" min="0" step="1" value={form.price} onChange={set('price')} required /></label>
        <label>Đơn vị<input value={form.unit} onChange={set('unit')} maxLength={20} placeholder="kg, gói, chai..." /></label>
        <label>Tồn kho<input type="number" min="0" step="1" value={form.stock} onChange={set('stock')} required /></label>
        <label>Biểu tượng (emoji)<input value={form.emoji} onChange={set('emoji')} maxLength={8} placeholder="🥩" /></label>
        <label className="wide">Link ảnh (không bắt buộc, ưu tiên hơn biểu tượng)<input value={form.imageUrl} onChange={set('imageUrl')} placeholder="https://..." /></label>
        <label className="wide">Mô tả<input value={form.description} onChange={set('description')} maxLength={300} /></label>
        <div className="wide">
          <strong>Công thức gợi ý</strong>
          <div className="chips linked">
            {form.recipes.length === 0 && <span className="hint">Chưa gắn công thức nào.</span>}
            {form.recipes.map((r) => (
              <span key={r._id} className="chip active">{r.title} <button type="button" className="chip-x" onClick={() => unlink(r._id)} aria-label={`Gỡ ${r.title}`}>✕</button></span>
            ))}
          </div>
          <input type="search" placeholder="Gõ tên món để tìm và gắn..." value={recipeQuery} onChange={(e) => setRecipeQuery(e.target.value)} />
          {recipeResults.length > 0 && (
            <div className="chips linked">
              {recipeResults.map((r) => (
                <button key={r._id} type="button" className="chip" disabled={linked(r._id)} onClick={() => link(r)}>＋ {r.title}</button>
              ))}
            </div>
          )}
        </div>
        <label className="check wide"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Đang bán (bỏ chọn để ẩn khỏi cửa hàng)</label>
        <div className="wide actions">
          <button className="btn btn-primary" type="submit">{editId ? 'Lưu thay đổi' : 'Thêm sản phẩm'}</button>
          {editId && <button className="btn btn-ghost" type="button" onClick={reset}>Hủy sửa</button>}
        </div>
      </form>

      <h2>Danh sách sản phẩm {products && <span className="count-pill">{products.length}</span>}</h2>
      {!products && !error && <p className="state">Đang tải...</p>}
      {products && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Tên</th><th>Giá</th><th>Tồn</th><th>Công thức</th><th>Trạng thái</th><th></th></tr></thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id}>
                  <td>{p.name}</td>
                  <td>{formatVND(p.price)} / {p.unit}</td>
                  <td>{p.stock}</td>
                  <td>{p.recipes.length}</td>
                  <td>{p.active ? 'Đang bán' : 'Đang ẩn'}</td>
                  <td>
                    <button className="link-btn" onClick={() => startEdit(p)}>Sửa</button>{' '}
                    <button className="link-btn" onClick={() => remove(p)}>Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// ---------- Đơn hàng: xem và cập nhật trạng thái ----------
function OrdersTab() {
  const toast = useToast();
  const confirm = useConfirm();
  const [filter, setFilter] = useState('');
  const [orders, setOrders] = useState(null);
  const [open, setOpen] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setOrders(null);
    api.get(`/orders/admin/all${filter ? `?status=${filter}` : ''}`).then(setOrders).catch((err) => setError(err.message));
  }, [filter]);

  async function change(order, status) {
    if (status === 'cancelled') {
      const ok = await confirm({ title: 'Hủy đơn hàng?', message: `Hủy đơn #${order.code}? Hàng sẽ được trả về kho.`, okText: 'Hủy đơn' });
      if (!ok) return;
    }
    try {
      const updated = await api.put(`/orders/admin/${order._id}/status`, { status });
      setOrders(orders.map((o) => (o._id === order._id ? updated : o)).filter((o) => !filter || o.status === filter));
      toast.success('Đã cập nhật đơn hàng');
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <>
      <div className="chips tabs">
        <button className={`chip ${filter === '' ? 'active' : ''}`} onClick={() => setFilter('')}>Tất cả</button>
        {Object.entries(ORDER_STATUS).map(([k, v]) => (
          <button key={k} className={`chip ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>{v.label}</button>
        ))}
      </div>
      {error && <p className="alert">{error}</p>}
      {!orders && !error && <p className="state">Đang tải...</p>}
      {orders?.length === 0 && <p className="state">Chưa có đơn hàng nào.</p>}
      {orders?.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Mã đơn</th><th>Khách</th><th>Ngày đặt</th><th>Tổng</th><th>Thanh toán</th><th>Trạng thái</th><th></th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <FragmentRows key={o._id} o={o} open={open === o._id} onToggle={() => setOpen(open === o._id ? null : o._id)} onChange={change} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function FragmentRows({ o, open, onToggle, onChange }) {
  return (
    <>
      <tr>
        <td><button className="link-btn" onClick={onToggle} aria-expanded={open}>#{o.code} {open ? '▲' : '▼'}</button></td>
        <td>{o.user?.name || o.receiverName}</td>
        <td>{new Date(o.createdAt).toLocaleDateString('vi-VN')}</td>
        <td>{formatVND(o.total)}</td>
        <td><StatusBadge map={PAYMENT_STATUS} value={o.paymentStatus} /></td>
        <td><StatusBadge map={ORDER_STATUS} value={o.status} /></td>
        <td>
          {o.status === 'pending' && <button className="link-btn" onClick={() => onChange(o, 'shipping')}>Xác nhận, giao</button>}
          {o.status === 'shipping' && <button className="link-btn" onClick={() => onChange(o, 'done')}>Hoàn thành</button>}
          {(o.status === 'pending' || o.status === 'shipping') && <>{' '}<button className="link-btn" onClick={() => onChange(o, 'cancelled')}>Hủy</button></>}
        </td>
      </tr>
      {open && (
        <tr className="detail-row">
          <td colSpan="7">
            <div className="detail-grid">
              <div>
                <p><strong>{o.receiverName}</strong> · {o.phone}</p>
                <p>{DELIVERY_METHOD[o.deliveryMethod]}: {o.address}{o.deliveryMethod === 'delivery' ? `, ${o.province}` : ''}</p>
                <p>{PAYMENT_METHOD[o.paymentMethod]}</p>
                {o.note && <p className="hint">Ghi chú: {o.note}</p>}
              </div>
              <OrderItems order={o} />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
