// Chạy: npm run seed  (XÓA toàn bộ dữ liệu cũ rồi tạo dữ liệu mẫu)
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Recipe = require('./models/Recipe');
const Comment = require('./models/Comment');
const Collection = require('./models/Collection');
const Product = require('./models/Product');
const Order = require('./models/Order');
const { shippingFee } = require('./utils/shop');

// [tên, danh mục, phút, khẩu phần, mô tả, nguyên liệu, các bước]
const DATA = [
  ['Phở bò Hà Nội', 'Món chính', 180, 4, 'Nước dùng trong, thơm quế hồi, thịt bò mềm.',
    ['1kg xương ống bò', '500g thịt bắp bò', '500g bánh phở', '1 củ gừng nướng', '1 củ hành tây nướng', 'Quế, hồi, thảo quả'],
    ['Chần xương qua nước sôi rồi rửa sạch.', 'Ninh xương với gừng, hành, quế, hồi khoảng 3 tiếng.', 'Nêm nước mắm, muối, đường phèn cho vừa ăn.', 'Trụng bánh phở, xếp thịt bò thái mỏng, chan nước dùng nóng.']],
  ['Canh chua cá lóc', 'Canh & súp', 40, 4, 'Vị chua thanh của me, thơm mùi ngò ôm.',
    ['500g cá lóc', '2 quả cà chua', '100g dứa', '2 cây bạc hà', 'Giá đỗ, ngò ôm', '30g me chín'],
    ['Cá làm sạch, cắt khúc, ướp chút muối.', 'Nấu nước me, cho cà chua và dứa vào.', 'Thả cá vào nấu chín, thêm bạc hà và giá.', 'Nêm vừa ăn, rắc ngò ôm trước khi tắt bếp.']],
  ['Cơm tấm sườn nướng', 'Món chính', 60, 2, 'Sườn nướng thơm mật ong ăn cùng cơm tấm và nước mắm chua ngọt.',
    ['4 miếng sườn cốt lết', '2 chén cơm tấm', '2 muỗng mật ong', 'Sả, tỏi băm', 'Nước mắm, đường, chanh'],
    ['Ướp sườn với sả, tỏi, mật ong, nước mắm trong 30 phút.', 'Nướng sườn hai mặt đến khi vàng cạnh.', 'Pha nước mắm với đường, chanh, tỏi, ớt.', 'Dọn sườn với cơm, dưa leo, cà chua và chan nước mắm.']],
  ['Gỏi cuốn tôm thịt', 'Ăn vặt', 30, 4, 'Cuốn tươi mát, chấm tương đậu phộng.',
    ['12 con tôm', '200g thịt ba chỉ luộc', '12 tờ bánh tráng', 'Bún tươi, xà lách, rau thơm', 'Tương đậu phộng'],
    ['Luộc tôm và thịt, thái mỏng.', 'Nhúng bánh tráng qua nước cho mềm.', 'Xếp rau, bún, thịt, tôm rồi cuốn chặt tay.', 'Chấm cùng tương đậu phộng.']],
  ['Đậu hũ sốt cà chua', 'Món chay', 25, 3, 'Món chay đơn giản, đưa cơm.',
    ['4 miếng đậu hũ', '3 quả cà chua', 'Hành lá', 'Nước tương', 'Dầu ăn'],
    ['Chiên đậu hũ vàng hai mặt.', 'Xào cà chua với chút dầu cho ra nước sệt.', 'Cho đậu hũ vào, nêm nước tương, đun 5 phút.', 'Rắc hành lá rồi tắt bếp.']],
  ['Chè đậu xanh', 'Tráng miệng', 45, 4, 'Chè đậu xanh nấu nhuyễn, thơm lá dứa.',
    ['200g đậu xanh cà', '100g đường', 'Lá dứa', 'Nước cốt dừa'],
    ['Ngâm đậu xanh 30 phút, rửa sạch.', 'Nấu đậu với lá dứa đến khi nhừ.', 'Thêm đường, khuấy đều cho tan.', 'Múc ra chén, rưới nước cốt dừa.']],
  ['Trà đào cam sả', 'Đồ uống', 20, 4, 'Thức uống giải nhiệt cho ngày nóng.',
    ['2 túi trà đen', '2 quả đào ngâm', '2 quả cam', '3 cây sả', 'Đường, đá'],
    ['Pha trà với sả đập dập, để nguội.', 'Vắt cam, thêm đường cho tan.', 'Cho đào, trà và nước cam vào ly.', 'Thêm đá và thưởng thức.']],
  ['Bánh xèo miền Tây', 'Món chính', 50, 4, 'Vỏ giòn vàng, nhân tôm thịt giá đỗ.',
    ['200g bột bánh xèo', '200g tôm', '200g thịt ba chỉ', 'Giá đỗ, hành lá', 'Nước cốt dừa', 'Rau sống, nước mắm'],
    ['Pha bột với nước cốt dừa, nghệ, hành lá.', 'Xào sơ tôm và thịt.', 'Đổ bột vào chảo nóng, cho nhân và giá, đậy nắp.', 'Gập đôi khi vỏ vàng giòn, ăn kèm rau sống.']],
  ['Bún chả Hà Nội', 'Món chính', 60, 3, 'Chả nướng than thơm lừng, nước chấm chua ngọt.',
    ['300g thịt xay', '300g ba chỉ', 'Bún tươi', 'Đu đủ xanh, cà rốt', 'Nước mắm, đường, giấm', 'Hành khô, tỏi'],
    ['Ướp thịt với hành, tỏi, nước mắm, đường.', 'Nướng chả đến khi xém cạnh.', 'Pha nước chấm, thả đu đủ và cà rốt vào.', 'Ăn bún với chả, nước chấm và rau thơm.']],
  ['Rau muống xào tỏi', 'Món chay', 10, 2, 'Món rau nhanh gọn, xanh giòn.',
    ['300g rau muống', '4 tép tỏi', 'Dầu ăn', 'Muối, hạt nêm'],
    ['Nhặt và rửa sạch rau muống.', 'Phi thơm tỏi băm.', 'Cho rau vào xào lửa lớn khoảng 2 phút.', 'Nêm vừa ăn rồi dọn ra ngay.']],
];

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  await Promise.all([User.deleteMany(), Recipe.deleteMany(), Collection.deleteMany({}),
    Comment.deleteMany(), Product.deleteMany(), Order.deleteMany()]);

  const [admin, lan, minh, hoa] = await User.create([
    { name: 'Quản trị viên', email: 'admin@example.com', password: 'admin123', role: 'admin' },
    { name: 'Lan Anh', email: 'lan@example.com', password: '123456' },
    { name: 'Minh Quân', email: 'minh@example.com', password: '123456' },
    { name: 'Thu Hòa', email: 'hoa@example.com', password: '123456' },
  ]);

  const authors = [lan, minh, hoa];
  const recipes = await Recipe.create(
    DATA.map(([title, category, cookTime, servings, description, ingredients, steps], i) => ({
      title, category, cookTime, servings, description, ingredients, steps,
      author: authors[i % authors.length]._id,
    }))
  );

  // Thêm vài lượt thích để thử sắp xếp "phổ biến"
  const likers = [admin, lan, minh, hoa];
  for (const [i, r] of recipes.entries()) {
    r.likes = likers.slice(0, (i * 3) % 5).map((u) => u._id);
    r.likesCount = r.likes.length;
    // Đánh giá sao và lượt xem mẫu (người đánh giá không phải tác giả)
    r.ratings = likers.filter((u) => !u._id.equals(r.author)).slice(0, (i * 2) % 4 + 1).map((u, k) => ({ user: u._id, value: 3 + ((i + k) % 3) }));
    r.recalcRating();
    r.views = 20 + i * 13;
    await r.save();
  }
  await User.updateOne({ _id: lan._id }, { savedRecipes: [recipes[0]._id, recipes[3]._id] });

  await Comment.create([
    { recipe: recipes[0]._id, user: minh._id, content: 'Nước dùng rất thơm, nhà mình ai cũng khen!' },
    { recipe: recipes[0]._id, user: hoa._id, content: 'Mình thêm chút hành tây nướng, ngọt nước hơn.' },
    { recipe: recipes[1]._id, user: lan._id, content: 'Canh chua nấu nhanh mà ngon, cảm ơn bạn.' },
  ]);

  await Collection.create({ name: 'Món cho cuối tuần', description: 'Những món nấu thong thả, cả nhà cùng ăn.', owner: lan._id, recipes: [recipes[0]._id, recipes[2]._id, recipes[8]._id] });

  // Cửa hàng nguyên liệu (dữ liệu mẫu): [tên, giá (đ), đơn vị, tồn kho, mô tả, [vị trí các công thức trong DATA]]
  const SHOP = [
    ['Xương ống bò', 120000, 'kg', 30, 'Xương ống bò tươi, hầm lấy nước ngọt.', [0]],
    ['Thịt bắp bò', 260000, 'kg', 20, 'Bắp bò tươi, thái mỏng nhúng hoặc hầm.', [0]],
    ['Bánh phở tươi', 18000, 'gói 500g', 50, 'Bánh phở sợi mềm, dùng trong ngày.', [0]],
    ['Bộ gia vị phở (quế, hồi, thảo quả)', 25000, 'gói', 40, 'Gia vị khô đóng gói sẵn cho một nồi phở.', [0]],
    ['Cá lóc làm sạch', 110000, 'kg', 15, 'Cá lóc đã làm sạch, cắt khúc.', [1]],
    ['Me chín', 15000, 'gói 200g', 40, 'Me chín nấu canh chua.', [1]],
    ['Sườn cốt lết', 150000, 'kg', 25, 'Sườn cốt lết tươi, ướp nướng ngon.', [2]],
    ['Gạo tấm', 28000, 'kg', 60, 'Gạo tấm dẻo thơm.', [2]],
    ['Nước mắm cốt', 65000, 'chai 500ml', 35, 'Nước mắm truyền thống, độ đạm cao.', [1, 2, 3, 8]],
    ['Tôm sú tươi', 280000, 'kg', 12, 'Tôm sú tươi size vừa.', [3, 7]],
    ['Bánh tráng cuốn', 22000, 'gói 300g', 45, 'Bánh tráng mỏng dùng cuốn gỏi.', [3]],
    ['Đậu hũ non', 12000, 'hộp 3 miếng', 50, 'Đậu hũ non mềm mịn.', [4]],
    ['Đậu xanh cà', 40000, 'kg', 30, 'Đậu xanh cà vỏ, nấu chè nhanh nhừ.', [5]],
    ['Nước cốt dừa', 20000, 'hộp 400ml', 60, 'Nước cốt dừa béo thơm.', [5, 7]],
    ['Bột bánh xèo', 24000, 'gói 400g', 40, 'Bột pha sẵn, thêm nước cốt dừa là dùng được.', [7]],
    ['Thịt ba chỉ', 140000, 'kg', 25, 'Ba chỉ tươi rọi đều nạc mỡ.', [3, 7, 8]],
    ['Rau muống', 15000, 'bó', 20, 'Rau muống tươi hái trong ngày.', [9]],
    ['Trà đen', 35000, 'hộp 25 túi', 35, 'Trà đen túi lọc pha trà trái cây.', [6]],
  ];
  const EMOJI = ['🦴', '🥩', '🍜', '🌿', '🐟', '🍋', '🍖', '🍚', '🧴', '🦐', '🫓', '🧈', '🫘', '🥥', '🥞', '🥓', '🥬', '🍵'];
  await Product.create(SHOP.map(([name, price, unit, stock, description, idx], k) => ({ name, price, unit, stock, description, emoji: EMOJI[k], recipes: idx.map((i) => recipes[i]._id) })));
  const prods = await Product.find().sort({ createdAt: 1 });

  // Hai đơn mẫu để xem trang "Đơn hàng của tôi" và trang quản lý
  const line = (p, qty) => ({ product: p._id, name: p.name, unit: p.unit, price: p.price, qty });
  const pho = [line(prods[0], 2), line(prods[2], 2)];
  const phoSub = pho.reduce((n, i) => n + i.price * i.qty, 0);
  const phoFee = shippingFee({ subtotal: phoSub, deliveryMethod: 'delivery', province: 'TP. Hồ Chí Minh' });
  await Order.create([
    { code: 'GBDEMO001', user: lan._id, items: pho, subtotal: phoSub, shippingFee: phoFee, total: phoSub + phoFee, receiverName: 'Lan Anh', phone: '0901234567',
      deliveryMethod: 'delivery', province: 'TP. Hồ Chí Minh', address: '25 Đường Mẫu, Phường 1', paymentMethod: 'cod', status: 'pending' },
    { code: 'GBDEMO002', user: lan._id, items: [line(prods[12], 1), line(prods[13], 2)], subtotal: 80000, shippingFee: 0, total: 80000, receiverName: 'Lan Anh', phone: '0901234567',
      deliveryMethod: 'pickup', province: 'TP. Hồ Chí Minh', address: 'Góc Bếp - Điểm nhận Quận 1 (12 Đường Mẫu, Quận 1)', pickupPoint: 'hcm-1',
      paymentMethod: 'online', paymentStatus: 'paid', paidAt: new Date(), status: 'done' },
  ]);

  console.log('Đã tạo dữ liệu mẫu.');
  console.log('Admin : admin@example.com / admin123');
  console.log('User  : lan@example.com / 123456');
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
