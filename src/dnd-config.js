/*global initContainer*/
import { initContainer } from "./index.js";

import observer from '@cocreate/observer';
export default function dndConfigs() {



  observer.init({
    name: "dnd-config",
    observe: ["childList"],
    	include: ".sortable, .cloneable",
    callback: mutation => {
       console.log('dnd domReader mutation ', new Date().getSeconds()  + ' ' + new Date().getMilliseconds())
      init( mutation.target.parentElement.parentElement)
      // console.log('dnd config observer', mutation.target, mutation.target.parentElement, mutation)
    },
  });



init(document)


}


function init(el){
   console.log('dnd domReader init ', new Date().getSeconds()  + ' ' + new Date().getMilliseconds())
  let sortables = el.querySelectorAll(".sortable");
  
  sortables.forEach((sortable) => {
    console.log('dnd config sortable', sortable)
    initContainer({ target: sortable });
  });

  let cloneables = el.querySelectorAll(".cloneable");

  cloneables.forEach((cloneable) => {
    console.log('dnd config cloneable',cloneable)
    initContainer({ target: cloneable, cloneable: true });
  });

}