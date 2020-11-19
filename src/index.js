/*global HTMLElement*/
import "./collaboration.js";
import dndConfig from "./dnd-config.js";
import "./util/iframe";
import {
  dropMarker,
  getCoc,
  ghostEffect,
  getGroupName,
  parse,
  getCocs,
  distanceToChild,
  autoScroller,
  initFunctionState,
} from "./util/common";

import VirtualDnd from "./virtualDnd";
import "./util/onClickLeftEvent";
import * as vars from "./util/variables.js";

let beforeDndSuccessCallback;
function beforeDndSuccess() {
  if (beforeDndSuccessCallback)
    return beforeDndSuccessCallback.apply(null, arguments);
  return {};
}

let mousemove, mouseup, mousedown, touchstart, touchend, touchmove;

export default function dnd(window, document, options) {
  // console.log("dnd is loading", window.location.pathname);

  options = Object.assign(
    {
      scroller: new autoScroller({ speed: 12, threshold: 4 }),

      myDropMarker: new dropMarker(),
    },
    options
  );
  // weird bug: dropMarker override the imported dropMarker in the above
  let { myDropMarker, scroller } = options;
  let isDraging = false;
  let consolePrintedEl = null; // dev only
  //// defining events

  let dnd = new VirtualDnd(beforeDndSuccess);
  let ghost;
  dnd.on("dragStart", (data) => {
    myDropMarker.hide();
    ghost = new ghostEffect(data.e, data.el, { window, document });
    ghost.start();
  });
  dnd.on("dragEnd", (data) => {
    myDropMarker.hide();
    if (ghost) ghost.hide(data.ref);
  });
  dnd.on("dragOver", (data) => {
    // it will always run when mouse or touch moves
    myDropMarker.draw(
      data.el,
      data.closestEl,
      data.orientation,
      !data.hasChild,
      data.ref
    );
  });

  let startGroup;

  function start(e, ref) {
    let r = getCocs(e.target, [
      vars.draggable,
      vars.cloneable,
      vars.handleable,
    ]);

    if (!Array.isArray(r)) return;
    let [el, att] = r;

    switch (att) {
      case vars.cloneable:
        let html = el.getAttribute(vars.data_insert_html);
        if (html) {
          el = parse(html);
          if (!el) return;
        } else el = el.cloneNode(true);
        break;
      case vars.draggable:
        let hasHandle = el.getAnyAttribute(vars.handleable);
        if (hasHandle) return;
        break;

      default:
        el = getCoc(el, vars.draggable);
    }

    // get group
    let groupResult = getGroupName(el);
    startGroup = groupResult[1];

    ref.document.body.style.cursor = "crosshair !important";

    isDraging = true;

    dnd.dragStart(e, el, null, ref, att);
  }

  function end(e, ref) {
    ref.document.body.style.cursor = "";

    dnd.dragEnd(e);
    myDropMarker.hide();

    scroller.deactivateScroll();
    isDraging = false;
  }

  function move({ x, y, target, isTouch }, ref, stopScroll) {
    if (!isDraging) return;

    if (ghost) ghost.draw({ x, y }, ref);
    scroller.update(x, y);
    if (isDraging) {
      // skip group names
      let [groupEl, groupname] = getGroupName(target);
      if (startGroup && groupname && startGroup !== groupname)
        do {
          let groupResult = getGroupName(groupEl);
          if (!groupResult[0]) return; // or return
          groupEl = groupResult[0].parentElement;
          groupname = groupResult[1];
          if (startGroup === groupname) {
            target = groupResult[0];
            break;
          }
        } while (true);
    } else {
      if (ghost) ghost.hide();
    }

    if (!target) return; // it's out of iframe if this is multi frame

    let onEl = target; // dev
    let el = getCoc(target, vars.droppable);
    // if (consolePrintedEl != target) { // dev
    //   // dev
    //   console.log("you are on: \n", onEl, "\nDroping in: \n", el);
    //   consolePrintedEl = el;
    // }

    // if()

    if (!el) return;

    if (!stopScroll) {
      scroller.calculateScroll({
        x,
        y,
        element: el.parentElement,
        onMouseScrollMove: (e) => move(e, ref, true),
      });
    }

    // todo:

    dnd.dragOver({ x, y, target: el }, el, ref);
  }

  touchstart = (e, ref) => {
    // console.log("touch start");

    start(e, ref);
  };
  touchend = (e, ref) => {
    // console.log("touch end");
    end(e, ref);
  };
  touchmove = (e, ref) => {
    // console.log("host touch move");

    let touch = e.touches[0];
    let x = touch.clientX;
    let y = touch.clientY;
    let el = ref.document.elementFromPoint(x, y);
    if (!el) return; // it's out of iframe

    // sending object representing an event data
    move({ x, y, target: el, isTouch: true }, ref);
  };
  mousedown = (e, ref) => {
    // console.log("mouse down", e);

    if (e.which != 1) return;

    start(e, ref);
  };
  mouseup = (e, ref) => {
    // console.log("mouse up", e);
    // todo: why would we check for hoverable and what do we do whith this?
    // let el = getCoc(e.target, hoverable)
    // if (!el) return;
    //

    if (e.which != 1) return;

    end(e, ref);
  };
  mousemove = (e, ref) => {
    move(e, ref);
  };
  // let CoCreateClickLeft = (e) => {
  //   // todo: not working!?
  //   let el = getCoc(e.target, selectable);
  //   if (!el) return;
  // };
}

