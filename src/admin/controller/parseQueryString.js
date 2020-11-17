export default function parseQueryString(queryString) {
  if (!queryString) {
    return null;
  }
  const queryObject = {};
  const queryElements = queryString.split('&');

  queryElements.map((queryElement) => {
    if (queryElement.indexOf('=') === -1) {
      queryObject[queryElement] = true;
    } else {
      // eslint-disable-next-line prefer-const
      let [key,
        value] = queryElement.split('=');
      if (value.indexOf('[') === 0 || value.indexOf('{') === 0) {
        value = JSON.parse(value);
      }
      queryObject[key.trim()] = value;
    }
  });

  return queryObject;
}
