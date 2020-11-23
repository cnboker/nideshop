const Base = require('./base.js');
const _ = require('lodash');

module.exports = class extends Base {
  /**
   * 生成订单的编号order_sn
   * @returns {string}
   */
  generateOrderNumber() {
    const date = new Date();
    return date.getFullYear() + _.padStart(date.getMonth(), 2, '0') + _.padStart(date.getDay(), 2, '0') + _.padStart(date.getHours(), 2, '0') + _.padStart(date.getMinutes(), 2, '0') + _.padStart(date.getSeconds(), 2, '0') + _.random(100000, 999999);
  }

  async getMycard() {
    const mycards = await this
      .model('mycard')
      .where({
        user_id: this.getLoginUserId()
      })
      .select();
    var now = this.getTime();
    var availableCards = [];
    for (const mycard of mycards) {
      if (mycard.isValid) {
        if (mycard.activateDate && now > mycard.expiredDate) {
          mycard.isValid = false;
        } else if (mycard.useTimes > 0 && mycard.leftTimes <= 0) {
          // 次卡处理
          mycard.isValid = false;
        } else {
          availableCards.push(mycard);
        }
        if (!mycard.isValid) {
          await this
            .model('mycard')
            .where({id: mycard.id})
            .update(mycard);
        }
      }
    }
    return availableCards.length > 0
      ? availableCards[0]
      : null;
  }
};