const initIframe = ({ isIframe, frame, document, window }) => {
  let ref;
  if (isIframe) {
    let frameWindow = frame.contentWindow;
    let frameDocument = frameWindow.document || frame.contentDocument;
    let rect = frame.getBoundingClientRect();
    ref = {
      x: rect.left,
      y: rect.top,
      frame,
      window: frameWindow,
      document: frameDocument,
      isIframe: true,
    };
  } else {
    ref = { x: 0, y: 0, window, document, isIframe: false };
  }

  if (ref.window.CoCreateDnd && ref.window.CoCreateDnd.hasInit) return;

  if (!ref.document.querySelector("#dnd-style")) {
    let dndStyle = ref.document.createElement("style");
    dndStyle.id = "dnd-style";
    dndStyle.innerHTML = `    /* dnd specic */
       [data-draggable="true"], [data-cloneable="true"]  {
         touch-action: none;
       }
      /* dnd specic */`;
    ref.document.head.append(dndStyle);
  }

  ref.document.addEventListener("dragstart", (e) => {
    e.preventDefault();
    return false;
  });

  // disable selection
  ref.document.addEventListener("selectstart", (e) => {
    let r = getCocs(e.target, [vars.draggable, vars.cloneable]);
    if (!Array.isArray(r)) return;
    e.preventDefault();
  });
  // touch

  ref.document.addEventListener("touchstart", function (e) {
    e.preventDefault();
    touchstart.apply(this, [e, ref]);
  });
  ref.document.addEventListener("touchend", function (e) {
    e.preventDefault();
    touchmove.apply(this, [e, ref]);
  });
  ref.document.addEventListener("touchmove", function (e) {
    e.preventDefault();
    touchend.apply(this, [e, ref]);
  });
  // touch
  // mouse
  ref.document.addEventListener("mousedown", function (e) {

    mousedown.apply(this, [e, ref]);
  });
  ref.document.addEventListener("mouseup", function (e) {
 
    mouseup.apply(this, [e, ref]);
  });
  ref.document.addEventListener("mousemove", function (e) {

    mousemove.apply(this, [e, ref]);
  });
  // mouse
};

const init = () => {
  dnd(window, document);
  // console.log("dnd is loaded", window.location.pathname);

  // function parse(text) {
  //   let doc = new DOMParser().parseFromString(text, "text/html");
  //   if (doc.head.children[0]) return doc.head.children[0];
  //   else return doc.body.children[0];
  // }
};

window.addEventListener("load", () => {
  init();
  dndConfig();
});

const initFunction = function ({ target, onDnd, beforeDndSuccess }) {
  if (typeof beforeDndSuccess == "function")
    beforeDndSuccessCallback = beforeDndSuccess;

  initFunctionState.push({ target, onDnd });
};

