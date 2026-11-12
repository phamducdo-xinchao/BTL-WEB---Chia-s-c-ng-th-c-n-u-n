import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext.jsx';
import RecipeCard from '../components/RecipeCard.jsx';
import StarRating from '../components/StarRating.jsx';
import Avatar from '../components/Avatar.jsx';
import { CATEGORY_STYLE } from '../constants.js';
import AddToCollection from '../components/AddToCollection.jsx';
import RecipeProducts from '../components/RecipeProducts.jsx';
import useTitle from '../useTitle.js';
import { useConfirm, useToast } from '../context/UIContext.jsx';

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, setSaved } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();

  const [recipe, setRecipe] = useState(null);
  const [comments, setComments] = useState([]);
  useTitle(recipe?.title || 'Công thức');
  const [text, setText] = useState('');
  const [related, setRelated] = useState([]);
  const [imgBroken, setImgBroken] = useState(false);
  const [done, setDone] = useState({}); // nguyên liệu, bước đã tick khi đang nấu
  const [editingId, setEditingId] = useState(null); // bình luận đang được sửa
  const [editText, setEditText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setRecipe(null);
    setError('');
    setDone({});
    setImgBroken(false);
    Promise.all([api.get(`/recipes/${id}`), api.get(`/recipes/${id}/comments`)])
      .then(([r, c]) => {
        setRecipe(r);
        setComments(c);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  // Công thức liên quan: cùng danh mục, bỏ chính nó
  useEffect(() => {
    if (!recipe) return;
    api.get(`/recipes?category=${encodeURIComponent(recipe.category)}&limit=3&sort=popular&exclude=${id}`).then((d) => setRelated(d.recipes)).catch(() => setRelated([]));
  }, [id, recipe?.category]);

  if (error && !recipe) return <p className="alert">{error}</p>;
  if (!recipe) return <p className="state">Đang tải công thức...</p>;

  const isAdmin = user?.role === 'admin';
  const canEdit = user && (isAdmin || user.id === recipe.author._id);
  const liked = user ? recipe.likes.includes(user.id) : false;
  const saved = user ? user.savedRecipes.includes(id) : false;

  // Chưa đăng nhập thì chuyển sang trang đăng nhập, xong quay lại đây
  function requireLogin() {
    if (user) return true;
    navigate('/login', { state: { from: `/recipes/${id}` } });
    return false;
  }

  async function toggleLike() {
    if (!requireLogin()) return;
    try {
      const r = await api.post(`/recipes/${id}/like`);
      setRecipe((rc) => ({
        ...rc,
        likesCount: r.likesCount,
        likes: r.liked ? [...rc.likes, user.id] : rc.likes.filter((x) => x !== user.id),
      }));
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleSave() {
    if (!requireLogin()) return;
    try {
      const r = await api.post(`/recipes/${id}/save`);
      setSaved(id, r.saved);
      toast.success(r.saved ? 'Đã lưu công thức' : 'Đã bỏ lưu công thức');
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeRecipe() {
    if (!(await confirm({ title: 'Xóa công thức?', message: 'Bình luận của công thức này cũng sẽ bị xóa.', okText: 'Xóa' }))) return;
    try {
      await api.del(`/recipes/${id}`);
      toast.success('Đã xóa công thức');
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  }

  async function addComment(e) {
    e.preventDefault();
    if (!requireLogin() || !text.trim()) return;
    try {
      const c = await api.post(`/recipes/${id}/comments`, { content: text });
      setComments([c, ...comments]);
      setText('');
      setError('');
      toast.success('Đã gửi bình luận');
    } catch (err) {
      setError(err.message);
    }
  }

  async function rate(value) {
    if (!requireLogin()) return;
    try {
      const r = await api.post(`/recipes/${id}/rate`, { value });
      setRecipe((rc) => ({ ...rc, ratingAvg: r.ratingAvg, ratingCount: r.ratingCount, ratings: [...(rc.ratings || []).filter((x) => x.user !== user.id), { user: user.id, value }] }));
      toast.success('Cảm ơn bạn đã đánh giá');
    } catch (err) {
      toast.error(err.message);
    }
  }

  const toggleDone = (key) => setDone((d) => ({ ...d, [key]: !d[key] }));
  const myRating = user ? recipe.ratings?.find((x) => x.user === user.id)?.value || 0 : 0;
  const isAuthor = user && user.id === recipe.author._id;
  const style = CATEGORY_STYLE[recipe.category] || { icon: '🍽️', tint: '#e5e9e1' };
  const doneCount = recipe.ingredients.filter((_, i) => done['i' + i]).length;
  const pct = Math.round((doneCount / recipe.ingredients.length) * 100);

  async function shareLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Đã sao chép liên kết');
    } catch {
      toast.error('Không sao chép được, hãy copy từ thanh địa chỉ');
    }
  }

  function startEdit(c) {
    setEditingId(c._id);
    setEditText(c.content);
  }

  async function saveEdit(commentId) {
    if (!editText.trim()) return;
    try {
      const updated = await api.put(`/comments/${commentId}`, { content: editText });
      setComments(comments.map((c) => (c._id === commentId ? updated : c)));
      setEditingId(null);
      setError('');
      toast.success('Đã cập nhật bình luận');
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeComment(commentId) {
    try {
      await api.del(`/comments/${commentId}`);
      setComments(comments.filter((c) => c._id !== commentId));
      toast.success('Đã xóa bình luận');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <article className="detail">
      <Link to="/" className="back">Quay lại danh sách</Link>
      <header className="recipe-hero">
        <div className="hero-media" style={{ background: style.tint }}>
          {recipe.imageUrl && !imgBroken ? (
            <img src={recipe.imageUrl} alt={recipe.title} onError={() => setImgBroken(true)} />
          ) : (
            <div className="hero-fallback" aria-hidden="true">
              <span className="hf main">{style.icon}</span>
              <span className="hf a">{style.icon}</span>
              <span className="hf b">{style.icon}</span>
              <span className="hf c">{style.icon}</span>
            </div>
          )}
          <span className="badge badge-lg">{style.icon} {recipe.category}</span>
        </div>
        <div className="hero-info">
          <h1>{recipe.title}</h1>
          <div className="author-line">
            <Avatar name={recipe.author.name} />
            <span>Đăng bởi <strong>{recipe.author.name}</strong> · {new Date(recipe.createdAt).toLocaleDateString('vi-VN')}</span>
          </div>
          {recipe.description && <p className="lead">{recipe.description}</p>}
        </div>
      </header>

      <div className="stat-row">
        <div className="stat"><span className="stat-icon">⏱</span><strong>{recipe.cookTime} phút</strong><small>Thời gian nấu</small></div>
        <div className="stat"><span className="stat-icon">🍽</span><strong>{recipe.servings} người</strong><small>Khẩu phần</small></div>
        <div className="stat"><span className="stat-icon star-on">★</span><strong>{recipe.ratingCount > 0 ? recipe.ratingAvg : '—'}</strong><small>{recipe.ratingCount > 0 ? `${recipe.ratingCount} đánh giá` : 'Chưa có đánh giá'}</small></div>
        <div className="stat"><span className="stat-icon">♥</span><strong>{recipe.likesCount}</strong><small>Lượt thích</small></div>
        <div className="stat"><span className="stat-icon">👁</span><strong>{recipe.views}</strong><small>Lượt xem</small></div>
      </div>

      <div className="actions">
        <button className={`btn ${liked ? 'btn-primary' : 'btn-ghost'}`} onClick={toggleLike}>
          {liked ? 'Đã thích' : 'Thích'} ({recipe.likesCount})
        </button>
        <button className={`btn ${saved ? 'btn-herb' : 'btn-ghost'}`} onClick={toggleSave}>
          {saved ? 'Đã lưu' : 'Lưu công thức'}
        </button>
        {user && <AddToCollection recipeId={id} />}
        <button className="btn btn-ghost" onClick={shareLink}>Chia sẻ</button>
        <button className="btn btn-ghost" onClick={() => window.print()}>In</button>
        {canEdit && <Link to={`/recipes/${id}/edit`} className="btn btn-ghost">Sửa</Link>}
        {canEdit && <button className="btn btn-danger" onClick={removeRecipe}>Xóa</button>}
      </div>

      {!isAuthor && (
        <div className="rate-box">
          <span>{myRating ? 'Đánh giá của bạn:' : 'Bạn thấy công thức này thế nào?'}</span>
          <StarRating value={myRating} onChange={rate} />
        </div>
      )}

      {error && <p className="alert">{error}</p>}

      <div className="recipe-body">
        <section className="panel ingredients">
          <h2>Nguyên liệu <span className="count-pill">{recipe.ingredients.length}</span></h2>
          <div className="progress" aria-hidden="true"><div style={{ width: `${pct}%` }} /></div>
          <p className="hint">{doneCount}/{recipe.ingredients.length} đã chuẩn bị. Bấm vào từng mục để đánh dấu.</p>
          <ul>{recipe.ingredients.map((item, i) => <li key={i} className={`tick ${done['i' + i] ? 'done' : ''}`} onClick={() => toggleDone('i' + i)}>{item}</li>)}</ul>
        </section>
        <section className="steps">
          <h2>Cách làm <span className="count-pill">{recipe.steps.length} bước</span></h2>
          <ol>{recipe.steps.map((s, i) => <li key={i} className={`tick ${done['s' + i] ? 'done' : ''}`} onClick={() => toggleDone('s' + i)}>{s}</li>)}</ol>
        </section>
      </div>

      <RecipeProducts recipeId={id} />

      <section className="comments">
        <h2>Bình luận ({comments.length})</h2>
        <form onSubmit={addComment} className="comment-form">
          <textarea
            rows="3"
            maxLength={500}
            placeholder={user ? 'Bạn đã thử nấu món này chưa?' : 'Đăng nhập để bình luận'}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button className="btn btn-primary" type="submit">Gửi bình luận</button>
        </form>
        {comments.length === 0 && <p className="state">Chưa có bình luận nào.</p>}
        {comments.map((c) => (
          <div key={c._id} className="comment">
            <div className="comment-head">
              <Avatar name={c.user?.name} size={28} />
              <strong>{c.user?.name}</strong>
              <time>{new Date(c.createdAt).toLocaleDateString('vi-VN')}</time>
              <span className="comment-actions">
                {user && user.id === c.user?._id && editingId !== c._id && (
                  <button className="link-btn" onClick={() => startEdit(c)}>Sửa</button>
                )}
                {user && (isAdmin || user.id === c.user?._id) && (
                  <button className="link-btn" onClick={() => removeComment(c._id)}>Xóa</button>
                )}
              </span>
            </div>
            {editingId === c._id ? (
              <div className="comment-form">
                <textarea rows="3" maxLength={500} value={editText} onChange={(e) => setEditText(e.target.value)} />
                <div className="actions">
                  <button className="btn btn-primary" onClick={() => saveEdit(c._id)}>Lưu</button>
                  <button className="btn btn-ghost" onClick={() => setEditingId(null)}>Hủy</button>
                </div>
              </div>
            ) : (
              <p>{c.content}</p>
            )}
          </div>
        ))}
      </section>
      {related.length > 0 && (
        <section className="related">
          <h2>Công thức cùng danh mục</h2>
          <div className="grid">{related.map((r) => <RecipeCard key={r._id} recipe={r} />)}</div>
        </section>
      )}
    </article>
  );
}
