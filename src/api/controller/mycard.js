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
    return this.success(list);
  }

  /**
   * 获取收货地址的详情
   * @return {Promise} []
   */
  async detailAction() {
    const id = this.get('id');

    const info = await this
      .model('mycard')
      .where({
        user_id: this.getLoginUserId(),
        id
      })
      .find();

    return this.success(info);
  }

  /**
   * 添加或更新收货地址
   * @returns {Promise.<Promise|PreventPromise|void>}
   */
  async saveAction() {

  }

  /**
   * 删除指定的收货地址
   * @returns {Promise.<Promise|PreventPromise|void>}
   */
  async deleteAction() {
    // const addressId = this.post('id'); await this.model('address').where({id:
    // addressId, user_id: this.getLoginUserId()}).delete();

    return this.success('删除成功');
  }
};
