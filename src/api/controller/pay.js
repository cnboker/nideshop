/* eslint-disable no-multi-spaces */
const Base = require('./base.js');

module.exports = class extends Base {
  /**
   * 获取支付的请求参数
   * @returns {Promise<PreventPromise|void|Promise>}
   */
  async prepayAction() {
    const orderId = this.get('orderId');

    const payment = await this
      .model('payment')
      .where({order_sn: orderId})
      .find();
    if (think.isEmpty(payment)) {
      return this.fail(400, '订单已取消');
    }
    if (parseInt(payment.pay_status) !== 0) {
      return this.fail(400, '订单已支付，请不要重复操作');
    }
    const openid = await this
      .model('user')
      .where({id: payment.user_id})
      .getField('weixin_openid', true);
    if (think.isEmpty(openid)) {
      return this.fail('微信支付失败 openid empty');
    }
    const WeixinSerivce = this.service('weixin', 'api');
    try {
      const returnParams = await WeixinSerivce.createUnifiedOrder({
        openid: openid,
        body: '订单编号：' + orderId,
        out_trade_no: orderId,
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
    // eslint-disable-next-line camelcase
    const pay_status = this.get('status') === 'pending'
      ? 0
      : 1;
    const orderList = await this
      .model('payment')
      .where({
        user_id: this.getLoginUserId(),
        pay_status
      })
      .page(1, 10)
      .countSelect();
    return this.success(orderList);
  }

  // 微信需要配置该参数
  async notifyAction() {
    const WeixinSerivce = this.service('weixin', 'api');
    let result = WeixinSerivce.payNotify(this.post('xml'));
    if (!result) {
      return `<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[支付失败]]></return_msg></xml>`;
    }
    // eslint-disable-next-line camelcase
    const order_sn = result.out_trade_no;
    // 付款成功，更新相关表状态
    result = this.paySuccess(order_sn);
    if (!result.code) {
      return `<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[支付失败]]></return_msg></xml>`;
    }
    return `<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>`;
  }

  async testAction() {
    // eslint-disable-next-line camelcase
    const order_sn = this.get('orderId');
    const result = await this.paySuccess(order_sn);
    if (!result.code) {
      return this.fail(result.message);
    }
    return this.success('ok');
  }

  // 取消付款
  async cancelAction() {
    // eslint-disable-next-line camelcase
    const order_sn = this.post('order_sn');
    const payment = await this
      .model('payment')
      .where({
        user_id: this.getLoginUserId(),
        order_sn
      })
      .find();
    if (!payment) {
      return this.fail('付款账单未找到');
    }
    await this
      .model('payment')
      .where({order_sn})
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
      return this.success('ok');
    }
  }

  // return {code:0:failure, 1:success, message:''} eslint-disable-next-line
  // camelcase eslint-disable-next-line camelcase eslint-disable-next-line
  // camelcase eslint-disable-next-line camelcase eslint-disable-next-line
  // camelcase
  // eslint-disable-next-line camelcase
  async paySuccess(order_sn) {
    const payment = await this
      .model('payment')
      .where({order_sn})
      .find();
    if (payment.pay_status) {
      return {code: 0, message: '已付款，不能重复付款'};
    }
    if (think.isEmpty(payment)) {
      return {code: 0, message: `<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[订单不存在]]></return_msg></xml>`};
    }
    let mycard = await this
      .model('mycard')
      .where({order_sn})
      .find();
    if (!think.isEmpty(mycard)) {
      return {code: 0, message: '卡已存在，操作异常'};
    }
    const card = await this
      .model('usercard')
      .where({id: payment.card_id})
      .find();
    // eslint-disable-next-line no-const-assign
    mycard = {
      order_sn,
      name: card.name,
      reamrk: card.remark,
      price: card.price,
      duration: card.duration,
      discount_price: card.discount_price,
      user_id: this.getLoginUserId(),
      card_id: card.id,
      total: card.discount_price,
      date: this.getTime(),
      isValid: 1, // 付款成功后需要更新未true
      useTimes: card.useTimes,
      leftTimes: card.useTimes,
      activateDate: this.getTime(),
      expiredDate: this.addHour(card.duration * 24)
    };

    // camelcase eslint-disable-next-line camelcase
    // eslint-disable-next-line camelcase
    const mycard_id = await this
      .model('mycard')
      .add(mycard);

    // 更新订单状态
    await this
      .model('order')
      .where({order_sn})
      .limit(1)
      .update({pay_status: 1, mycard_id, order_status: 201});

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
        order_sn,
        title: '会员卡费用',
        total: payment.cardPrice,
        date: this.getTime(),
        feeType: 0
      });
    if (payment.deposit > 0) {
      await this
        .model('invoice')
        .add({
          user_id: payment.user_id,
          order_sn,
          title: '押金',
          total: payment.deposit,
          date: this.getTime(),
          feeType: 1
        });
    }
    return {code: 1};
  }
};
