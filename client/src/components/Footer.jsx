import { Link, useNavigate } from 'react-router-dom';
import { CATEGORIES, CATEGORY_STYLE } from '../constants.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useRecipeStore } from '../store/recipeStore.js';

export default function Footer() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const setFilters = useRecipeStore((s) => s.setFilters);

  // Bấm một danh mục ở chân trang: lọc theo danh mục đó rồi về trang chủ
  function openCategory(category) {
    setFilters({ category });
    navigate('/');
  }

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <span className="sf-brand">Góc Bếp</span>
          <p>Nơi mọi người chia sẻ công thức nấu ăn, lưu món yêu thích và cùng nhau vào bếp mỗi ngày.</p>
        </div>
        <div>
          <h4>Khám phá</h4>
          <Link to="/">Trang chủ</Link>
          <Link to="/recipes/new">Đăng công thức</Link>
          <Link to="/collections">Bộ sưu tập</Link>
          <Link to="/shop">Cửa hàng nguyên liệu</Link>
        </div>
        <div>
          <h4>Danh mục</h4>
          {CATEGORIES.map((c) => (
            <button key={c} type="button" className="link" onClick={() => openCategory(c)}>{CATEGORY_STYLE[c].icon} {c}</button>
          ))}
        </div>
        <div>
          <h4>Tài khoản</h4>
          {user ? (
            <>
              <Link to="/profile">Công thức của tôi</Link>
              <Link to="/orders">Đơn hàng của tôi</Link>
              <Link to="/profile">Cài đặt tài khoản</Link>
            </>
          ) : (
            <>
              <Link to="/login">Đăng nhập</Link>
              <Link to="/register">Đăng ký</Link>
            </>
          )}
        </div>
      </div>
      <div className="site-footer-bottom">
        <div>
          <span>© {new Date().getFullYear()} Góc Bếp. Chia sẻ công thức, nấu ngon mỗi ngày.</span>
          <button type="button" className="link" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>↑ Về đầu trang</button>
        </div>
      </div>
    </footer>
  );
}
