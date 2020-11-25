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
    const list = await this
      .model('usercard')
      .order(['orderNumber ASC'])
      .select();
    for (const item of list) {
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
