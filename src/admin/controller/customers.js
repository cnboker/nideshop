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
    const page = this.get('page') || 1;
    const size = this.get('size') || 10;
    const name = this.get('name') || '';

    const model = this.model('user');
    const result = await model
      .where({
        username: ['like', `%${name}%`]
      })
      .order(['id DESC'])
      .page(page, size)
      .countSelect();
    return this.simplePageRest(result);
  }

  async getAction() {
    const id = this.get('id');
    if (!id) {
      return this.indexAction();
    }
    const model = this.model('user');
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

    const model = this.model('user');
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
    return this.success(values);
  }

  async deleteAction() {
    const id = this.post('id');
    await this
      .model('user')
      .where({id: id})
      .limit(1)
      .delete();
    // TODO 删除图片

    return this.success();
  }
};
