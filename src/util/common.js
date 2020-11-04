import { group_name } from "./variables";
import domContext from "./domContext2";

let initFunctionState = [];
//find the global context
let parentWindow = window;
while (parentWindow !== window.parent) parentWindow = window.parent;
let dndContext;
if (!parentWindow.dndContext) {
  dndContext = new domContext();
  parentWindow.dndContext = dndContext;
} else dndContext = parentWindow.dndContext;

export { dndContext,initFunctionState };

function checkInitFunction(element, request) {
  for (let state of initFunctionState) {
    let r = state.onDnd(element,request);
    if (state.target.contains(element) && Array.isArray(r)) return r;
  }
}
  
export function getCoc(el, att) {
  if (!el.tagName) el = el.parentElement;
  let r = dndContext.getContext(el, att);
  if(!r)
  {
    let r2 = checkInitFunction(el,[att]);
    if(Array.isArray(r2) && att == r2[1])
    return r2[0]
    else 
    return;
  }
  else 
  return r;

}

export function getCocs(el, attList) {
  if (!el.tagName) el = el.parentElement;
  let r= dndContext.getContexts(el, attList);
    if(!Array.isArray(r))
  {
    let r2 = checkInitFunction(el, attList);
    if(Array.isArray(r2) && attList.includes(r2[1]))
      return r2;
    else 
      return;
  }
  else 
    return r;
}

