const Base = require('./base.js');

module.exports = class extends Base {
  async indexAction() {
    const banner = await this
      .model('ad')
      .where({ad_position_id: 1})
      .select();
    // const channel = await this.model('channel').order({sort_order:
    // 'asc'}).select();
    let newGoods = await this
      .model('goods')
      .field(['id', 'name', 'list_pic_url', 'retail_price', 'author'])
      .where({is_new: 1})
      .limit(4)
      .select();
    const self = this;
    newGoods = newGoods.map((x) => ({
      ...x,
      ...{
        'list_pic_url': `http://${self.ctx.host}${x.list_pic_url}`
      }
    }));
    let hotGoods = await this
      .model('goods')
      .field(['id', 'name', 'list_pic_url', 'retail_price', 'goods_brief', 'author'])
      .where({is_hot: 1})
      .limit(3)
      .select();

    hotGoods = hotGoods.map((x) => ({
      ...x,
      ...{
        'list_pic_url': `http://${self.ctx.host}${x.list_pic_url}`
      }
    }));
    // const brandList = await this.model('brand').where({is_new:
    // 1}).order({new_sort_order: 'asc'}).limit(4).select(); const topicList = await
    // this.model('topic').limit(3).select();

    const categories = await this
      .model('category')
      .field(['id', 'name'])
      .select();
    const channel = [];
    const newCategoryList = [];

    for (const categoryItem of categories) {
      channel.push({
        ...categoryItem,
        ...{
          url: `/pages/category/category?id=${categoryItem.id}`
        }
      });
      // const childCategoryIds = await this.model('category').where({parent_id:
      // categoryItem.id}).getField('id', 100);
      const categoryGoods = await this
        .model('goods')
        .field(['id', 'name', 'list_pic_url', 'retail_price', 'author'])
        .where({id: categoryItem.id})
        .limit(8)
        .select();

      const goodsList = categoryGoods.map((x) => ({
        ...x,
        ...{
          list_pic_url: `http://${self.ctx.host}${x.list_pic_url}`
        }
      }));
      newCategoryList.push({id: categoryItem.id, name: categoryItem.name, goodsList});
    }
    return this.success({
      banner: banner,
      channel,
      newGoodsList: newGoods,
      hotGoodsList: hotGoods,
      // brandList: brandList, topicList: topicList,
      categoryList: newCategoryList
    });
  }
};
