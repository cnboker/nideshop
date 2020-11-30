const Base = require('./base.js');

module.exports = class extends Base {
  async indexAction() {
    const {page, size, whereSQL, sort} = this.queryParams();
    // const productId = this.get('productId') || 0;
    const model = this.model('comment');
    // const result = await model.where({value_id: productId, type_id:
    // 0}).order(['id DESC']).page(page, size).countSelect();
    const result = await model
      .where(whereSQL)
      .order(sort)
      .page(page, size)
      .countSelect();
    return this.simplePageRest(result);
  }

  async getAction() {
    const id = this.get('id');
    if (!id) {
      return this.indexAction();
    }
    const model = this.model('comment');
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

    const model = this.model('comment');
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

  async destoryAction() {
    const id = this.post('id');
    await this
      .model('review')
      .where({id: id})
      .limit(1)
      .delete();
    // TODO 删除图片

    return this.simpleRest();
  }
};