export function getGroupName(el) {
  if (!el.tagName) el = el.parentElement;
  do {
    let groupName = el.getAttribute(group_name);
    if (groupName) return [el, groupName];
    el = el.parentElement;
    if (!el) return [null, undefined];
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

let lasttransition = "none";
export function dropMarker(options) {
  options = Object.assign({ borderSize: 2, dropMarkerMargin: 5 }, options);
  let marker = document.createElement("div");
  marker.id = "dropMarker";
  // marker.style.backgroundColor = "green";
  // marker.style.position = "absolute";
  // marker.style.display = "none";
  marker.style.pointerEvents = "none";

  this.lastOrigntaion = undefined;

  document.body.append(marker);
  this.obj = marker;

  this.draw = function (parent, el, orientation, isInside, ref) {
    marker.style.display = "block";

    let rect = el.getBoundingClientRect();
    if (!rect.width && !rect.height) {
      rect = parent.getBoundingClientRect();
      orientation = "top";
    }

    switch (orientation) {
      case "top":
      case "bottom":
        // order is important to fix rectangle bug
        marker.style.height = options.borderSize + "px";
        marker.style.width = rect.width + "px";
        break;
      case "left":
      case "right":
        marker.style.width = options.borderSize + "px";
        marker.style.height = rect.height + "px";
        break;
      default:
        throw new Error("one type of orientation must be specified");
    }

    if (parent != el) {
      let prect = parent.getBoundingClientRect();
      let parentSize = prect[orientation];
      let childSize = rect[orientation];
      if (Math.abs(parentSize - childSize) < options.dropMarkerMargin * 2)
        isInside = true;
    }
    let frameRect;
    if (ref.frame) frameRect = ref.frame.getBoundingClientRect();
    else frameRect = { top: 0, left: 0 };

    marker.style.transition = "top,left 0.2s ease-in-out";
    switch (orientation) {
      case "top":
        marker.style.top =
          frameRect.top +
          rect.top -
          options.borderSize / 2 +
          window.scrollY +
          (isInside ? options.dropMarkerMargin : -options.dropMarkerMargin) +
          "px";
        marker.style.left =
          frameRect.left +
          rect.left -
          options.borderSize / 2 +
          window.scrollX +
          "px";
        break;
      case "bottom":
        marker.style.top =
          frameRect.top +
          rect.bottom -
          options.borderSize / 2 +
          window.scrollY +
          (isInside ? -options.dropMarkerMargin : options.dropMarkerMargin) +
          "px";
        marker.style.left =
          frameRect.left +
          rect.left -
          options.borderSize / 2 +
          window.scrollX +
          "px";
        break;
      case "left":
        marker.style.top =
          frameRect.top +
          rect.top -
          options.borderSize / 2 +
          window.scrollY +
          "px";
        marker.style.left =
          frameRect.left +
          rect.left -
          options.borderSize / 2 +
          window.scrollX +
          (isInside ? options.dropMarkerMargin : -options.dropMarkerMargin) +
          "px";
        break;
      case "right":
        marker.style.top =
          frameRect.top +
          rect.top -
          options.borderSize / 2 +
          window.scrollY +
          "px";
        marker.style.left =
          frameRect.left +
          rect.right -
          options.borderSize / 2 +
          window.scrollX +
          (isInside ? -options.dropMarkerMargin : options.dropMarkerMargin) +
          "px";
        break;
      default:
        
        throw new Error("one type of orientation must be specified");
    }
    // marker.style.transition = "all 0.2s ease-in-out";
    this.lastOrigntaion = orientation;
  };

  this.hide = function (el) {
    marker.style.display = "none";
  };
}

export function parse(text) {
  let doc = new DOMParser().parseFromString(text, "text/html");
  if (doc.head.children[0]) return doc.head.children[0];
  else return doc.body.children[0];
}

export function ghostEffect(elementEvent, el, ref) {
  this.effectCb;
  
  this.start = () => {
    this.cloneEl = el.cloneNode(true);
    let { width, height } = ref.window.getComputedStyle(el);
    let cloneElStyle = window.getComputedStyle(this.cloneEl);
    this.wrapper = document.createElement("div");

    this.wrapper.style.height =  height;
    this.wrapper.style.width =  width;
    this.wrapper.append(this.cloneEl);
    this.wrapper.style.display = "none";
    ref.document.body.append(this.wrapper);

    this.wrapper.style.pointerEvents = "none";
    // this.wrapper.style.overflow = "hidden";
    // this.wrapper.style.textOverflow = "ellipsis";
    // this.wrapper.style.whiteSpace = "nowrap";

    // this.wrapper.style.opacity = "0.5";
    // this.wrapper.style.position = "fixed";
    // this.wrapper.style.Zindex = "20000";
    this.wrapper.id = "ghostEffect";
  };

  this.draw = (e, ref) => {
    this.wrapper.style.display = "block";
    let rect = this.wrapper.getBoundingClientRect();
    let {
      marginTop,
      marginBottom,
      marginLeft,
      marginRight,
      width,
      height,
    } = computeStyles(this.cloneEl, [
      "marginTop",
      "marginBottom",
      "marginLeft",
      "marginRight",
      "width",
      "height",
    ]);

    let frameRect;
    if (ref.frame) frameRect = ref.frame.getBoundingClientRect();
    else frameRect = { top: 0, left: 0 };

    this.wrapper.style.top = frameRect.top + e.y - elementEvent.offsetY + "px";
    this.wrapper.style.left = frameRect.left + e.x - elementEvent.offsetX + "px";
  };

  this.hide = () => {
    this.wrapper.remove();
  };
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

export function closestChild(p, children) {
  let closestDistance = Infinity;
  let closestchild;
  let topOrientation;
  for (let child of children) {
    if (child.classList.contains("hidden")) continue;
    let [orientation, distance] = distanceToChild(p, child);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestchild = child;
      topOrientation = orientation;
    }
  }
  return [topOrientation, closestchild];
}

let orientations = ["left", "top", "right", "bottom"];
/**
 *  p [x,y]
 *  child element
 */
export function distanceToChild(p, child) {
  let rect = child.getBoundingClientRect();

  let line1 = { p1: [rect.top, rect.left], p2: [rect.bottom, rect.left] };
  let line2 = { p1: [rect.top, rect.left], p2: [rect.top, rect.right] };
  let line3 = { p1: [rect.top, rect.right], p2: [rect.bottom, rect.right] };
  let line4 = { p1: [rect.bottom, rect.left], p2: [rect.bottom, rect.right] };

  let distances = [
    pDistance(p[0], p[1], line1.p1[1], line1.p1[0], line1.p2[1], line1.p2[0]),
    pDistance(p[0], p[1], line2.p1[1], line2.p1[0], line2.p2[1], line2.p2[0]),
    pDistance(p[0], p[1], line3.p1[1], line3.p1[0], line3.p2[1], line3.p2[0]),
    pDistance(p[0], p[1], line4.p1[1], line4.p1[0], line4.p2[1], line4.p2[0]),
  ];

  let orientation;
  let closestDistance = Infinity;
  distances.forEach((distance, i) => {
    if (distance < closestDistance) {
      closestDistance = distance;
      orientation = orientations[i];
    }
  });
  return [orientation, closestDistance];
}

export function distanceToChildLeftRight(p, child) {
  let rect = child.getBoundingClientRect();

  let line1 = { p1: [rect.top, rect.left], p2: [rect.bottom, rect.left] };
  let line3 = { p1: [rect.top, rect.right], p2: [rect.bottom, rect.right] };

  let distances = [
    pDistance(p[0], p[1], line1.p1[1], line1.p1[0], line1.p2[1], line1.p2[0]),
    pDistance(p[0], p[1], line3.p1[1], line3.p1[0], line3.p2[1], line3.p2[0]),
  ];

  let orientation;
  let closestDistance = Infinity;
  distances.forEach((distance, i) => {
    if (distance < closestDistance) {
      closestDistance = distance;
      orientation = ["left", "right"][i];
    }
  });
  return [orientation, closestDistance];
}

export function distanceToChildTopBottom(p, child) {
  let rect = child.getBoundingClientRect();

  let line2 = { p1: [rect.top, rect.left], p2: [rect.top, rect.right] };

  let line4 = { p1: [rect.bottom, rect.left], p2: [rect.bottom, rect.right] };

  let distances = [
    pDistance(p[0], p[1], line2.p1[1], line2.p1[0], line2.p2[1], line2.p2[0]),

    pDistance(p[0], p[1], line4.p1[1], line4.p1[0], line4.p2[1], line4.p2[0]),
  ];

  let orientation;
  let closestDistance = Infinity;
  distances.forEach((distance, i) => {
    if (distance < closestDistance) {
      closestDistance = distance;
      orientation = ["top", "bottom"][i];
    }
  });
  return [orientation, closestDistance];
}

export function autoScroller({ speed, threshold }) {
  this.lastScrollingElement;
  this.onElement;
  this.mouse;
  this.speed;
  this.interval;
  this.isActive;

  this.update = function (x, y) {
    this.mouse = { x, y };
  };

  this.calculateScroll = function ({ x, y, element, onMouseScrollMove }) {
    
    let hasHorizontalScrollbar = element.scrollWidth > element.clientWidth;
    let hasVerticalScrollbar = element.scrollHeight > element.clientHeight;

    let horScrollThreshold = element.clientWidth / threshold;
    let verScrollThreshold = element.clientHeight / threshold;

    let [orientation, closestDistance] = [];
    if (hasVerticalScrollbar)
      [orientation, closestDistance] = distanceToChildTopBottom(
        [x, y],
        element
      );
    else if (hasHorizontalScrollbar)
      [orientation, closestDistance] = distanceToChildLeftRight(
        [x, y],
        element
      );

    if (orientation) {
      let condition;
      switch (orientation) {
        case "top":
        case "bottom":
          this.speed = (verScrollThreshold / closestDistance) * speed;
          condition = closestDistance < verScrollThreshold;
          break;

        case "left":
        case "right":
          this.speed = (horScrollThreshold / closestDistance) * speed;
          condition = closestDistance < horScrollThreshold;
          break;
      }

      // let scrollWidth = element.offsetWidth - element.clientWidth; // is scroll active
      if (condition) {
        if (!this.isActive) {
          this.isActive = true;
          this.activateScroll(element, orientation, onMouseScrollMove);
        } else if (this.isActive && this.lastScrollingElement !== element) {
          this.deactivateScroll();
          this.activateScroll(element, orientation, onMouseScrollMove);
        }
      } else if (this.isActive) {
        this.isActive = false;
        this.deactivateScroll();
      }
    }
  };

  this.activateScroll = function (element, orientation, callback) {
    
    this.lastScrollingElement = element;
    this.interval = setInterval(() => {
      switch (orientation) {
        case "top":
          element.scrollBy(0, -this.speed);
          
          break;
        case "bottom":
          element.scrollBy(0, this.speed);
          
          break;
        case "left":
          element.scrollBy(-this.speed, 0);
          
          break;
        case "right":
          element.scrollBy(this.speed, 0);
          
          break;
      }

      this.onElement = document.elementFromPoint(this.mouse.x, this.mouse.y);
      if (this.onElement) {
        callback({ x: this.mouse.x, y: this.mouse.y, target: this.onElement });
      }
    }, 10);
  };

  this.deactivateScroll = function () {
    
    clearInterval(this.interval);
  };
}
