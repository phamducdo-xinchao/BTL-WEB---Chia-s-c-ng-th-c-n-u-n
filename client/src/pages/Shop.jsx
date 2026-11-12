import { useEffect, useState } from 'react';
import { api } from '../api';
import ProductCard from '../components/ProductCard.jsx';
import Pagination from '../components/Pagination.jsx';
import useTitle from '../useTitle.js';

// Cửa hàng chung do admin quản lý
export default function Shop() {
  useTitle('Cửa hàng nguyên liệu');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  // Chờ người dùng ngừng gõ 300ms rồi mới tìm
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    api
      .get(`/products?search=${encodeURIComponent(query)}&page=${page}&limit=12`)
      .then((d) => {
        setData(d);
        setError('');
      })
      .catch((err) => setError(err.message));
  }, [query, page]);

  return (
    <>
      <h1>Cửa hàng nguyên liệu</h1>
      <p className="detail-meta">Chọn nguyên liệu, nhận tận nơi hoặc ghé điểm nhận hàng gần bạn.</p>
      <input
        className="shop-search"
        type="search"
        placeholder="Tìm nguyên liệu, ví dụ: bò, tôm, nước mắm..."
        aria-label="Tìm nguyên liệu"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {error && <p className="alert">{error}</p>}
      {!data && !error && <p className="state">Đang tải...</p>}
      {data && data.products.length === 0 && <p className="state">Không tìm thấy sản phẩm phù hợp.</p>}
      {data && (
        <div className="grid">
          {data.products.map((p) => <ProductCard key={p._id} product={p} />)}
        </div>
      )}
      {data && <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />}
    </>
  );
}
