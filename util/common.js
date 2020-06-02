import { group_name } from './variables';

// export function createBlockMarker(border = "2px solid blue") {
//   let marker = document.createElement("div");
//   marker.id = "block-marker";
//   marker.style.backgroundColor = "transparent";
//   marker.style.position = "absolute";
//   marker.style.display = "none";
//   marker.style.border = border;
//   marker.style.pointerEvents = 'none';
//   return marker;
// }

// return droppable-candidate element or false if no candidate found
export function getDropable(el) {
  do {
    if (el.getAttribute('droppable')) return el;
    el = el.parentElement;
    if (!el) return false;
  } while (true);
}


export function getCoc(el, att) {
  if (!el.tagName)
    el = el.parentElement;
  do {
    if (el.tagName == 'IFRAME') return false;
    if (el.getAttribute(att) == "true") return el;
    el = el.parentElement;
    if (!el) return false;
  } while (true);
}


export function getCocs(el, attList) {
  if (!el.tagName)
    el = el.parentElement;
  do {
    if (el.tagName == 'IFRAME') return false;
    for (let att of attList) {
      if (el.getAttribute(att) == "true") return [el, att];
    }
    el = el.parentElement;
    if (!el) return false;
  } while (true);
}



export function getGroupName(el) {
  if (!el.tagName)
    el = el.parentElement;
  do {
    let groupName = el.getAttribute(group_name);
    if (groupName) return groupName;
    el = el.parentElement;
    if (!el) return "";
  } while (true);
}


export function computeStyles(el, properties) {
  let computed = window.getComputedStyle(el);
  let result = {};
  properties.forEach((property) => {
    result[property] = parseInt(computed[property]);
  });
  return result;
}

export function randomId() {
  const uint32 = window.crypto.getRandomValues(new Uint32Array(1))[0];
  return uint32.toString(16);
}



export function boxMarkerTooltip(callback, referenceWindow, options) {
  options = Object.assign({ borderSize: 2 }, options)

  let tagBox = document.createElement("div");
  tagBox.id = "tagBox";
  tagBox.style.backgroundColor = "blue";
  tagBox.style.color = "white";
  tagBox.style.position = "absolute";
  tagBox.style.zIndex = "99999";
  tagBox.style.padding = "2px 10px";
  tagBox.style.fontSize = "10px";
  tagBox.style.display = "none";
  tagBox.style.pointerEvents = 'none';


  document.body.append(tagBox);
  this.obj = tagBox;
  this.draw = function(el, ref) {
    tagBox.style.display = "block";
    tagBox.innerHTML = callback(el);
    let { height, paddingTop, paddingBottom } = computeStyles(tagBox, [
      "height",
      "paddingTop",
      "paddingBottom",
    ]);
    let rect = el.getBoundingClientRect();

    let frameRect;
    if (ref.frame)
      frameRect = ref.frame.getBoundingClientRect();
    else
      frameRect = { top: 0, left: 0 }

    tagBox.style.top = frameRect.top +
      rect.top - options.borderSize + referenceWindow.scrollY - height - paddingTop - paddingBottom + "px";
    tagBox.style.left = frameRect.left + rect.left - options.borderSize + window.scrollX + "px";
  };

  this.hide = function(el) {
    tagBox.style.display = "none";
  };
}



export function boxMarker(attributeName, priority, options) {

  options = Object.assign({}, options)
  let { onRemove, onAdd } = options;
  this.lastEl = document.head;

  this.draw = function(el, callback, lastElCallback) {
    if (el === this.lastEl) return;
    el.setAttribute(attributeName, true);
    if (onAdd) onAdd(el)
    if (onRemove)
      onRemove(this.lastEl)

    this.lastEl.removeAttribute(attributeName);
    this.lastEl = el;

  };

  // todo: onRemove was onAdd, was that a bug?
  this.hide = function(callback) {
    this.lastEl.removeAttribute(attributeName);
    if (onRemove)
      onRemove(this.lastEl)
    this.lastEl = document.head;
  };
}

