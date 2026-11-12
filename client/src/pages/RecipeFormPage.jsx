import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../context/UIContext.jsx';
import { api } from '../api';
import { CATEGORIES } from '../constants.js';
import useTitle from '../useTitle.js';

const EMPTY = { title: '', description: '', category: CATEGORIES[0], cookTime: 30, servings: 2, imageUrl: '', ingredients: '', steps: '' };

// Một trang dùng cho cả "Đăng công thức" (/recipes/new) và "Sửa" (/recipes/:id/edit)
export default function RecipeFormPage() {
  useTitle('Đăng công thức');
  const toast = useToast();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    api
      .get(`/recipes/${id}`)
      .then((r) => setForm({ ...r, ingredients: r.ingredients.join('\n'), steps: r.steps.join('\n') }))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    // Mỗi dòng trong ô nhập là một nguyên liệu / một bước
    const body = {
      title: form.title,
      description: form.description,
      category: form.category,
      imageUrl: form.imageUrl,
      cookTime: Number(form.cookTime),
      servings: Number(form.servings),
      ingredients: form.ingredients.split('\n'),
      steps: form.steps.split('\n'),
    };
    try {
      const saved = isEdit ? await api.put(`/recipes/${id}`, body) : await api.post('/recipes', body);
      toast.success(isEdit ? 'Đã cập nhật công thức' : 'Đã đăng công thức');
      navigate(`/recipes/${saved._id}`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  if (loading) return <p className="state">Đang tải...</p>;

  return (
    <form className="form-card wide" onSubmit={handleSubmit}>
      <h1>{isEdit ? 'Sửa công thức' : 'Đăng công thức mới'}</h1>
      {error && <p className="alert">{error}</p>}
      <label>Tên món
        <input required maxLength={120} value={form.title} onChange={set('title')} />
      </label>
      <label>Mô tả ngắn
        <textarea rows="2" maxLength={500} value={form.description} onChange={set('description')} />
      </label>
      <div className="row">
        <label>Danh mục
          <select value={form.category} onChange={set('category')}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label>Thời gian nấu (phút)
          <input type="number" min="1" max="1440" required value={form.cookTime} onChange={set('cookTime')} />
        </label>
        <label>Số người ăn
          <input type="number" min="1" max="100" value={form.servings} onChange={set('servings')} />
        </label>
      </div>
      <label>Link ảnh (không bắt buộc)
        <input type="url" placeholder="https://..." value={form.imageUrl} onChange={set('imageUrl')} />
      </label>
      <label>Nguyên liệu (mỗi dòng một nguyên liệu)
        <textarea rows="6" required value={form.ingredients} onChange={set('ingredients')} />
      </label>
      <label>Các bước làm (mỗi dòng một bước)
        <textarea rows="8" required value={form.steps} onChange={set('steps')} />
      </label>
      <button className="btn btn-primary" disabled={busy}>{busy ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Đăng công thức'}</button>
    </form>
  );
}
