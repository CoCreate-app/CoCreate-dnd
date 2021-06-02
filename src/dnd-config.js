/*global initContainer*/
import { initContainer } from "./index.js";

import observer from '@cocreate/observer';
export default function dndConfigs() {



  observer.init({
    name: "dnd-config",
    observe: ["childList"],
    include: ".sortable, .cloneable",
    callback: mutation => {
      let el = mutation.target?.parentElement || mutation.target;

      if (el)
        init(el)
    },
  });



  init(document)


}


function init(el) {

  let sortables = el.querySelectorAll(".sortable");

  sortables.forEach((sortable) => {
    initContainer({ target: sortable });
  });

  let cloneables = el.querySelectorAll(".cloneable");
  cloneables.forEach((cloneable) => {
    initContainer({ target: cloneable, cloneable: true });
  });

}
