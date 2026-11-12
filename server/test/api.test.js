// Kiểm thử tự động bằng trình chạy test có sẵn của Node (node --test).
// Các ca dưới đây không cần MongoDB: kiểm tra xác thực, kiểm tra dữ liệu và mã lỗi.
const { test, before, after } = require('node:test');
const assert = require('node:assert');

process.env.JWT_SECRET = 'test-secret';
const app = require('../src/app');

let server;
let base;
before(() => new Promise((resolve) => {
  server = app.listen(0, () => {
    base = `http://127.0.0.1:${server.address().port}`;
    resolve();
  });
}));
after(() => server.close());

const call = (method, path, body) =>
  fetch(base + path, { method, headers: { 'Content-Type': 'application/json' }, body: body && method !== 'GET' ? JSON.stringify(body) : undefined });

test('GET /api/health trả 200', async () => {
  assert.strictEqual((await call('GET', '/api/health')).status, 200);
});

test('Đăng ký thiếu dữ liệu trả 400', async () => {
  const res = await call('POST', '/api/auth/register', { email: 'a@b.c' });
  assert.strictEqual(res.status, 400);
  assert.ok((await res.json()).message);
});

test('Đăng nhập thiếu mật khẩu trả 400', async () => {
  assert.strictEqual((await call('POST', '/api/auth/login', { email: 'a@b.c' })).status, 400);
});

test('Các API cần đăng nhập trả 401 khi không có token', async () => {
  const cases = [
    ['POST', '/api/recipes'],
    ['POST', '/api/recipes/123/like'],
    ['POST', '/api/recipes/123/rate'],
    ['PUT', '/api/comments/123'],
    ['GET', '/api/users/me/saved'],
    ['PUT', '/api/users/me/password'],
    ['GET', '/api/collections'],
    ['GET', '/api/admin/stats'],
    ['POST', '/api/admin/users'],
    ['POST', '/api/orders'],
    ['GET', '/api/orders'],
    ['GET', '/api/orders/admin/all'],
    ['PUT', '/api/orders/admin/123/status'],
    ['POST', '/api/orders/123/payment-result'],
    ['POST', '/api/products'],
    ['PUT', '/api/products/123'],
    ['DELETE', '/api/products/123'],
  ];
  for (const [method, path] of cases) {
    assert.strictEqual((await call(method, path, {})).status, 401, `${method} ${path}`);
  }
});

test('Token sai trả 401', async () => {
  const res = await fetch(base + '/api/collections', { headers: { Authorization: 'Bearer abc' } });
  assert.strictEqual(res.status, 401);
});

test('Đường dẫn không tồn tại trả 404 dạng JSON', async () => {
  const res = await call('GET', '/api/khong-co');
  assert.strictEqual(res.status, 404);
  assert.ok((await res.json()).message);
});

test('Phí ship tính ở server: nhận tại điểm 0đ, đơn lớn miễn phí, thành phố lớn rẻ hơn', async () => {
  const fee = async (q) => (await (await fetch(`${base}/api/products/shipping?${new URLSearchParams(q)}`)).json()).shippingFee;
  assert.strictEqual(await fee({ subtotal: 100000, deliveryMethod: 'pickup', province: 'Cà Mau' }), 0);
  assert.strictEqual(await fee({ subtotal: 400000, deliveryMethod: 'delivery', province: 'Cà Mau' }), 0);
  assert.strictEqual(await fee({ subtotal: 100000, deliveryMethod: 'delivery', province: 'Hà Nội' }), 20000);
  assert.strictEqual(await fee({ subtotal: 100000, deliveryMethod: 'delivery', province: 'Cà Mau' }), 35000);
});

test('Cấu hình cửa hàng có đủ 34 tỉnh thành', async () => {
  const cfg = await (await call('GET', '/api/products/config')).json();
  assert.strictEqual(cfg.provinces.length, 34);
});

test('Chữ ký phiên thanh toán: đúng thì qua, sửa số tiền hoặc hết hạn thì bị từ chối', () => {
  const { createSession, verifySession } = require('../src/utils/payment');
  const order = { _id: 'abc123', total: 100000 };
  const { token } = createSession(order);
  assert.ok(verifySession(token, order));
  assert.ok(!verifySession(token, { ...order, total: 1000 }));
  assert.ok(!verifySession(token.replace('.100000.', '.1000.'), order));
  assert.ok(!verifySession(token, { ...order, _id: 'other' }));
  assert.ok(!verifySession('rác', order));
});
