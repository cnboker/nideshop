// eslint-disable-next-line no-unused-vars
import parseQueryString from './parseQueryString';
import {filterItems} from './filterItems';
module.exports = class extends think.Controller {
  async __before() {
    // 根据token值获取用户id
    this.ctx.state.token = this.ctx.header['x-nideshop-token'] || '';
    const tokenSerivce = think.service('token', 'admin');
    this.ctx.state.userId = await tokenSerivce.getUserId(this.ctx.state.token);

    // 只允许登录操作
    if (this.ctx.controller !== 'auth') {
      if (this.ctx.state.userId <= 0) {
        return this.fail(401, '请先登录');
      }
    }
    if (this.ctx.req.url.indexOf('?') !== -1) {
      this.ctx.req.queryString = decodeURIComponent(this.ctx.req.url.slice(this.ctx.req.url.indexOf('?') + 1));
    }
    // const newLocal = this.ctx.req;
    const params = parseQueryString(this.ctx.req.queryString);

    // eslint-disable-next-line no-console
    console.log('this.ctx.req.params', params, this.ctx.req.queryString);
    if (params) {
      if (params.filter) {
        const {filter} = params;
        Object
          .keys(filter)
          .map(key => {
            const kv = this.rewriteParams(key, filter[key]);
            if (kv) {
              delete filter[key];
              params.filter = {
                ...kv,
                ...filter
              };
            }
          });

        params.filter = filterItems(params.filter).join(' and ');
      }
      // eslint-disable-next-line no-console
      console.log('this.ctx.req.params', params, this.ctx.req.url);
      // eslint-disable-next-line one-var
      let size = 0;
      // eslint-disable-next-line prefer-const
      let page = 0;
      if (params.range) {
        size = params.range[1] + 1 - params.range[0];
        page = params.range[0] / size + 1;
      }

      this.ctx.req.params = {
        ...params,
        size,
        page
      };
    }
  }

  // rewrite params
  rewriteParams() {
    // eslint-disable-next-line no-console
    console.log('base rewriteParents');
    return null;
  }

  queryParams() {
    const params = this.ctx.req.params;
    return {
      size: params.size,
      page: params.page,
      sort: params.sort
        ? params
          .sort
          .join(' ')
        : null,
      filter: params.filter
    };
  }

  simplePageRest(result) {
    var name = this.get('name');
    this.header('Access-Control-Expose-Headers', 'Content-Range');
    this.header('Content-Range', `${name} 0-${result.totalPages || 0}/${result.count || 0}`);
    this.json(result.data);
  }

  simpleRest(result) {
    var name = this.get('name');
    this.header('Access-Control-Expose-Headers', 'Content-Range');
    this.header('Content-Range', `${name} 0-0/${result.length}`);
    this.json(result);
  }
};
