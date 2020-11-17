export function filterItems(filter) {
  return Object
    .keys(filter)
    .filter(x => x !== 'q')
    .map(key => {
      const value = filter[key];
      // eslint-disable-next-line no-console console.log('filter', value);
      if (key.indexOf('_lte') !== -1) {
        // less than or equal
        const realKey = key.replace(/(_lte)$/, '');
        if (value instanceof String || typeof value === 'string') {
          return `${realKey} <= '${value}'`;
        }
        return `${realKey} <= ${value}`;
      }
      if (key.indexOf('_gte') !== -1) {
        // less than or equal
        const realKey = key.replace(/(_gte)$/, '');
        if (value instanceof String || typeof value === 'string') {
          return `${realKey} <= '${value}'`;
        }
        return `${realKey} >= ${value}`;
      }
      if (key.indexOf('_lt') !== -1) {
        // less than or equal
        const realKey = key.replace(/(_lt)$/, '');
        if (value instanceof String || typeof value === 'string') {
          return `${realKey} <= '${value}'`;
        }
        return `${realKey} < ${value}`;
      }
      if (key.indexOf('_gt') !== -1) {
        // less than or equal
        const realKey = key.replace(/(_gt)$/, '');
        if (value instanceof String || typeof value === 'string') {
          return `${realKey} <= '${value}'`;
        }
        return `${realKey} > ${value}`;
      }
      if (value instanceof Array) {
        // eslint-disable-next-line no-undef
        return `${key} in (${value})`;
      }
     
      // eslint-disable-next-line no-undef
      return `${key} = ${value}`;
      // only the items matching all filters functions are in (AND logic) return
      // filterFunctions; return items.filter(item =>
      // filterFunctions.reduce((selected, filterFunction) => selected &&
      // filterFunction(item), true));
    });
}
