// Kiểm thử logic tự hủy đơn quá hạn bằng model giả (không cần MongoDB)
const { test } = require('node:test');
const assert = require('node:assert');

const orderPath = require.resolve('../src/models/Order');
const productPath = require.resolve('../src/models/Product');
const restocked = [];

const fakeOrder = {
  STATUSES: ['pending', 'shipping', 'done', 'cancelled'],
  find: () => ({ select: async () => [{ _id: 'a' }, { _id: 'b' }] }),
  // Đơn "a" chiếm được (vẫn còn chờ thanh toán); đơn "b" vừa được khách thanh toán nên không chiếm được
  findOneAndUpdate: async (filter) => (filter._id === 'a' ? { items: [{ product: 'p1', qty: 2 }, { product: 'p2', qty: 1 }] } : null),
};
require.cache[orderPath] = { id: orderPath, filename: orderPath, loaded: true, exports: fakeOrder };
require.cache[productPath] = {
  id: productPath, filename: productPath, loaded: true,
  exports: { updateOne: async (filter, update) => restocked.push([filter._id, update.$inc.stock]) },
};

const { expireUnpaidOrders } = require('../src/controllers/orderController');

test('Đơn online quá hạn: hủy và trả kho đúng một lần, bỏ qua đơn vừa được thanh toán', async () => {
  const count = await expireUnpaidOrders();
  assert.strictEqual(count, 1);
  assert.deepStrictEqual(restocked, [['p1', 2], ['p2', 1]]);
});
