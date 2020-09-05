/*global HTMLElement*/
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
  context,
} from "./util/common";

import VirtualDnd from "./virtualDnd";
import "./util/onClickLeftEvent";
import * as vars from "./util/variables.js";

let ref = { x: 0, y: 0, window, document, isIframe: false };

export default function dnd(window, document, options) {
  console.log("dnd is loading", window.location.pathname);

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

  dndReady(document);

  let dnd = new VirtualDnd();
  let ghost;
  dnd.on("dragStart", (data) => {
    myDropMarker.hide();
    ghost = new ghostEffect(data.el, { document });
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
    let [el, att] = getCocs(e.target, [
      vars.cloneable,
      vars.draggable,
      vars.handleable,
    ]);

    if (!el) return;

    switch (att) {
      case vars.cloneable:
        let html = el.getAttribute(vars.data_insert_html);
        if (html) {
          el = parse(html);
          if (!el) return;
        } else el = el.cloneNode(true);
        break;
      case vars.draggable:
        let hasHandle = context.getContext(el, vars.handleable);
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

  function move({ x, y, target }, ref, stopScroll) {
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

    if (!el || !isDraging) return;

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

  let touchstart = (e, ref) => {
    console.log("touch start");
    start(e);
  };
  let touchend = (e, ref) => {
    console.log("touch end");
    end(e);
  };
  let touchmove = (e, ref) => {
    console.log("host touch move");

    let touch = e.touches[0];
    let x = touch.clientX;
    let y = touch.clientY;
    let el = document.elementFromPoint(x, y);
    if (!el) return; // it's out of iframe

    // sending object representing an event data
    move({ x, y, target: el });
  };
  let mousedown = (e, ref) => {
    console.log("mouse down", e);

    if (e.which != 1) return;

    start(e, ref);
  };
  let mouseup = (e, ref) => {
    console.log("mouse up", e);
    // todo: why would we check for hoverable and what do we do whith this?
    // let el = getCoc(e.target, hoverable)
    // if (!el) return;
    //

    if (e.which != 1) return;

    end(e, ref);
  };
  let mousemove = (e, ref) => {
    move(e, ref);
  };
  // let CoCreateClickLeft = (e) => {
  //   // todo: not working!?
  //   let el = getCoc(e.target, selectable);
  //   if (!el) return;
  // };

  // touch
  document.addEventListener("touchstart", wrapper(touchstart, ref));
  document.addEventListener("touchend", wrapper(touchend, ref));
  document.addEventListener("touchmove", wrapper(touchmove, ref));
  // touch
  // mouse
  document.addEventListener("mousedown", wrapper(mousedown, ref));
  document.addEventListener("mouseup", wrapper(mouseup, ref));
  document.addEventListener("mousemove", wrapper(mousemove, ref));
  // mouse
  // listen for click
  // document.addEventListener("CoCreateClickLeft", CoCreateClickLeft);

  options.iframes.forEach((frame) => {
    let rect = frame.getBoundingClientRect();
    let ref = {
      x: rect.left,
      y: rect.top,
      frame,
      window: frame.contentWindow,
      document: frame.contentDocument,
      isIframe: true,
    };
    dndReady(ref.document);

    //touch
    ref.document.addEventListener("touchstart", wrapper(touchstart, ref));
    ref.document.addEventListener("touchend", wrapper(touchend, ref));
    ref.document.addEventListener("touchmove", wrapper(touchmove, ref));
    // touch

    // mouse
    ref.document.addEventListener("mousedown", wrapper(mousedown, ref));
    ref.document.addEventListener("mouseup", wrapper(mouseup, ref));
    ref.document.addEventListener("mousemove", wrapper(mousemove, ref));
    // mouse

    // listen for click
    ref.document.addEventListener(
      "CoCreateClickLeft",
      wrapper(CoCreateClickLeft, ref)
    );
  });
}

function dndReady(document) {
  // disable native drag
  document.addEventListener("dragstart", (e) => {
    e.preventDefault();
    return false;
  });

  // disable selection
  document.addEventListener("selectstart", (e) => {
    let result = getCocs(e.target, [vars.draggable, vars.cloneable]);
    if (result) e.preventDefault();
  });
}

function wrapper(func, ref) {
  return function (e) {
    func.apply(this, [e, ref]);
  };
}

window.init = () => {
  //   if (!document.querySelector('#dnd-style')) {
  //     let dndStyle = document.createElement('style');
  //     dndStyle.id = "dnd-style";
  //     dndStyle.innerHTML = `    /* dnd specic */

  //     [data-CoC-cloneable],
  //     [data-CoC-draggable] {
  //       cursor: pointer;
  //     }

  //     [data-CoC-cloneable],
  //     [data-CoC-draggable],
  //     [data-CoC-droppable],
  //     [data-CoC-hoverable] {
  //       outline: 1px dashed gray;
  //     }

  //     *[CoC-hovered=true] {
  //       outline: 2px solid blue
  //     }

  //     /* must be defined after CoC-hovered because of css specificity to show selected with higher priority */

  //     *[CoC-selected=true] {
  //       outline: 3px solid green;
  //     }

  //     *[CoC-dragging=true] {
  //       outline: 3px solid red;
  //     }

  //     /* dnd specic */`
  //     document.head.append(dndStyle)
  //   }

  // only run if it's the host but not iframe
  // if (window.location === window.parent.location)

  dnd(window, document, {
    iframes: Object.values(window.iframes.guests).map((o) => o.frame),
  });
  console.log("dnd is loaded", window.location.pathname);

  function parse(text) {
    let doc = new DOMParser().parseFromString(text, "text/html");
    if (doc.head.children[0]) return doc.head.children[0];
    else return doc.body.children[0];
  }
};

window.addEventListener("load", () => {
  window.init();
});

window.initDnd = function ({ target, drop, drag, clone, handle, group }) {
  if (group) context.setContext(target, vars.group_name, group);

  if (drop)
    target.querySelectorAll(drop).forEach((el) => {
      context.setContext(el, vars.droppable, true);
    });
  if (drag)
    target.querySelectorAll(drag).forEach((el) => {
      context.setContext(el, vars.draggable, true);
    });

  if (clone)
    target.querySelectorAll(clone).forEach((el) => {
      context.setContext(el, vars.cloneable, true);
    });
};

function addNestedAttribute(el, cloneable) {
  if (!el.children.length) return;
  Array.from(el.children).forEach((el) => {
    addNestedAttribute(el);
    context.setContext(el, vars.droppable, true);
    context.setContext(el, vars.draggable, true);
    if (cloneable) context.setContext(el, vars.cloneable, true);
  });
}

window.initSortable = function ({
  target,
  cloneable = false,
  nested = false,
  handle,
  group,
}) {
  if (group) context.setContext(target, vars.group_name, group);
  if (!(target instanceof HTMLElement)) {
    let error = "Dnd Sortable: Please provide a valid element";
    throw error;
    console.error(error);
  }

  if (typeof cloneable != "boolean") {
    let error = "Dnd Sortable: please provide valid data type for cloneable";
    throw error;
    console.error(error);
  }

  if (typeof nested != "boolean") {
    let error = "Dnd Sortable: please provide valid data type for nested";
    throw error;
    console.error(error);
  }

  if (nested) {
    addNestedAttribute(target, cloneable);
  } else {
    context.setContext(target, vars.droppable, true);
    if (target.children.length)
      Array.from(target.children).forEach((el) => {
        context.setContext(el, vars.draggable, true);
        if (cloneable) context.setContext(el, vars.cloneable, true);
        try {
          let handleEls = el.querySelectorAll(handle);
          if (handle && handleEls.length) {
            context.setContext(el, vars.handleable, true);
            handleEls.forEach((el) => {
              context.setContext(el, vars.handleable, true);
            });
          }
        } catch (err) {
          if (err instanceof DOMException) {
            let error = "Dnd Sortable: handle must be a valid selector";
            console.error(error);
            throw error;
          }
        }
      });
  }
};
