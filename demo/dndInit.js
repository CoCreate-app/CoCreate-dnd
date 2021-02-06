window.initDnd({
  target: document,
  drop: "#dnd",
  drag: "#dnd > *",
  clone: "#cloneable > *",
});
window.initSortable({
  target: document.getElementById("sortable"),
  handle: ".handle",
});
window.initSortable({
  target: document.getElementById("sortable1"),
  handle: ".handle1",
});

