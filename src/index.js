/*global HTMLElement*/
import "./collaboration.js"
import dndConfig from "./dnd-config.js"
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
 initFunctionState
} from "./util/common";

import VirtualDnd from "./virtualDnd";
import "./util/onClickLeftEvent";
import * as vars from "./util/variables.js";



let ref = { x: 0, y: 0, window, document, isIframe: false };
let beforeDndSuccessCallback;
function beforeDndSuccess(){
  if(beforeDndSuccessCallback)
  return beforeDndSuccessCallback.apply(null, arguments)
  return {}
}
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

  dndReady(document);

  let dnd = new VirtualDnd(beforeDndSuccess);
  let ghost;
  dnd.on("dragStart", (data) => {
    myDropMarker.hide();
    ghost = new ghostEffect(data.e ,data.el, { document, window });
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
    
     if(!Array.isArray(r)) return;  
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
        let hasHandle =  el.getAnyAttribute(vars.handleable)
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
    if( !isDraging ) return;
    
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

  let touchstart = (e, ref) => {
    // console.log("touch start");

    start(e,ref);
  };
  let touchend = (e, ref) => {

    // console.log("touch end");
    end(e,ref);
  };
  let touchmove = (e, ref) => {
    // console.log("host touch move");

   
    let touch = e.touches[0];
    let x = touch.clientX;
    let y = touch.clientY;
    let el = ref.document.elementFromPoint(x, y);
    if (!el) return; // it's out of iframe

    // sending object representing an event data
    move({ x, y, target: el, isTouch: true }, ref);
  };
  let mousedown = (e, ref) => {
    // console.log("mouse down", e);

    if (e.which != 1) return;

    start(e, ref);
  };
  let mouseup = (e, ref) => {
    // console.log("mouse up", e);
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


    ref.document.addEventListener("CoCreateHtmlTags-rendered", init);
    init();
    function init() {
      dndReady(ref.document);
      let callbacks = {
        touchStart: touchstart,
        touchend: touchend,
        touchmove: touchmove,
        mousedown: mousedown,
        mouseup: mouseup,
        mousemove: mousemove,
      };

      function addNewListener(eventName) {
        ref.document.body.removeEventListener(eventName, callbacks[eventName]);
        callbacks[eventName] = wrapper(callbacks[eventName], ref);
        ref.document.body.addEventListener(eventName, callbacks[eventName]);
      }

      addNewListener("touchStart");
      addNewListener("touchend");
      addNewListener("touchmove");

      addNewListener("mousedown");
      addNewListener("mouseup");
      addNewListener("mousemove");
    }
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
    let r = getCocs(e.target, [vars.draggable, vars.cloneable]);
    if(!Array.isArray(r)) return;
    e.preventDefault();
  });
}

function wrapper(func, ref) {
  return function (e) {

    func.apply(this, [e, ref]);
  };
}

window.init = () => {
    if (!document.querySelector('#dnd-style')) {
      let dndStyle = document.createElement('style');
      dndStyle.id = "dnd-style";
      dndStyle.innerHTML = `    /* dnd specic */
       [data-draggable="true"], [data-cloneable="true"]  {
         touch-action: none;
       }
      /* dnd specic */`
      document.head.append(dndStyle)
    }


  // only run if it's the host but not iframe
  // if (window.parent !== window)
  //   return;
    

  dnd(window, document, {
    iframes: Object.values(window.iframes.guests).map((o) => o.frame),
  });
  // console.log("dnd is loaded", window.location.pathname);

  function parse(text) {
    let doc = new DOMParser().parseFromString(text, "text/html");
    if (doc.head.children[0]) return doc.head.children[0];
    else return doc.body.children[0];
  }
};

window.addEventListener("load", () => {
  window.init();
  dndConfig()
});

window.initFunction = function ({
  target,
  onDnd,
  beforeDndSuccess,
}) {
  if (typeof beforeDndSuccess == "function")
    beforeDndSuccessCallback = beforeDndSuccess;

  initFunctionState.push({ target, onDnd });
};

window.initElement = function ({
  target,
  dropable,
  draggable,
  cloneable,
  handle,
  group,
  exclude,
  beforeDndSuccess
}) {
  try {
    if(typeof beforeDndSuccess == 'function')
      beforeDndSuccessCallback = beforeDndSuccess;
    if (group) target.setHiddenAttribute(vars.group_name, group)

    if (exclude) {
      try {
        let excludeEls = target.querySelectorAll(exclude);
        excludeEls.forEach((el) => {
          el.setHiddenAttribute(vars.exclude, 'true')
          
        });
      } catch (err) {
        if (err instanceof HTMLElement) {
          let error = "Dnd Sortable: exclude must be valid selector";
          console.error(error);
        }
        throw err;
      }
    }

    if (dropable )
      target.querySelectorAll(dropable).forEach((el) => {
            el.setHiddenAttribute(vars.droppable, 'true')

      });
    if (draggable)
      target.querySelectorAll(draggable).forEach((el) => {
          // el.style.touchAction = 'none'
          el.setHiddenAttribute(vars.draggable, 'true')
  
      });

    if (cloneable)
      target.querySelectorAll(cloneable).forEach((el) => {
          // el.style.touchAction = 'none'
          el.setHiddenAttribute(vars.cloneable, 'true')
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
    el.setHiddenAttribute(vars.exclude, 'true')
    // el.style.touchAction = 'none'
    el.setHiddenAttribute(vars.draggable, 'true')
    if (cloneable) el.setHiddenAttribute(vars.cloneable, 'true')
  });
}


window.initContainer = function ({
  target,
  cloneable = false,
  nested = false,
  handle,
  group,
  exclude,
}) {
  if (group)  target.setHiddenAttribute(vars.group_name, group)
  if (exclude) {
    try {
      let excludeEls = target.querySelectorAll(exclude);
      excludeEls.forEach((el) => {
        el.setHiddenAttribute(vars.exclude, 'true')
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
       target.setHiddenAttribute(vars.droppable, 'true')

    if (target.children.length)
      Array.from(target.children).forEach((el) => {
        if (cloneable) 
        {
          // el.style.touchAction = 'none'
          el.setHiddenAttribute(vars.cloneable, 'true')
        }
        else {
          // el.style.touchAction = 'none'
          el.setHiddenAttribute(vars.draggable, 'true') 
        }
        try {
          let handleEls = el.querySelectorAll(handle);
          if (handle && handleEls.length) {
            // el.style.touchAction = 'none'
            el.setHiddenAttribute(vars.draggable, 'true')
            handleEls.forEach((el) => {
              // el.style.touchAction = 'none'
              el.setHiddenAttribute(vars.draggable, 'true')
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
