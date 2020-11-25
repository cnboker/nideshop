const Base = require('./base.js');

module.exports = class extends Base {
  /**
   * 获取用户的收货地址
   * @return {Promise} []
   */
  async listAction() {
    const list = await this
      .model('mycard')
      .where({
        user_id: this.getLoginUserId()
      })
      .select();
    for (const item of list) {
      item.date = this.toYYYYMMDDHHMM(item.date);
      item.activateDate = this.toYYYYMMDDHHMM(item.activateDate);
      item.expiredDate = this.toYYYYMMDDHHMM(item.expiredDate);
    }
    return this.success(list);
  }
};
