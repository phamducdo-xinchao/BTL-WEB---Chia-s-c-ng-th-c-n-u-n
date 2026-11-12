// Nhãn màu cho trạng thái đơn hoặc trạng thái thanh toán. map lấy từ constants.js
export default function StatusBadge({ map, value }) {
  const s = map[value] || { label: value, tone: 'info' };
  return <span className={`status-badge ${s.tone}`}>{s.label}</span>;
}
