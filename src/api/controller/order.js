const Base = require('./orderBase.js');
const moment = require('moment');
const {getOrderStatusText} = require('../../common/util');

module.exports = class extends Base {
  /**
   * 获取书单列表
   * @return {Promise} []
   */
  async listAction() {
    const orderList = await this
      .model('order')
      .where({
        user_id: this.getLoginUserId()
      })
      .page(1, 10)
      .countSelect();
    const newOrderList = [];
    for (const item of orderList.data) {
      // 订单的商品
      item.goodsList = await this
        .model('order_goods')
        .where({order_id: item.id})
        .select();
      item.goodsCount = 0;
      item
        .goodsList
        .forEach(v => {
          item.goodsCount += v.number;
        });

      // 订单状态的处理
      item.order_status_text = getOrderStatusText(item.order_status);

      // 可操作的选项
      item.handleOption = await this
        .model('order')
        .getOrderHandleOption(item.id);

      newOrderList.push(item);
    }
    orderList.data = newOrderList;

    return this.success(orderList);
  }

  async returnListAction() {
    const orderList = await this
      .model('order')
      .where({
        user_id: this.getLoginUserId(),
        order_status: ['>=', 301] // 用户已收货
      })
      .page(1, 10)
      .countSelect();
    const newOrderList = [];
    for (const item of orderList.data) {
      // 订单的商品
      item.goodsList = await this
        .model('order_goods')
        .where({order_id: item.id})
        .select();
      item.goodsCount = 0;
      item
        .goodsList
        .forEach(v => {
          item.goodsCount += v.number;
        });

      // 订单状态的处理
      item.order_status_text = getOrderStatusText(item.order_status);

      // 可操作的选项
      item.handleOption = await this
        .model('order')
        .getOrderHandleOption(item.id);

      newOrderList.push(item);
    }
    orderList.data = newOrderList;

    return this.success(orderList);
  }
  // 获取书单详情
  async detailAction() {
    const orderId = this.get('orderId');
    const orderInfo = await this
      .model('order')
      .where({
        user_id: this.getLoginUserId(),
        id: orderId
      })
      .find();

    if (think.isEmpty(orderInfo)) {
      return this.fail('订单不存在');
    }

    //   .getField('name', true);
    orderInfo.full_region = await this.getAddress(orderInfo.province, orderInfo.city, orderInfo.district);

    const latestExpressInfo = await this
      .model('order_express')
      .getLatestOrderExpress(orderId);
    orderInfo.express = latestExpressInfo;

    const orderGoods = await this
      .model('order_goods')
      .where({order_id: orderId})
      .select();

    // 订单状态的处理
    orderInfo.order_status_text = getOrderStatusText(orderId);
    orderInfo.add_time = moment
      .unix(orderInfo.add_time)
      .format('YYYY-MM-DD HH:mm:ss');
    orderInfo.final_pay_time = moment('001234', 'Hmmss').format('mm:ss');
    // 订单最后支付时间
    if (orderInfo.order_status === 0) {
      // if (moment().subtract(60, 'minutes') < moment(orderInfo.add_time)) {
      orderInfo.final_pay_time = moment('001234', 'Hmmss').format('mm:ss');
      // } else {     //超过时间不支付，更新订单状态为取消 }
    }

    // 订单可操作的选择,删除，支付，收货，评论，退换货
    const handleOption = await this
      .model('order')
      .getOrderHandleOption(orderId);

    return this.success({orderInfo: orderInfo, orderGoods: orderGoods, handleOption: handleOption});
  }

  // 检查用户会员卡可用
  async checkUserCard(cardId) {
    const mycard = await this
      .model('mycard')
      .where({id: cardId})
      .find();
    if (!mycard) {
      this.fail('卡不存在!');
    }
    if (!mycard.isValid) {
      this.fail('卡无效');
    }
    return mycard;
  }

  /**
   * 提交订单
   * @returns {Promise.<void>}
   */
  async submitAction() {
    // 获取收货地址信息和计算运费
    const addressId = this.post('addressId');
    const checkedAddress = await this
      .model('address')
      .where({id: addressId})
      .find();
    if (think.isEmpty(checkedAddress)) {
      return this.fail('请选择收货地址');
    }
    const freightPrice = 0.00;

    // 获取要购买的商品
    const checkedGoodsList = await this
      .model('cart')
      .where({
        user_id: this.getLoginUserId(),
        session_id: 1,
        checked: 1
      })
      .select();
    if (think.isEmpty(checkedGoodsList)) {
      return this.fail('请选择商品');
    }

    // 校验订单
    const orderCount = await this
      .model('order')
      .where(`order_status in (0, 201, 300, 301)`) // 包含未处理订单，已付款订单，已发货，已收货订单不能二次下单
      .count();
    if (orderCount > 0) {
      return this.fail('请还书后在借阅');
    }
    // 统计商品总价 let goodsTotalPrice = 0.00; for (const cartItem of checkedGoodsList) {
    //   goodsTotalPrice += cartItem.number * cartItem.retail_price; }

    const cardId = this.post('cardId');
    // const goodsTotalPrice = 0.00;
    const card = await this
      .model('userCard')
      .where({id: cardId})
      .find();
    if (!card) {
      this.fail('请选择会员卡');
    }

    // 获取订单使用的优惠券
    const couponId = this.post('couponId');
    // const couponPrice = 0.00;
    if (!think.isEmpty(couponId)) {}

    // 订单价格计算 const orderTotalPrice = goodsTotalPrice + freightPrice - couponPrice;
    // // 订单的总价 const actualPrice = orderTotalPrice - 0.00; // 减去其它支付的金额后，要实际支付的金额
    const currentTime = parseInt(Date.now() / 1000);
    // eslint-disable-next-line camelcase
    const order_sn = this.generateOrderNumber();
    let deposit = +think.config('deposit'); // 押金
    // actualPrice += diposit; 新卡 eslint-disable-next-line camelcase
    // eslint-disable-next-line camelcase
    let pay_status = 1;
    const mycard = await this.getMycard();
    // 支付成功后再生成mycard对象
    if (!mycard) {
      // eslint-disable-next-line camelcase
      pay_status = 0;
      const historyDeposit = await this
        .model('invoice')
        .where({
          feeType: 1,
          user_id: this.getLoginUserId()
        })
        .sum('total');
      if (historyDeposit > 0) {
        deposit = 0;
      }
      // 增加payment
      const payment = {
        order_sn,
        card_id: card.id,
        user_id: this.getLoginUserId(),
        title: `${card.name}及押金费用`,
        paymethod: 0,
        cardPrice: card.discount_price,
        deposit,
        date: this.getTime(),
        overdueDate: this.addHour(1),
        pay_status: pay_status,
        freight_price: freightPrice
      };
      await this
        .model('payment')
        .add(payment);
    }

    const orderInfo = {
      order_sn,
      mycard_id: mycard
        ? mycard.id
        : 0,
      user_id: this.getLoginUserId(),
      // 收货地址和运费
      consignee: checkedAddress.name,
      mobile: checkedAddress.mobile,
      province: checkedAddress.province_id,
      city: checkedAddress.city_id,
      district: checkedAddress.district_id,
      address: checkedAddress.address,
      freight_price: 0.00,

      // 留言
      postscript: this.post('postscript'),

      // 使用的优惠券
      coupon_id: 0,
      coupon_price: 0,
      pay_status,
      add_time: currentTime,
      goods_price: 0,
      order_price: 0,
      actual_price: 0,
      order_status: mycard
        ? 201
        : 0
    };

    // 开启事务，插入订单信息和订单商品
    const orderId = await this
      .model('order')
      .add(orderInfo);
    orderInfo.id = orderId;
    if (!orderId) {
      return this.fail('订单提交失败');
    }

    // 统计商品总价
    const orderGoodsData = [];
    for (const goodsItem of checkedGoodsList) {
      orderGoodsData.push({
        order_sn,
        order_id: orderId,
        goods_id: goodsItem.goods_id,
        goods_sn: goodsItem.goods_sn,
        product_id: goodsItem.product_id,
        goods_name: goodsItem.goods_name,
        list_pic_url: goodsItem.list_pic_url,
        market_price: goodsItem.market_price,
        retail_price: goodsItem.retail_price,
        number: goodsItem.number,
        goods_specifition_name_value: goodsItem.goods_specifition_name_value || 0,
        goods_specifition_ids: goodsItem.goods_specifition_ids || ''
      });
    }

    await this
      .model('order_goods')
      .addMany(orderGoodsData);
    await this
      .model('cart')
      .clearBuyGoods(this.getLoginUserId());

    return this.success({orderInfo: orderInfo});
  }

  /**
   * 查询物流信息
   * @returns {Promise.<void>}
   */
  async expressAction() {
    const orderId = this.get('orderId');
    if (think.isEmpty(orderId)) {
      return this.fail('订单不存在');
    }
    const latestExpressInfo = await this
      .model('order_express')
      .getLatestOrderExpress(orderId);
    return this.success(latestExpressInfo);
  }
};
