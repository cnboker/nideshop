const Base = require('./base.js');

module.exports = class extends Base {
  /**
   * index action
   * @return {Promise} []
   */
  async getAction() {
    const {filter} = this.queryParams();
    var model = this.model('region');
    const data = await model.where(filter).select();
    return this.simpleRest(data);
  }
};
