export function filterItems(filter) {
  const tokens = {};
  // 这里不能改箭头函数
  tokens.replace = function (oldKey, newKey) {
    if (!this[oldKey]) {
      return this;
    }
    if (!newKey) {
      delete this[oldKey];
      return this;
    }
    this[newKey] = this[oldKey];
    delete this[oldKey];
    return this;
  };

  tokens.rewrite = function(key, fc) {
    const arr = this[key];
    for (let i = 0; i < arr.length; i++) {
      if (i % 2 !== 0) {
        arr[i] = fc(arr[i]);
      }
    }
    return this;
  };

  tokens.toWhereSQL = function() {
    return Object
      .keys(this)
      .filter(key => {
        return !isFunction(this[key]);
      })
      .map(key => {
        const andArray = [];
        const clone = [...this[key]];
        while (clone.length > 0) {
          const smbol = clone.shift();
          let value = clone.shift();
          value = isString(value)
            ? `'${value}'`
            : value;
          andArray.push(`\`${key}\` ${smbol} ${value}`);
        }
        return andArray.join(' and ');
      })
      .join(' and ');
  };

  tokens.toTime = function(key) {
    if (this[key]) {
      const arr = this[key];
      for (let i = 0; i < arr.length; i++) {
        if (i % 2 !== 0) {
          arr[i] = Date.parse(arr[i]);
        }
      }
    }
    return this;
  };

  tokens.set = function(key, arr) {
    var t = this[key] || [];
    t.push(...arr);
    this[key] = t;
  };

  function isFunction(functionToCheck) {
    return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
  }
  function isString(value) {
    return value instanceof String || typeof value === 'string';
  }

  const result = Object
    .keys(filter)
    .map(key => {
      const value = filter[key];
      if (key === 'q') {
        tokens.set('q', ['like', `%${value}%`]);
        return '';
      }
      // eslint-disable-next-line no-console console.log('filter', value);
      if (key.indexOf('_lte') !== -1) {
        // less than or equal
        const realKey = key.replace(/(_lte)$/, '');
        tokens.set(realKey, ['<=', value]);
        return `${realKey} <= ${value}`;
      }
      if (key.indexOf('_gte') !== -1) {
        // less than or equal
        const realKey = key.replace(/(_gte)$/, '');
        tokens.set(realKey, ['>=', value]);
        return `${realKey} >= ${value}`;
      }
      if (key.indexOf('_lt') !== -1) {
        // less than or equal
        const realKey = key.replace(/(_lt)$/, '');
        tokens.set(realKey, ['<', value]);
        return `${realKey} < ${value}`;
      }
      if (key.indexOf('_gt') !== -1) {
        // less than or equal
        const realKey = key.replace(/(_gt)$/, '');
        tokens.set(realKey, ['>', value]);
        return `${realKey} > ${value}`;
      }
      if (value instanceof Array) {
        tokens.set(key, ['in', value]);
        // eslint-disable-next-line no-undef
        return `${key} in (${value})`;
      }
      // eslint-disable-next-line no-undef require replace
      tokens.set(key, ['=', value]);
      return `${key} = ${value}`;
      // only the items matching all filters functions are in (AND logic) return
      // filterFunctions; return items.filter(item =>
      // filterFunctions.reduce((selected, filterFunction) => selected &&
      // filterFunction(item), true));
    });
  return {whereSQL: result, sqlToken: tokens};
}
