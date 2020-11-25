const Base = require('./base.js');

module.exports = class extends Base {
  /**
   * index action
   * @return {Promise} []
   */
  async indexAction() {
    const {page, size, sqlToken, sort} = this.queryParams();
    const model = this.model('goods');
    const data = await model
      .where(sqlToken.replace('sell_volume', 'volume').toWhereSQL())
      .order(sort)
      .page(page, size)
      .countSelect();

    return this.simplePageRest(data);
  }

  async getAction() {
    const id = this.get('id');
    if (!id) {
      return this.indexAction();
    }
    const model = this.model('goods');
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
    const model = this.model('goods');
    values.is_on_sale = values.is_on_sale
      ? 1
      : 0;
    values.is_new = values.is_new
      ? 1
      : 0;
    values.is_hot = values.is_hot
      ? 1
      : 0;
    delete values.id;

    var url = values.primary_pic_url;
    var pos = url.lastIndexOf('/');
    values.list_pic_url = `${url.slice(0, pos)}/thumbnail${url.slice(pos)}`;

    await model.add(values);
    return this.simpleRest(values);
  }

  async putAction() {
    const id = this.get('id');
    const values = this.post();
    // eslint-disable-next-line no-console
    console.log('values', values);
    var url = values.primary_pic_url;
    var pos = url.lastIndexOf('/');
    values.list_pic_url = `${url.slice(0, pos)}/thumbnail${url.slice(pos)}`;
    const model = this.model('goods');
    if (id > 0) {
      await model
        .where({id: id})
        .update(values);
    }
    return this.simpleRest(values);
  }

  async deleteAction() {
    const id = this.get('id');
    await this
      .model('goods')
      .where({id: id})
      .limit(1)
      .delete();
    // TODO 删除图片

    return this.simpleRest({id});
  }
};
