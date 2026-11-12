import { useEffect, useState } from 'react';
import { api } from '../api';
import { useRecipeStore } from '../store/recipeStore.js';
import { CATEGORIES, CATEGORY_STYLE } from '../constants.js';
import RecipeCard from '../components/RecipeCard.jsx';
import Pagination from '../components/Pagination.jsx';
import useTitle from '../useTitle.js';

export default function Home() {
  useTitle('Trang chủ');
  const { recipes, page, totalPages, total, loading, error, filters, setFilters, fetchRecipes } = useRecipeStore();
  const [text, setText] = useState(filters.search);
  const [featured, setFeatured] = useState([]);

  // Khu "Được đánh giá cao": lấy 3 món điểm cao nhất
  useEffect(() => {
    api.get('/recipes?sort=rating&limit=3').then((d) => setFeatured(d.recipes.filter((r) => r.ratingCount > 0))).catch(() => {});
  }, []);

  // Vào trang: tải danh sách (giữ trang và bộ lọc đã chọn lần trước)
  useEffect(() => {
    fetchRecipes(page);
  }, []);

  // Gõ tìm kiếm: đợi 350ms sau lần gõ cuối rồi mới gọi API
  useEffect(() => {
    if (text.trim() === filters.search) return;
    const timer = setTimeout(() => setFilters({ search: text.trim() }), 350);
    return () => clearTimeout(timer);
  }, [text]);

  function changePage(p) {
    fetchRecipes(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <>
      <section className="hero">
        <span className="float f1" aria-hidden="true">🍅</span>
        <span className="float f2" aria-hidden="true">🌿</span>
        <span className="float f3" aria-hidden="true">🍋</span>
        <span className="float f4" aria-hidden="true">🥕</span>
        <h1>Hôm nay nấu gì?</h1>
        <p>Khám phá công thức từ cộng đồng, lưu lại món yêu thích và chia sẻ bí quyết của riêng bạn.</p>
        <input
          className="hero-search"
          type="search"
          placeholder="Tìm theo tên món hoặc nguyên liệu, ví dụ: cà chua"
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="Tìm công thức"
        />
      </section>

      {featured.length > 0 && !filters.search && !filters.category && page === 1 && (
        <section>
          <h2 className="section-title">Được đánh giá cao</h2>
          <div className="grid">{featured.map((r) => <RecipeCard key={r._id} recipe={r} />)}</div>
          <h2 className="section-title">Tất cả công thức</h2>
        </section>
      )}

      <div className="toolbar">
        <div className="chips">
          <button className={`chip ${filters.category === '' ? 'active' : ''}`} onClick={() => setFilters({ category: '' })}>Tất cả</button>
          {CATEGORIES.map((c) => (
            <button key={c} className={`chip ${filters.category === c ? 'active' : ''}`} onClick={() => setFilters({ category: c })}>{CATEGORY_STYLE[c].icon} {c}</button>
          ))}
        </div>
        <select value={filters.sort} onChange={(e) => setFilters({ sort: e.target.value })} aria-label="Sắp xếp">
          <option value="newest">Mới nhất</option>
          <option value="popular">Được thích nhiều</option>
          <option value="quick">Nấu nhanh nhất</option>
          <option value="rating">Đánh giá cao</option>
          <option value="views">Xem nhiều</option>
        </select>
      </div>

      {error && <p className="alert">{error}</p>}
      {loading && recipes.length === 0 && (
        <div className="grid">{[1, 2, 3, 4, 5, 6].map((n) => <div key={n} className="skeleton" />)}</div>
      )}
      {!loading && !error && recipes.length === 0 && (
        <p className="state">Chưa có công thức nào khớp. Thử bỏ bộ lọc hoặc tìm từ khóa khác.</p>
      )}

      {recipes.length > 0 && <p className="count">{total} công thức</p>}
      <div className={`grid ${loading ? 'dim' : ''}`}>
        {recipes.map((r) => <RecipeCard key={r._id} recipe={r} />)}
      </div>
      <Pagination page={page} totalPages={totalPages} onChange={changePage} />
    </>
  );
}
