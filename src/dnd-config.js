/*global initContainer*/
import { initContainer } from "./index.js";

import observer from '@cocreate/observer';
export default function dndConfigs() {



  observer.init({
    name: "dnd-config",
    observe: ["childList"],
    include:'.sortable, .cloneable',
    callback: mutation => {
      if(mutation.target.classList.has('sortable'))
         initContainer({ target: mutation.target });
        else
         initContainer({ target: mutation.target, cloneable: true });
      // let sortables = document.querySelectorAll(".sortable");
    
      // sortables.forEach((sortable) => {
      //   initContainer({ target: sortable });
      // });
    
      // let cloneables = document.querySelectorAll(".cloneable");
    
      // cloneables.forEach((cloneable) => {
      //   initContainer({ target: cloneable, cloneable: true });
      // });
    },
  });


}
