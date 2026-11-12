import { useState } from 'react';

// Hiển thị sao (chỉ xem) hoặc cho bấm chọn sao nếu có onChange
export default function StarRating({ value = 0, onChange }) {
  const [hover, setHover] = useState(0);
  const shown = hover || Math.round(value);
  return (
    <span className="stars" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) =>
        onChange ? (
          <button key={n} type="button" className={`star ${n <= shown ? 'on' : ''}`} aria-label={`${n} sao`} onMouseEnter={() => setHover(n)} onClick={() => onChange(n)}>★</button>
        ) : (
          <span key={n} className={`star ${n <= shown ? 'on' : ''}`} aria-hidden="true">★</span>
        )
      )}
    </span>
  );
}
