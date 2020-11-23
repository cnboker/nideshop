/* eslint-disable no-multi-spaces */
const Base = require('./base.js');

module.exports = class extends Base {
  /**
   * 获取支付的请求参数
   * @returns {Promise<PreventPromise|void|Promise>}
   */
  async prepayAction() {
    const orderId = this.get('orderId');

    const orderInfo = await this
      .model('mycard')
      .where({order_sn: orderId})
      .find();
    if (think.isEmpty(orderInfo)) {
      return this.fail(400, '订单已取消');
    }
    if (parseInt(orderInfo.is_pay) !== 0) {
      return this.fail(400, '订单已支付，请不要重复操作');
    }
    const openid = await this
      .model('user')
      .where({id: orderInfo.user_id})
      .getField('weixin_openid', true);
    if (think.isEmpty(openid)) {
      return this.fail('微信支付失败 openid empty');
    }
    const WeixinSerivce = this.service('weixin', 'api');
    try {
      const returnParams = await WeixinSerivce.createUnifiedOrder({
        openid: openid,
        body: '订单编号：' + orderInfo.order_sn,
        out_trade_no: orderInfo.order_sn,
        // total_fee: parseInt(orderInfo.actual_price * 100),
        total_fee: 1,
        spbill_create_ip: ''
      });
      return this.success(returnParams);
    } catch (err) {
      return this.fail(400, `微信支付失败 ${err.err_code_des || err.return_msg}`);
    }
  }

  // 获取卡订单列表
  async listAction() {
    const orderList = await this
      .model('payment')
      .where({
        user_id: this.getLoginUserId()
      })
      .page(1, 10)
      .countSelect();
    return this.success(orderList);
  }
  // 微信需要配置该参数
  async notifyAction() {
    const WeixinSerivce = this.service('weixin', 'api');
    const result = WeixinSerivce.payNotify(this.post('xml'));
    if (!result) {
      return `<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[支付失败]]></return_msg></xml>`;
    }
    // eslint-disable-next-line camelcase
    const order_sn = result.out_trade_no;
    // 付款成功，更新相关表状态
    this.payAfter(order_sn);
    return `<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>`;
  }

  async testAction() {
    // eslint-disable-next-line camelcase
    const order_sn = this.get('orderId');
    this.payAfter(order_sn);
    return this.success('ok');
  }

  // 超时订单自动删除
  async overdueAction() {
    const payments = await this
      .model('payment')
      .where(`user_id = ${this.getLoginUserId()} and overdueDate < ${this.getTime()}`)
      .select();
    for (const payment of payments) {
      // eslint-disable-next-line camelcase
      const order_sn = payment.order_sn;
      await this
        .model('payment')
        .where({id: payment.id})
        .limit(1)
        .delete();
      await this
        .model('order')
        .where({order_sn})
        .limit(1)
        .delete();
      await this
        .model('order_goods')
        .where({order_sn})
        .delete();
      await this
        .model('mycard')
        .where({order_sn})
        .limit(1)
        .delete();
    }
  }

  // eslint-disable-next-line camelcase
  async payAfter(order_sn) {
    const payment = await this
      .model('payment')
      .where({order_sn})
      .find();

    if (think.isEmpty(payment)) {
      return `<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[订单不存在]]></return_msg></xml>`;
    }

    // 更新订单状态
    await this
      .model('order')
      .where({order_sn})
      .limit(1)
      .update({pay_status: 1});
    // 更新mycard
    const mycard = await this
      .model('mycard')
      .where({order_sn})
      .find();
    mycard.isValid = 1;
    mycard.activeDate = this.getTime();
    mycard.expiredDate = this.addHour(mycard.duration * 24);
    if (mycard.useTimes > 0) {
      mycard.leftTimes -= 1;
      // 卡次为0作废
      if (mycard.leftTimes === 0) {
        mycard.isValid = false;
        mycard.remark = '次卡用完';
      }
    }
    await this
      .model('mycard')
      .update(mycard);
    // 更新payment
    await this
      .model('payment')
      .where({order_sn})
      .limit(1)
      .update({
        pay_time: this.getTime(),
        pay_status: 1
      });
    // 生成invoice
    await this
      .model('invoice')
      .add({
        user_id: payment.user_id,
        title: '会员卡费用',
        total: payment.cardPrice,
        date: this.getTime()
      });
    await this
      .model('invoice')
      .add({
        user_id: payment.user_id,
        title: '押金',
        total: payment.deposit,
        date: this.getTime()
      });
  }
};
