// Quy tắc cửa hàng: danh sách tỉnh thành, điểm nhận hàng, tính phí ship.
// Tất cả nằm ở server để giá và phí luôn do server quyết định, không tin dữ liệu từ trình duyệt.

// 34 tỉnh, thành phố sau đợt sáp nhập năm 2025.
// Dữ liệu hành chính có thể thay đổi: hãy đối chiếu lại với quy định hiện hành trước khi nộp bài.
const PROVINCES = [
  'Hà Nội', 'TP. Hồ Chí Minh', 'Hải Phòng', 'Đà Nẵng', 'Cần Thơ', 'TP. Huế',
  'Lai Châu', 'Điện Biên', 'Sơn La', 'Lạng Sơn', 'Quảng Ninh', 'Thanh Hóa', 'Nghệ An', 'Hà Tĩnh',
  'Cao Bằng', 'Tuyên Quang', 'Lào Cai', 'Thái Nguyên', 'Phú Thọ', 'Bắc Ninh', 'Hưng Yên', 'Ninh Bình',
  'Quảng Trị', 'Quảng Ngãi', 'Gia Lai', 'Khánh Hòa', 'Lâm Đồng', 'Đắk Lắk',
  'Đồng Nai', 'Tây Ninh', 'Vĩnh Long', 'Đồng Tháp', 'Cà Mau', 'An Giang',
];

// Điểm nhận hàng mẫu (địa chỉ giả cho bản demo)
const PICKUP_POINTS = [
  { id: 'hcm-1', name: 'Góc Bếp - Điểm nhận Quận 1', province: 'TP. Hồ Chí Minh', address: '12 Đường Mẫu, Quận 1' },
  { id: 'hn-1', name: 'Góc Bếp - Điểm nhận Cầu Giấy', province: 'Hà Nội', address: '34 Đường Mẫu, Cầu Giấy' },
  { id: 'dn-1', name: 'Góc Bếp - Điểm nhận Hải Châu', province: 'Đà Nẵng', address: '56 Đường Mẫu, Hải Châu' },
];

// Phí ship: thành phố lớn rẻ hơn; đơn từ mức miễn phí thì miễn phí; nhận tại điểm thì 0đ
const FEE_BIG_CITY = 20000;
const FEE_OTHER = 35000;
const FREE_SHIP_FROM = 300000;
const BIG_CITIES = ['Hà Nội', 'TP. Hồ Chí Minh', 'Hải Phòng', 'Đà Nẵng', 'Cần Thơ'];

function shippingFee({ subtotal, deliveryMethod, province }) {
  if (deliveryMethod === 'pickup') return 0;
  if (subtotal >= FREE_SHIP_FROM) return 0;
  return BIG_CITIES.includes(province) ? FEE_BIG_CITY : FEE_OTHER;
}

// Thông tin nhận chuyển khoản hiển thị ở trang thanh toán QR (sửa lại cho đúng tài khoản của bạn)
const BANK = { name: 'Ngân hàng Góc Bếp', account: '0123456789', owner: 'CONG TY GOC BEP' };

const config = () => ({
  bank: BANK,
  provinces: PROVINCES,
  pickupPoints: PICKUP_POINTS,
  freeShipFrom: FREE_SHIP_FROM,
  feeBigCity: FEE_BIG_CITY,
  feeOther: FEE_OTHER,
});

module.exports = { PROVINCES, PICKUP_POINTS, shippingFee, config, FREE_SHIP_FROM };
