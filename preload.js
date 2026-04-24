const { contextBridge } = require('electron');
const { search } = require('./src/shared/unicode');

contextBridge.exposeInMainWorld('unicodeSearch', {
  search
});
