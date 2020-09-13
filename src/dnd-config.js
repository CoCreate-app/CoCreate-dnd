/*global initSortable*/

export default function dndConfigs() {
  let sortables = document.querySelectorAll(".sortable");

  sortables.forEach((sortable) => {
    initSortable({ target: sortable });
  });

  let cloneables = document.querySelectorAll(".cloneable");

  cloneables.forEach((cloneable) => {
    initSortable({ target: cloneable, cloneable: true });
  });
}
