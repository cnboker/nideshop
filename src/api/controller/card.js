const Base = require('./base.js');

module.exports = class extends Base {
  /**
   * 获取用户的收货地址
   * @return {Promise} []
   */
  async listAction() {
    const catelog = [
      {
        id: 0,
        name: '次卡',
        items: []
      }, {
        id: 1,
        name: '不限次卡',
        items: []
      }
    ];
    // 检查当前用户是否有订单记录，如果有则不显示体验卡
    const hasOrders = await this
      .model('order')
      .where({
        user_id: this.getLoginUserId()
      })
      .count('id') > 0;
    const list = await this
      .model('usercard')
      .order(['orderNumber ASC'])
      .select();
    for (const item of list) {
      if (hasOrders && (item.orderNumber === 1 || item.name === '体验卡')) {
        continue;
      }
      if (item.useTimes > 0) {
        catelog[0]
          .items
          .push(item);
      } else {
        catelog[1]
          .items
          .push(item);
      }
    }
    return this.success(catelog);
  }
};
