/*global initContainer*/
import { initContainer } from "./index.js";
export default function dndConfigs() {



  window.CoCreateObserver.add({
    name: "dnd-config",
    observe: ["childList"],
    task: mutation => {
       let sortables = document.querySelectorAll(".sortable");
    
      sortables.forEach((sortable) => {
        initContainer({ target: sortable });
      });
    
      let cloneables = document.querySelectorAll(".cloneable");
    
      cloneables.forEach((cloneable) => {
        initContainer({ target: cloneable, cloneable: true });
      });
    },
  });


}
