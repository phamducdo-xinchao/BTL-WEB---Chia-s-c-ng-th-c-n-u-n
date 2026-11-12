import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Giỏ hàng lưu ở trình duyệt (localStorage) để tải lại trang không mất.
// Giá và tồn kho ở đây chỉ để hiển thị; khi đặt hàng, server tự tính lại từ CSDL.
const MAX_QTY = 99;

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [], // { id, name, price, unit, imageUrl, stock, qty }

      // Trả về 'ok' | 'max' (đã chạm giới hạn) | 'out' (hết hàng)
      add: (p, qty = 1) => {
        if (p.stock <= 0) return 'out';
        const limit = Math.min(p.stock, MAX_QTY);
        const cur = get().items.find((i) => i.id === p._id);
        const next = Math.min((cur?.qty || 0) + qty, limit);
        const hitMax = (cur?.qty || 0) + qty > limit;
        const item = { id: p._id, name: p.name, price: p.price, unit: p.unit, imageUrl: p.imageUrl, emoji: p.emoji, stock: p.stock, qty: next };
        set({ items: cur ? get().items.map((i) => (i.id === p._id ? item : i)) : [...get().items, item] });
        return hitMax ? 'max' : 'ok';
      },

      setQty: (id, qty) =>
        set({ items: get().items.map((i) => (i.id === id ? { ...i, qty: Math.max(1, Math.min(qty, i.stock, MAX_QTY)) } : i)) }),

      remove: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
      clear: () => set({ items: [] }),

      // Cập nhật giá, tồn kho theo dữ liệu mới nhất từ server; bỏ sản phẩm đã ngừng bán.
      // Trả về danh sách thông báo thay đổi để hiện cho người dùng.
      sync: (fresh) => {
        const byId = new Map(fresh.map((p) => [p._id, p]));
        const notes = [];
        const items = [];
        for (const i of get().items) {
          const p = byId.get(i.id);
          if (!p || p.stock <= 0) {
            notes.push(`"${i.name}" đã hết hàng hoặc ngừng bán nên được bỏ khỏi giỏ.`);
            continue;
          }
          if (p.price !== i.price) notes.push(`Giá "${i.name}" đã đổi thành ${p.price.toLocaleString('vi-VN')}đ.`);
          const qty = Math.min(i.qty, p.stock, MAX_QTY);
          if (qty < i.qty) notes.push(`"${i.name}" chỉ còn ${p.stock}, đã giảm số lượng trong giỏ.`);
          items.push({ ...i, name: p.name, price: p.price, unit: p.unit, imageUrl: p.imageUrl, emoji: p.emoji, stock: p.stock, qty });
        }
        set({ items });
        return notes;
      },
    }),
    { name: 'cart' }
  )
);

export const selectCount = (s) => s.items.reduce((n, i) => n + i.qty, 0);
export const selectSubtotal = (s) => s.items.reduce((n, i) => n + i.price * i.qty, 0);
