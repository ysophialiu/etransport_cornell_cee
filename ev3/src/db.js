import Dexie from 'dexie';

export const db = new Dexie('EVDatabase');
db.version(2).stores({
  areaData: 'area',
  results: 'params', // Primary key and indexed props
});