import { create } from 'zustand';
import { api } from '../api';

let lastRequest = 0; // bỏ qua kết quả của request cũ nếu người dùng gõ tìm kiếm nhanh

// Zustand: lưu danh sách công thức + bộ lọc để quay lại trang chủ vẫn giữ nguyên
export const useRecipeStore = create((set, get) => ({
  recipes: [],
  page: 1,
  totalPages: 1,
  total: 0,
  loading: false,
  error: '',
  filters: { search: '', category: '', sort: 'newest' },

  // Đổi bộ lọc thì quay về trang 1
  setFilters: (patch) => {
    set((s) => ({ filters: { ...s.filters, ...patch } }));
    get().fetchRecipes(1);
  },

  fetchRecipes: async (page = 1) => {
    const id = ++lastRequest;
    set({ loading: true, error: '' });
    try {
      const { search, category, sort } = get().filters;
      const query = new URLSearchParams({ page, limit: 9, sort });
      if (search) query.set('search', search);
      if (category) query.set('category', category);
      const data = await api.get(`/recipes?${query}`);
      if (id !== lastRequest) return;
      set({ recipes: data.recipes, page: data.page, totalPages: data.totalPages, total: data.total, loading: false });
    } catch (err) {
      if (id === lastRequest) set({ error: err.message, loading: false });
    }
  },
}));
