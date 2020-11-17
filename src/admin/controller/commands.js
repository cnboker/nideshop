const Base = require('./base.js');

// order
module.exports = class extends Base {
  rewriteParams(key, value) {
    if (key === 'status') {
      let v = 0;
      if (value === 'ordered') v = 0;
      if (value === 'delivered') v = 1;
      if (value === 'cancelled') v = 2;
      return {status: v};
    }
    if (key === 'date') {
      return {'add_time': value};
    }
  }
  /**
   * index action
   * @return {Promise} []
   */
  async indexAction() {
    const {page, size, sort, filter} = this.queryParams();

    const model = this.model('command');
    const data = await model
      .where(filter)
      .order(sort)
      .page(page, size)
      .countSelect();
    const newList = [];
    for (const item of data.data) {
      item.order_status_text = await this
        .model('order')
        .getOrderStatusText(item.id);
      newList.push(item);
    }
    data.data = newList;
    return this.simplePageRest(data);
  }

  async getAction() {
    const id = this.get('id');
    if (!id) {
      return this.indexAction();
    }
    const model = this.model('command');
    const data = await model
      .where({id: id})
      .find();

    return this.simpleRest(data);
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
