
module.exports = class extends think.Model {
  async getOrderStats(userIds) {
    const tsql = `select user_id,
      count(id) as orderCount
    from nideshop_order
    where user_id in (
        ${userIds}
      )
    group by user_id;`;
    // eslint-disable-next-line no-return-await
    return this.query(tsql);
  }

  async getInvoiceStats(userIds) {
    const tsql = `select user_id, sum(total) as total from nideshop_invoice
  where user_id in (${userIds})
  group by user_id;`;
    // eslint-disable-next-line no-return-await
    return this.query(tsql);
  }

  // 最近1个月
  async getRecentlyInvoiceStats(userIds) {
    const tsql = `select user_id, sum(total) as total from nideshop_invoice
  where user_id in (${userIds}) 
  and date > UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 1 MONTH) )
  group by user_id;`;
    // eslint-disable-next-line no-return-await
    return this.query(tsql);
  }
};
