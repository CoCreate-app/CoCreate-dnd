/*global initContainer*/
import { initContainer } from "./index.js";
import observer from '@cocreate/observer';
import { logger } from '@cocreate/utils'
let console = logger('off');






export default function init() {
  observer.init({
    name: "dnd-config",
    observe: ['addedNodes'],
    target: '.sortable, .cloneable',
    callback: mutation => {
     initElement( mutation.target, !!mutation.target.classList.contains('cloneable'));
    },
  });

  let cloneables = document.querySelectorAll(".cloneable");
  initElements(cloneables, true)
  let sortables = document.querySelectorAll(".sortable");
  initElements(sortables)

}


function initElements(elements, cloneable) {
  for (let el of elements)
    initElement(el)

}

function initElement(el, cloneable = false) {
  initContainer({ target:el, cloneable });
}
