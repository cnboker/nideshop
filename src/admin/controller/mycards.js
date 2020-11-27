const Base = require('./base.js');

module.exports = class extends Base {
  async indexAction() {
    const {page, size, sqlToken, sort} = this.queryParams();
    const model = this.model('mycard')
      .field(['nideshop_mycard.*', 'nideshop_user.nickname', 'nideshop_user.mobile'])
      .join('nideshop_user on nideshop_user.id=nideshop_mycard.user_id');
    const whereSQL = sqlToken
      .replace('q', 'nickname|mobile') // like '%nickname%' or like '%mobile%'
      .toTime('date')
      .toWhereSQL();
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
    const model = this.model('mycard');
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

    const model = this.model('mycard');
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
      .model('mycard')
      .where({id: id})
      .limit(1)
      .delete();
    return this.simpleRest();
  }
};
