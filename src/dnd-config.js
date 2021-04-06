/*global initContainer*/
import { initContainer } from "./index.js";

import observer from '@cocreate/observer';
export default function dndConfigs() {



  observer.init({
    name: "dnd-config",
    observe: ["childList"],
    include: '.sortable, .cloneable',
    callback: mutation => {
      console.log('dnd config ', mutation, mutation.target)
      if (mutation.target.classList.contains('sortable'))
        initContainer({ target: mutation.target });
      else if (mutation.target.classList.contains('cloneable'))
        initContainer({ target: mutation.target, cloneable: true });

    },
  });


  let sortables = document.querySelectorAll(".sortable");

  sortables.forEach((sortable) => {
    console.log('dnd config sortable', sortable)
    initContainer({ target: sortable });
  });

  let cloneables = document.querySelectorAll(".cloneable");

  cloneables.forEach((cloneable) => {
    console.log('dnd config cloneable',cloneable)
    initContainer({ target: cloneable, cloneable: true });
  });



}
