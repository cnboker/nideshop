const Base = require('./base.js');
// var moment = require('moment');
module.exports = class extends Base {
  async indexAction() {
    const {page, size, sqlToken, sort} = this.queryParams();
    if (!think.isEmpty(sqlToken.has_ordered)) {
      return this.newCustomersList(page, size);
    }
    // eslint-disable-next-line camelcase const {groups, nb_commands, last_seen, q}
    // = filter;
    const modelQuery = this.model('user');
    const whereSQL = sqlToken
      .replace('nb_commands', '')
      .replace('q', 'nickname')
      .replace('last_seen', 'last_login_time')
      .toTime('last_login_time')
      .toWhereSQL();
    const result = await modelQuery
      .where(whereSQL)
      .order(sort)
      .page(page, size)
      .countSelect();
    result.data = result
      .data
      .map(x => {
        return this.outConvert(x);
      });
    return this.simplePageRest(result);
  }

  outConvert(item) {
    item.groups = (item
      .groups || '')
      .split(',');
    item.birthday = item.birthday * 1000;
    return item;
  }

  async newCustomersList(page, size) {
    const data = await this
      .model('user')
      .field(['nideshop_user.id', 'nideshop_user.avatar', 'nideshop_user.nickname'])
      .join('nideshop_order on nideshop_user.id = nideshop_order.user_id')
      .where({
        register_time: [
          '>=', this.addHour(-24 * 30)
        ]
      })
      .order(['register_time desc'])
      .page(page, size)
      .countSelect();
    return this.simplePageRest(data);
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
    return this.simpleRest(this.outConvert(data));
  }
  inConvert(values) {
    values.is_show = values.is_show
      ? 1
      : 0;
    values.is_new = values.is_new
      ? 1
      : 0;
    values.groups = (values.groups || '').join(',');
    values.birthday = this.getTime(new Date(values.birthday));
    return values;
  }
  async postAction() {
    if (!this.isPost) {
      return false;
    }

    let values = this.post();
    const model = this.model('user');
    values = this.inConvert(values);
    delete values.id;

    await model.add(values);
    return this.simpleRest(this.outConvert(values));
  }

  async putAction() {
    let values = this.post();
    // eslint-disable-next-line no-console
    const id = this.post('id');

    const model = this.model('user');
    values = this.inConvert(values);
    if (id > 0) {
      await model
        .where({id: id})
        .update(values);
    };
    return this.simpleRest(this.outConvert(values));
  }

  async deleteAction() {
    const id = this.post('id');
    await this
      .model('user')
      .where({id: id})
      .limit(1)
      .delete();
    // TODO 删除图片

    return this.simpleRest();
  }
};
