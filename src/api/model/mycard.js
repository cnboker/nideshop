module.exports = class extends think.Model {
  /**
   * 根据订单编号查找订单信息
   * @param order_sn
   * @returns {Promise.<Promise|Promise<any>|T|*>}
   */
  // eslint-disable-next-line camelcase
  async getMycardByOrderSn(order_sn) {
    if (think.isEmpty(order_sn)) {
      return {};
    }
    return this
      .where({order_sn})
      .find();
  }
};
