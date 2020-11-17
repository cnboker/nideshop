const Base = require('./base.js');

module.exports = class extends Base {
  /**
   * index action
   * @return {Promise} []
   */
  async indexAction() {
    const {page, size, filter, sort} = this.queryParams();
    const model = this.model('user');
    const data = await model.where(filter).order(sort).page(page, size).countSelect();

    return this.simplePageRest(data);
  }

  async getAction() {
    const id = this.get('id');
    const model = this.model('user');
    const data = await model.where({id: id}).find();

    return this.simpleRest(data);
  }

  async postAction() {
    if (!this.isPost) {
      return false;
    }

    const values = this.post();
    const id = this.post('id');

    const model = this.model('user');
    values.is_show = values.is_show ? 1 : 0;
    values.is_new = values.is_new ? 1 : 0;
    if (id > 0) {
      await model.where({id: id}).update(values);
    } else {
      delete values.id;
      await model.add(values);
    }
    return this.success(values);
  }

  async deleteAction() {
    const id = this.post('id');
    await this.model('user').where({id: id}).limit(1).delete();
    // TODO 删除图片

    return this.success();
  }
};
