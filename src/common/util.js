export const getOrderStatusText = (orderStatus) => {
  let statusText = '未付款';
  switch (orderStatus) {
    case 0:
      statusText = '未付款';
      break;
      // eslint-disable-next-line no-fallthrough
    case 201:
      statusText = '已付款';
      break;
      // eslint-disable-next-line no-fallthrough
    case 300:
      statusText = '已发货';
      break;
    case 301:
      statusText = '收货已确认';
      break;
    case 401:
      statusText = '没发货';
      break;
    case 402:
      statusText = '退款退货';
      break;
    case 501:
      statusText = '已还书';
      break;
      // eslint-disable-next-line no-fallthrough
    case 502:
      statusText = '还书已收货';
      break;
    default:
      statusText = '未知';
  }

  return statusText;
};
