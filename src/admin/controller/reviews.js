const Base = require('./base.js');

module.exports = class extends Base {
  /**
   * index action
   * @return {Promise} []
   * {
  pageSize: 10, //每页显示的条数, think-model@1.1.8 之前该字段为 pagesize
  currentPage: 1, //当前页
  count: 100, //总条数
  totalPages: 10, //总页数
  data: [{ //当前页下的数据列表
    name: "thinkjs",
    email: "admin@thinkjs.org"
  }, ...]
}
   */
  async indexAction() {
    const {page, size, filter, sort} = this.queryParams();
    // const productId = this.get('productId') || 0;
    const model = this.model('comment');
    // const result = await model.where({value_id: productId, type_id:
    // 0}).order(['id DESC']).page(page, size).countSelect();
    const result = await model
      .where(filter)
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