let lasttransition = "none";
export function dropMarker(options) {

  options = Object.assign({ borderSize: 2, dropMarkerMargin: 5 }, options)
  let marker = document.createElement("div");
  marker.id = "marker";
  marker.style.backgroundColor = "green";
  marker.style.position = "absolute";
  marker.style.display = "none";
  marker.style.pointerEvents = 'none';



  this.lastOrigntaion = undefined;

  document.body.append(marker);
  this.obj = marker;

  this.draw = function(parent, el, orientation, isInside, ref) {
    marker.style.display = "block";



    let rect = el.getBoundingClientRect();
    switch (orientation) {
      case 'top':
      case 'bottom':
        // order is important to fix rectangle bug
        marker.style.height = options.borderSize + "px";
        marker.style.width = rect.width + "px";
        break;
      case 'left':
      case 'right':
        marker.style.width = options.borderSize + "px";
        marker.style.height = rect.height + "px";
        break;
      default:
        throw new Error('one type of orientation must be specified');
    }




    if (parent != el) {
      let prect = parent.getBoundingClientRect();
      let parentSize = prect[orientation]
      let childSize = rect[orientation]
      if (Math.abs(parentSize - childSize) < options.dropMarkerMargin * 2)
        isInside = true;
    }
    let frameRect;
    if (ref.frame)
      frameRect = ref.frame.getBoundingClientRect();
    else
      frameRect = { top: 0, left: 0 }

    marker.style.transition = "top,left 0.2s ease-in-out"
    switch (orientation) {
      case 'top':
        marker.style.top = frameRect.top + rect.top - options.borderSize / 2 + window.scrollY + (isInside ? options.dropMarkerMargin : -options.dropMarkerMargin) + "px";
        marker.style.left = frameRect.left + rect.left - options.borderSize / 2 + window.scrollX + "px";
        break;
      case 'bottom':
        marker.style.top = frameRect.top + rect.bottom - options.borderSize / 2 + window.scrollY + (isInside ? -options.dropMarkerMargin : options.dropMarkerMargin) + "px";
        marker.style.left = frameRect.left + rect.left - options.borderSize / 2 + window.scrollX + "px";
        break;
      case 'left':
        marker.style.top = frameRect.top + rect.top - options.borderSize / 2 + window.scrollY + "px";
        marker.style.left = frameRect.left + rect.left - options.borderSize / 2 + window.scrollX + (isInside ? options.dropMarkerMargin : -options.dropMarkerMargin) + "px";
        break;
      case 'right':
        marker.style.top = frameRect.top + rect.top - options.borderSize / 2 + window.scrollY + "px";
        marker.style.left = frameRect.left + rect.right - options.borderSize / 2 + window.scrollX + (isInside ? -options.dropMarkerMargin : options.dropMarkerMargin) + "px";
        break;
      default:
        console.log(orientation)
        throw new Error('one type of orientation must be specified');
    }
    // marker.style.transition = "all 0.2s ease-in-out";
    this.lastOrigntaion = orientation;

  }

  this.hide = function(el) {
    marker.style.display = "none";
  };
}


export function parse(text) {
  let doc = new DOMParser().parseFromString(text, 'text/html');
  if (doc.head.children[0])
    return doc.head.children[0];
  else
    return doc.body.children[0];
}


export function ghostEffect(el, ref) {
  this.effectCb


  this.start = () => {
    this.cloneEl = el.cloneNode(true);

    this.cloneEl.style.visibility = 'hidden';
    ref.document.body.append(this.cloneEl)

    this.cloneEl.style.pointerEvents = 'none';
    this.cloneEl.style.overflow = 'hidden'
    this.cloneEl.style.textOverflow = 'ellipsis'
    this.cloneEl.style.whiteSpace = 'nowrap'

    this.cloneEl.style.opacity = '0.8';
    this.cloneEl.style.position = 'fixed';
    this.cloneEl.style.Zindex = '2000';
    this.cloneEl.id = 'ghost-effect';



    this.cloneEl.style.visibility = 'visible';
  }

  this.draw = (e, ref) => {

    let rect = this.cloneEl.getBoundingClientRect();
    let { marginTop, marginBottom, marginLeft, marginRight } = computeStyles(this.cloneEl, [

      'marginTop',
      'marginBottom',
      'marginLeft',
      'marginRight',
    ]);

    let frameRect;
    if (ref.frame)
      frameRect = ref.frame.getBoundingClientRect();
    else
      frameRect = { top: 0, left: 0 }


    this.cloneEl.style.top = frameRect.top + e.y - (rect.height + marginTop + marginBottom) / 2;
    this.cloneEl.style.left = frameRect.left + e.x - (rect.width + marginLeft + marginRight) / 2;
  }

  this.hide = (ref) => {
    this.cloneEl.style.visibility = 'hidden';
    // ref.document.getElementById('ghost-effect').remove()
    // ref.document.removeEventListener('mousemove', this.effectCb)
  }
}
