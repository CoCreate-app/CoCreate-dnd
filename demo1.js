import dnd from './dnd';
import '../CoCreate-iframe.js/iframe.js';


let client = document.getElementById('client');

// setup sort or dnd in the current document with the context of window
dnd(window, document, {
  iframes: [client]
})
