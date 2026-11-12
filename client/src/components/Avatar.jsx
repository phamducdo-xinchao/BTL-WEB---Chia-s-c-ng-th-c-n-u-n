// Hình tròn có chữ cái đầu của tên, màu nền chọn theo tên để mỗi người một màu
const COLORS = ['#1e9e5a', '#f0583a', '#e0a100', '#3b7ea1', '#8a63b5', '#c2185b'];

export default function Avatar({ name = '?', size = 34 }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  const color = COLORS[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % COLORS.length];
  return (
    <span className="avatar" style={{ width: size, height: size, background: color, fontSize: size * 0.45 }} aria-hidden="true">
      {initial}
    </span>
  );
}
