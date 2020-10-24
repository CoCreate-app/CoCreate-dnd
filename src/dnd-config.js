/*global initContainer*/

export default function dndConfigs() {
  let sortables = document.querySelectorAll(".sortable");

  sortables.forEach((sortable) => {
    initContainer({ target: sortable });
  });

  let cloneables = document.querySelectorAll(".cloneable");

  cloneables.forEach((cloneable) => {
    initContainer({ target: cloneable, cloneable: true });
  });
}
