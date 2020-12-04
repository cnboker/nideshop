module.exports = [
  // route /admin/product/1 to /admin/product?id=1
  // how to route /admin/product to /admin/product/index
  ['/admin/auth/login', '/admin/auth/login'],
  [/\/admin\/(\w+)(?:\/(\d+))?/, 'admin/:1?id=:2', 'rest']
];
