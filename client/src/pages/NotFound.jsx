import { Link } from 'react-router-dom';
import useTitle from '../useTitle.js';

export default function NotFound() {
  useTitle('Không tìm thấy trang');
  return (
    <div className="empty-page">
      <div className="empty-icon" aria-hidden="true">🍳</div>
      <h1>404 - Món này chưa có trong thực đơn</h1>
      <p>Đường dẫn bạn tìm không tồn tại hoặc đã bị xóa.</p>
      <Link to="/" className="btn btn-primary">Về trang chủ</Link>
    </div>
  );
}
