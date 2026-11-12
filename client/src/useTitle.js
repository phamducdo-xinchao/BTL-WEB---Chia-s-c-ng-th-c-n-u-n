import { useEffect } from 'react';

// Đổi tiêu đề tab trình duyệt theo từng trang
export default function useTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | Góc Bếp` : 'Góc Bếp - Chia sẻ công thức nấu ăn';
  }, [title]);
}
