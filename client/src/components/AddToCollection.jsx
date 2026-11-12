import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../context/UIContext.jsx';

// Ô chọn "Thêm vào bộ sưu tập" ở trang chi tiết công thức
export default function AddToCollection({ recipeId }) {
  const toast = useToast();
  const [cols, setCols] = useState([]);

  useEffect(() => {
    api.get('/collections').then(setCols).catch(() => {});
  }, []);

  async function add(e) {
    const colId = e.target.value;
    if (!colId) return;
    try {
      await api.post(`/collections/${colId}/recipes`, { recipeId });
      toast.success('Đã thêm vào bộ sưu tập');
    } catch (err) {
      toast.error(err.message);
    }
    e.target.value = '';
  }

  if (cols.length === 0) return <Link to="/collections" className="btn btn-ghost">Tạo bộ sưu tập</Link>;
  return (
    <select className="btn btn-ghost" defaultValue="" onChange={add} aria-label="Thêm vào bộ sưu tập">
      <option value="" disabled>Thêm vào bộ sưu tập</option>
      {cols.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
    </select>
  );
}
