const Base = require('./base.js');

module.exports = class extends Base {
  /**
   * 获取用户的收货地址
   * @return {Promise} []
   */
  async listAction() {
    const list = await this
      .model('usercard')
      .order(['orderNumber ASC'])
      .select();
    return this.success(list);
  }
};
