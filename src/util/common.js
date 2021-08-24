import domContext, { initFunctionState } from "./domContext";

//find the global context
let parentWindow = window;
while (parentWindow !== window.parent) parentWindow = window.parent;
let dndContext;
if (!parentWindow.dndContext) {
  dndContext = new domContext();
  parentWindow.dndContext = dndContext;
} else dndContext = parentWindow.dndContext;

export { dndContext, initFunctionState };

export function getCoc(el, att) {
  if (!el.tagName) el = el.parentElement;
  return dndContext.getContext(el, att);
}

export function getCocs(el, attList) {
  if (!el.tagName) el = el.parentElement;
  return dndContext.getContexts(el, attList);
}

export function computeStyles(el, properties) {
  let computed = window.getComputedStyle(el);
  let result = {};
  properties.forEach((property) => {
    result[property] = parseInt(computed[property]);
  });
  return result;
}

export function pDistance(x, y, x1, y1, x2, y2) {
  var A = x - x1;
  var B = y - y1;
  var C = x2 - x1;
  var D = y2 - y1;

  var dot = A * C + B * D;
  var len_sq = C * C + D * D;
  var param = -1;
  if (len_sq != 0)
    //in case of 0 length line
    param = dot / len_sq;

  var xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  var dx = x - xx;
  var dy = y - yy;
  return Math.sqrt(dx * dx + dy * dy);
}