import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api';

// Context lưu thông tin đăng nhập cho toàn bộ ứng dụng
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('token')));

  // Mở lại trang: nếu còn token thì hỏi server xem là ai
  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    api
      .get('/auth/me')
      .then((data) => setUser(data.user))
      .catch((err) => {
        if (err.status === 401) localStorage.removeItem('token');
      })
      .finally(() => setLoading(false));
  }, []);

  function saveSession({ token, user }) {
    localStorage.setItem('token', token);
    setUser(user);
  }

  const login = async (email, password) => saveSession(await api.post('/auth/login', { email, password }));
  const register = async (name, email, password) => saveSession(await api.post('/auth/register', { name, email, password }));

  function logout() {
    localStorage.removeItem('token');
    setUser(null);
  }

  // Cập nhật danh sách "đã lưu" ngay trên giao diện sau khi bấm lưu
  function setSaved(recipeId, saved) {
    setUser((u) => {
      if (!u) return u;
      const others = u.savedRecipes.filter((id) => id !== recipeId);
      return { ...u, savedRecipes: saved ? [...others, recipeId] : others };
    });
  }

  return <AuthContext.Provider value={{ user, loading, login, register, logout, setSaved, updateUser: setUser }}>{children}</AuthContext.Provider>;
}
