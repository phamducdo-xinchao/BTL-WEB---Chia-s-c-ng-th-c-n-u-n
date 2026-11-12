import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useConfirm, useToast } from '../context/UIContext.jsx';
import RecipeCard from '../components/RecipeCard.jsx';
import useTitle from '../useTitle.js';

// Chi tiết một bộ sưu tập: sửa tên, xóa, gỡ từng công thức
export default function CollectionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const [col, setCol] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  useTitle(col?.name || 'Bộ sưu tập');

  useEffect(() => {
    api.get(`/collections/${id}`).then(setCol).catch((err) => setError(err.message));
  }, [id]);

  if (error && !col) return <p className="alert">{error}</p>;
  if (!col) return <p className="state">Đang tải...</p>;

  async function save(e) {
    e.preventDefault();
    try {
      const c = await api.put(`/collections/${id}`, form);
      setCol({ ...col, name: c.name, description: c.description });
      setEditing(false);
      setError('');
      toast.success('Đã cập nhật bộ sưu tập');
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeCollection() {
    if (!(await confirm({ title: 'Xóa bộ sưu tập?', message: 'Các công thức bên trong không bị xóa.', okText: 'Xóa' }))) return;
    try {
      await api.del(`/collections/${id}`);
      toast.success('Đã xóa bộ sưu tập');
      navigate('/collections');
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeRecipe(recipeId) {
    try {
      await api.del(`/collections/${id}/recipes/${recipeId}`);
      setCol({ ...col, recipes: col.recipes.filter((r) => r._id !== recipeId) });
      toast.success('Đã gỡ khỏi bộ sưu tập');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <Link to="/collections" className="back">Quay lại bộ sưu tập</Link>
      {editing ? (
        <form className="admin-form" onSubmit={save}>
          <input value={form.name} maxLength={60} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input value={form.description} maxLength={300} placeholder="Mô tả" onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <button className="btn btn-primary" type="submit">Lưu</button>
          <button className="btn btn-ghost" type="button" onClick={() => setEditing(false)}>Hủy</button>
        </form>
      ) : (
        <>
          <h1>{col.name}</h1>
          {col.description && <p className="lead">{col.description}</p>}
          <div className="actions">
            <button className="btn btn-ghost" onClick={() => { setForm({ name: col.name, description: col.description }); setEditing(true); }}>Sửa</button>
            <button className="btn btn-danger" onClick={removeCollection}>Xóa bộ sưu tập</button>
          </div>
        </>
      )}
      {error && <p className="alert">{error}</p>}
      {col.recipes.length === 0 && <p className="state">Chưa có công thức nào. Mở một công thức và chọn "Thêm vào bộ sưu tập".</p>}
      <div className="grid">
        {col.recipes.map((r) => (
          <div key={r._id} className="card-wrap">
            <RecipeCard recipe={r} />
            <button className="link-btn" onClick={() => removeRecipe(r._id)}>Gỡ khỏi bộ sưu tập</button>
          </div>
        ))}
      </div>
    </>
  );
}