const initElement = function ({
  target,
  dropable,
  draggable,
  cloneable,
  handle,
  group,
  exclude,
  beforeDndSuccess,
}) {
  try {
    if (typeof beforeDndSuccess == "function")
      beforeDndSuccessCallback = beforeDndSuccess;
    if (group) target.setHiddenAttribute(vars.group_name, group);

    if (exclude) {
      try {
        let excludeEls = target.querySelectorAll(exclude);
        excludeEls.forEach((el) => {
          el.setHiddenAttribute(vars.exclude, "true");
        });
      } catch (err) {
        if (err instanceof HTMLElement) {
          let error = "Dnd Sortable: exclude must be valid selector";
          console.error(error);
        }
        throw err;
      }
    }

    if (dropable)
      target.querySelectorAll(dropable).forEach((el) => {
        el.setHiddenAttribute(vars.droppable, "true");
      });
    if (draggable)
      target.querySelectorAll(draggable).forEach((el) => {
        // el.style.touchAction = 'none'
        el.setHiddenAttribute(vars.draggable, "true");
      });

    if (cloneable)
      target.querySelectorAll(cloneable).forEach((el) => {
        // el.style.touchAction = 'none'
        el.setHiddenAttribute(vars.cloneable, "true");
      });
  } catch (err) {
    if (err instanceof DOMException) {
      let error = "Dnd Sortable: handle must be a valid selector";
      console.error(error);
      throw err;
    } else throw err;
  }
};

function addNestedAttribute(el, cloneable) {
  if (!el.children.length) return;
  Array.from(el.children).forEach((el) => {
    addNestedAttribute(el);
    el.setHiddenAttribute(vars.exclude, "true");
    // el.style.touchAction = 'none'
    el.setHiddenAttribute(vars.draggable, "true");
    if (cloneable) el.setHiddenAttribute(vars.cloneable, "true");
  });
}

const initContainer = function ({
  target,
  cloneable = false,
  nested = false,
  handle,
  group,
  exclude,
}) {
  if (group) target.setHiddenAttribute(vars.group_name, group);
  if (exclude) {
    try {
      let excludeEls = target.querySelectorAll(exclude);
      excludeEls.forEach((el) => {
        el.setHiddenAttribute(vars.exclude, "true");
      });
    } catch (err) {
      if (err instanceof DOMException) {
        let error = "Dnd Sortable: exclude must be valid selector";
        console.error(error);
        throw error;
      } else throw err;
    }
  }

  if (!target.tagName) {
    let error = "Dnd Sortable: Please provide a valid element";
    console.error(error);
    throw error;
  }

  if (typeof cloneable != "boolean") {
    let error = "Dnd Sortable: please provide valid data type for cloneable";
    console.error(error);
    throw error;
  }

  if (typeof nested != "boolean") {
    let error = "Dnd Sortable: please provide valid data type for nested";
    console.error(error);
    throw error;
  }

  if (nested) {
    addNestedAttribute(target, cloneable);
  } else {
    target.setHiddenAttribute(vars.droppable, "true");

    if (target.children.length)
      Array.from(target.children).forEach((el) => {
        if (cloneable) {
          // el.style.touchAction = 'none'
          el.setHiddenAttribute(vars.cloneable, "true");
        } else {
          // el.style.touchAction = 'none'
          el.setHiddenAttribute(vars.draggable, "true");
        }
        try {
          let handleEls = el.querySelectorAll(handle);
          if (handle && handleEls.length) {
            // el.style.touchAction = 'none'
            el.setHiddenAttribute(vars.draggable, "true");
            handleEls.forEach((el) => {
              // el.style.touchAction = 'none'
              el.setHiddenAttribute(vars.draggable, "true");
            });
          }
        } catch (err) {
          if (err instanceof DOMException) {
            let error = "Dnd Sortable: handle must be a valid selector";
            console.error(error);
            throw error;
          } else throw err;
        }
      });
  }
};

window.CoCreateDnd = {
  initContainer,
  initElement,
  initFunction,
  init,
  initIframe,
};
