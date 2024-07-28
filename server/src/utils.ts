function toCamelCase(str: string): string {
  return str.replace(/([-_][a-z])/g, (group) =>
    group.toUpperCase().replace('-', '').replace('_', '')
  );
}

export function keysToCamelCase(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((v) => keysToCamelCase(v));
  }

  return Object.keys(obj).reduce((result: any, key) => {
    const camelKey = toCamelCase(key);
    result[camelKey] = keysToCamelCase(obj[key]);
    return result;
  }, {});
}
