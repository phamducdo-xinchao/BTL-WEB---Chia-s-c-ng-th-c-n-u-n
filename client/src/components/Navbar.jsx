import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from './Avatar.jsx';
import { selectCount, useCartStore } from '../store/cartStore.js';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false); // menu thu gọn trên điện thoại
  const [menuOpen, setMenuOpen] = useState(false); // menu người dùng
  const menuRef = useRef(null);
  const cartCount = useCartStore(selectCount);

  // Đổi trang thì đóng các menu
  useEffect(() => {
    setOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  // Bấm ra ngoài hoặc nhấn Esc thì đóng menu người dùng
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e) => !menuRef.current?.contains(e.target) && setMenuOpen(false);
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand">Góc Bếp</Link>
        <button className="menu-toggle" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Mở menu">
          {open ? '✕' : '☰'}
        </button>
        <div className={`nav-collapse ${open ? 'open' : ''}`}>
          <nav className="nav-links" aria-label="Điều hướng chính">
            <NavLink to="/" end>Trang chủ</NavLink>
            <NavLink to="/shop">Cửa hàng</NavLink>
            {user && <NavLink to="/collections">Bộ sưu tập</NavLink>}
            {user && <NavLink to="/profile">Của tôi</NavLink>}
            {user?.role === 'admin' && <NavLink to="/admin">Quản trị</NavLink>}
          </nav>
          <div className="nav-actions">
            <Link to="/cart" className="cart-link" aria-label={`Giỏ hàng, ${cartCount} sản phẩm`}>
              🛒{cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>
            <Link to="/recipes/new" className="btn btn-primary btn-sm">＋ Đăng công thức</Link>
            {user ? (
              <div className="user-menu" ref={menuRef}>
                <button className="user-btn" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-haspopup="menu">
                  <Avatar name={user.name} size={32} />
                  <span className="user-name">{user.name}</span>
                  <span className="caret" aria-hidden="true">▼</span>
                </button>
                {menuOpen && (
                  <div className="dropdown" role="menu">
                    <div className="dropdown-head">
                      <strong>{user.name}</strong>
                      <small>{user.email}</small>
                    </div>
                    <Link to="/profile" role="menuitem">👤 Công thức và tài khoản</Link>
                    <Link to="/collections" role="menuitem">📚 Bộ sưu tập</Link>
                    <Link to="/orders" role="menuitem">🧾 Đơn hàng của tôi</Link>
                    {user.role === 'admin' && <Link to="/admin" role="menuitem">🛠 Quản trị</Link>}
                    {user.role === 'admin' && <Link to="/admin/shop" role="menuitem">🛒 Quản lý cửa hàng</Link>}
                    <button className="danger" role="menuitem" onClick={handleLogout}>↪ Đăng xuất</button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm">Đăng nhập</Link>
                <Link to="/register" className="btn btn-herb btn-sm">Đăng ký</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
