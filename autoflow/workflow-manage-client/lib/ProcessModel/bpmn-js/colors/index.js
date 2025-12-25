'use strict';


module.exports = {
  __init__: [
    'colorContextPadProvider',
    'colorPopupProvider'
  ],
  colorContextPadProvider: [ 'type', require('./ColorContextPadProvider') ],
  
  colorPopupProvider: [ 'type', require('./ColorPopupProvider') ]
};