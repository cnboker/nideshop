// default config
module.exports = {
  route_on: true,
  default_module: 'api',
  deposit: 200, // 押金200
  lateFee: 0.5, // 滞纳金每天5毛
  weixin: {
    appid: 'wx0c673810a891c1cd', // 小程序 appid
    secret: '3a34ddf850e782961e8d270e733d3f54', // 小程序密钥
    mch_id: '1316479701', // 商户帐号ID
    partner_key: '', // 微信支付密钥
    notify_url: '' // 微信异步通知，例：https://www.nideshop.com/api/pay/notify
  },
  express: {
    // 快递物流信息查询使用的是快递鸟接口，申请地址：http://www.kdniao.com/
    appid: '', // 对应快递鸟用户后台 用户ID
    appkey: '', // 对应快递鸟用户后台 API key
    request_url: 'http://api.kdniao.cc/Ebusiness/EbusinessOrderHandle.aspx'
  }
};
