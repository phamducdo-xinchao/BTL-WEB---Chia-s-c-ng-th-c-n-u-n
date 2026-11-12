import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { formatVND } from '../constants.js';
import { useCartStore } from '../store/cartStore.js';
import { useToast } from '../context/UIContext.jsx';
import ProductCard from './ProductCard.jsx';

// "Nguyên liệu gợi ý" ở trang món ăn: các sản phẩm admin đã gắn với công thức này
export default function RecipeProducts({ recipeId }) {
  const [products, setProducts] = useState([]);
  const add = useCartStore((s) => s.add);
  const toast = useToast();

  useEffect(() => {
    setProducts([]);
    api.get(`/products?recipe=${recipeId}&limit=50`).then((d) => setProducts(d.products)).catch(() => setProducts([]));
  }, [recipeId]);

  if (products.length === 0) return null;
  const buyable = products.filter((p) => p.stock > 0);
  const total = buyable.reduce((n, p) => n + p.price, 0);

  function addAll() {
    buyable.forEach((p) => add(p));
    toast.success(`Đã thêm ${buyable.length} sản phẩm vào giỏ`);
  }

  return (
    <section className="shop-suggest">
      <div className="suggest-head">
        <h2>🛒 Nguyên liệu gợi ý <span className="count-pill">{products.length}</span></h2>
        <div className="suggest-actions">
          <button className="btn btn-herb btn-sm" onClick={addAll} disabled={buyable.length === 0}>
            Mua đủ nguyên liệu ({formatVND(total)})
          </button>
          <Link to="/cart" className="btn btn-ghost btn-sm">Xem giỏ hàng</Link>
        </div>
      </div>
      <p className="hint">Chọn nguyên liệu cho món này, giao tận nơi hoặc nhận tại điểm gần bạn.</p>
      <div className="grid suggest-grid">
        {products.map((p) => <ProductCard key={p._id} product={p} compact />)}
      </div>
    </section>
  );
}
