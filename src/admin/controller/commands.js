const Base = require('./base.js');
const {getOrderStatusText} = require('../../common/util');

// const orderStatus = {
//   ordered: 201,
//   delivered: 300,
//   returning: 501
// };
// order
module.exports = class extends Base {
  /**
   * index action
   * @return {Promise} []
   */
  async indexAction() {
    const {page, size, sort, sqlToken} = this.queryParams();
    const whereSQL = sqlToken
      .replace('date', 'add_time')
      .replace('customer_id', 'user_id')
      .replace('q', 'mobile|order_sn')
      .replace('status', 'order_status')
      .rewrite('order_status', (smbal, value) => {
        if (value === 'delivered') {
          return ['in', [300, 301]];
        }
        if (value === 'returning') {
          return ['in', [501, 502]];
        }
        return [smbal, value];
      })
      .toWhereSQL();

    const model = this.model('order');
    const data = await model
      .where(whereSQL)
      .order(sort)
      .page(page, size)
      .countSelect();
    if (data.data.length === 0) {
      return this.simplePageRest(data);
    }
    const newList = [];
    const orderGoods = await this
      .model('order_goods')
      .field(['nideshop_order_goods.*', 'nideshop_goods.ISBN', 'nideshop_goods.author', 'nideshop_goods.publisher'])
      .join('nideshop_goods on nideshop_goods.id = nideshop_order_goods.goods_id')
      .field([
        'order_id',
        'ISBN',
        'author',
        'publisher',
        'goods_id as product_id',
        'goods_name as name',
        'number as quantity'
      ])
      .where({
        order_id: [
          'in',
          data
            .data
            .map(x => x.id)
        ]
      })
      .select();

    for (const item of data.data) {
      item.order_status_text = getOrderStatusText(item.order_status);
      // eslint-disable-next-line no-undef
      item.basket = orderGoods.filter(x => x.order_id === item.id);
      newList.push(item);
    }
    data.data = newList;
    return this.simplePageRest(data);
  }
  async getAction() {
    const id = this.get('id');
    if (!id) {
      return this.indexAction();
    } else {
      return this.getDetail(id);
    }
  }

  async getDetail(id) {
    const model = this.model('order');
    const data = await model
      .where({id: id})
      .find();
    data.basket = await this
      .model('order_goods')
      .field(['nideshop_order_goods.*', 'nideshop_goods.ISBN', 'nideshop_goods.author', 'nideshop_goods.publisher'])
      .join('nideshop_goods on nideshop_goods.id = nideshop_order_goods.goods_id')
      .field([
        'order_id',
        'ISBN',
        'author',
        'publisher',
        'goods_id as product_id',
        'goods_name as name',
        'number as quantity'
      ])
      .where({order_id: data.id})
      .select();
    data.order_status_text = getOrderStatusText(data.order_status);
    return this.simpleRest(data);
  }

  async putAction() {
    const id = this.get('id');
    const order = await this
      .model('order')
      .where({id: id})
      .find();
    if (!order) {
      return this.badRequest(`${id} 订单未发现`);
    }
    const values = this.post();
    if (values.order_status === 300) { // 已发货
      if (order.order_status === 300) {
        return this.badRequest('订单状态已更新，不能重复更新，操作失败');
      }
      values.shipping_time = this.getTime();
      const mycard = await this
        .model('mycard')
        .where({id: order.mycard_id})
        .find();
      if (mycard.useTimes > 0) {
        mycard.leftTimes -= 1; // 卡次为0作废
        if (mycard.leftTimes <= 0) {
          mycard.isValid = false;
          mycard.remark = '次卡用完';
        }
        await this
          .model('mycard')
          .update(mycard);
      }
    } else if (values.order_status === 301) { // 用户已收货
      if (order.order_status === 301) {
        return this.badRequest('订单状态已更新，不能重复更新，操作失败');
      }
      values.receiving_time = this.getTime();
      values.expired_time = this.addHour(30 * 24);
    } else if (values.order_status === 501) {
      if (order.order_status === 501) {
        return this.badRequest('订单状态已更新，不能重复更新，操作失败');
      }
      // 用户一键还书
      values.returning_time = this.getTime();
    } else if (values.order_status === 502) { // 已还书
      if (order.order_status === 502) {
        return this.badRequest('订单状态已更新，不能重复更新，操作失败');
      }
      values.return_time = this.getTime();
    } else {
      return this.badRequest('未处理的订单状态，操作失败');
    }
    await this
      .model('order')
      .where({id: id})
      .update(values);

    return this.getDetail(id);
  }

  async postAction() {
    if (!this.isPost) {
      return false;
    }

    const values = this.post();
    const id = this.post('id');

    const model = this.model('command');
    values.is_show = values.is_show
      ? 1
      : 0;
    values.is_new = values.is_new
      ? 1
      : 0;
    if (id > 0) {
      await model
        .where({id: id})
        .update(values);
    } else {
      delete values.id;
      await model.add(values);
    }
    return this.simpleRest(values);
  }

  async deleteAction() {
    const id = this.post('id');
    await this
      .model('command')
      .where({id: id})
      .limit(1)
      .delete();

    // 删除订单商品
    await this
      .model('order_goods')
      .where({order_id: id})
      .delete();

    // TODO 事务，验证订单是否可删除（只有失效的订单才可以删除）

    return this.simpleRest();
  }
};
