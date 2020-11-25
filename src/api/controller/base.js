const moment = require('moment');
var region = null;
module.exports = class extends think.Controller {
  async __before() {
    // 根据token值获取用户id
    this.ctx.state.token = this.ctx.header['x-nideshop-token'] || '';
    const tokenSerivce = think.service('token', 'api');
    this.ctx.state.userId = await tokenSerivce.getUserId(this.ctx.state.token);

    const publicController = this.config('publicController');
    const publicAction = this.config('publicAction');
    // 如果为非公开，则验证用户是否登录
    const controllerAction = this.ctx.controller + '/' + this.ctx.action;
    if (!publicController.includes(this.ctx.controller) && !publicAction.includes(controllerAction)) {
      if (this.ctx.state.userId <= 0) {
        return this.fail(401, '请先登录');
      }
    }
  }

  /**
   * 获取时间戳
   * @returns {Number}
   */
  getTime() {
    return parseInt(Date.now() / 1000);
  }

  toYYYYMMDDHHMM(time) {
    return time > 0
      ? moment
        .unix(time)
        .format('YYYY-MM-DD HH:mm')
      : 0;
  };

  addHour(hours) {
    // eslint-disable-next-line no-extend-native
    Date.prototype.addHours = function(h) {
      this.setHours(this.getHours() + h);
      return this;
    };
    return parseInt((new Date().addHours(hours)).getTime() / 1000);
  }
  /**
   * 获取当前登录用户的id
   * @returns {*}
   */
  getLoginUserId() {
    return this.ctx.state.userId;
  }

  async getAddress(province, city, district) {
    if (!region) {
      region = await this
        .model('region')
        .select();
    }
    var p = region
      .find(x => x.id === province)
      .name;
    var c = region
      .find(x => x.id === city)
      .name;
    var d = region
      .find(x => x.id === district)
      .name;
    return p + c + d;
  }
};
