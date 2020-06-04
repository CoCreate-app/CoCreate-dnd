import './util/iframe';
import { dropMarker, boxMarker, boxMarkerTooltip, getCoc, ghostEffect, getGroupName, parse, getCocs } from './util/common'
import selectorUtil from './util/selectorUtil';
import VirtualDnd from './virtualDnd';
import './util/onClickLeftEvent';
import { droppable, draggable, selectable, hoverable, name, cloneable, data_insert_html } from './util/variables.js'






export default function dnd(window, document, options) {

  options = Object.assign({

    tagNameTooltip: new boxMarkerTooltip((el) => {
      let name = el.getAttribute(name);
      return name ? name : el.tagName;
    }, window),

    myDropMarker: new dropMarker(),

    hoverBoxMarker: new boxMarker("CoC-hovered", 1),

    selectBoxMarker: new boxMarker("CoC-selected", 2, {
      onRemove: (lastEl) => {
        console.log({
          comment: 'onUnselect',
          obj: selectorUtil.cssPath(lastEl),
          method: 'removeAttribute',
        });

        lastEl.removeAttribute('data-selected_users')
      },
      onAdd: (el) => {
        console.log({
          comment: 'onSelect',
          obj: selectorUtil.cssPath(el),
          method: 'setAttribute',
          value: ['id']
        })
        el.setAttribute('data-selected_users', 'id')
      }
    })

  }, options)
  // weird bug: dropMarker override the imported dropMarker in the above
  let { myDropMarker, selectBoxMarker, hoverBoxMarker, tagNameTooltip } = options;
  let isDraging = false;
  let consolePrintedEl = null; // dev only
  //// defining events

  dndReady(document)

  let dnd = new VirtualDnd();
  let ghost;
  dnd.on('dragStart', (data) => {
    selectBoxMarker.hide()
    myDropMarker.hide();

    // data.ref
    ghost = new ghostEffect(data.el, { document });
    ghost.start()

  })
  dnd.on('dragEnd', (data) => {
    myDropMarker.hide()
    ghost.hide(data.ref)

  })
  dnd.on('dragOver', (data) => {
    myDropMarker.draw(data.el, data.closestEl, data.orientation, !data.hasChild, data.ref);
    hoverBoxMarker.draw(data.el)
    tagNameTooltip.draw(data.el, data.ref)
    ghost.draw(data.e, data.ref)
  })

  let startGroup;

  function start(e, ref) {


    let [el, att] = getCocs(e.target, [cloneable, draggable])

    if (!el) return;

    if (att == cloneable) {
      let html = el.getAttribute(data_insert_html);
      if (html) {
        el = parse(html);
        if (!el) return;
      }
      else
        el = el.cloneNode(true);
    }


    // get group
    startGroup = getGroupName(el)



    ref.document.body.style.cursor = 'crosshair !important'


    isDraging = true;
    hoverBoxMarker.hide();
    tagNameTooltip.hide();
    dnd.dragStart(e, el, null, ref);
  }

  function end(e, ref) {
    ref.document.body.style.cursor = ''

    dnd.dragEnd(e);
    myDropMarker.hide();
    hoverBoxMarker.hide();
    tagNameTooltip.hide();
    isDraging = false;


  }

  function move({ x, y, target }, ref) {

    if (startGroup && startGroup != getGroupName(target)) return;
    if (!target || !isDraging) return; // it's out of iframe
    let onEl = target; // dev
    if (consolePrintedEl != target) { // dev
      // dev
      console.log("you are on: \n", onEl, "\nDroping in: \n", target);
      consolePrintedEl = target;
    }

    let el = getCoc(target, droppable);
    // todo:
    if (!el || !isDraging) return;
    dnd.dragOver({ x, y }, el, ref)

  }

  let touchstart = (e, ref) => {
    console.log('touch start')
    start(e)
  };
  let touchend = (e, ref) => {

    console.log('touch end')
    end(e)

  };
  let touchmove = (e, ref) => {

    console.log('host touch move')

    let touch = e.touches[0];
    let x = touch.clientX;
    let y = touch.clientY;
    let el = document.elementFromPoint(x, y);
    if (!el) return; // it's out of iframe

    // sending object representing an event data
    move({ x, y, target: el })


  };
  let mousedown = (e, ref) => {
    console.log('mouse down', e);

    if (e.which != 1)
      return;

    start(e, ref);

  }
  let mouseup = (e, ref) => {
    console.log('mouse up', e);
    // todo: why would we check for hoverable and what do we do whith this?
    // let el = getCoc(e.target, hoverable)
    // if (!el) return;
    //

    if (e.which != 1)
      return;

    end(e, ref)


  }
  let mousemove = (e, ref) => {
    console.log('mouse over')
    let el = getCoc(e.target, hoverable);

    if (!el) {
      tagNameTooltip.hide(el);
      hoverBoxMarker.hide(el);
    }
    else {
      hoverBoxMarker.draw(el);
      tagNameTooltip.draw(el, ref);

    }

    move(e, ref)


  }
  let CoCreateClickLeft = (e) => {
    // todo: not working!?
    let el = getCoc(e.target, selectable);
    if (!el) return;
    selectBoxMarker.draw(el);

  }


  let ref = { x: 0, y: 0, window, document, isIframe: false, }
  // touch
  document.addEventListener('touchstart', wrapper(touchstart, ref))
  document.addEventListener('touchend', wrapper(touchend, ref))
  document.addEventListener('touchmove', wrapper(touchmove, ref))
  // touch
  // mouse
  document.addEventListener('mousedown', wrapper(mousedown, ref))
  document.addEventListener('mouseup', wrapper(mouseup, ref))
  document.addEventListener('mousemove', wrapper(mousemove, ref))
  // mouse
  // listen for click
  document.addEventListener('CoCreateClickLeft', CoCreateClickLeft)









  options.iframes.forEach(frame => {
    // frame.addEventListener('load', () => {
    let rect = frame.getBoundingClientRect();
    let ref = { x: rect.left, y: rect.top, frame, window: frame.contentWindow, document: frame.contentDocument, isIframe: true }
    dndReady(ref.document)

    //touch
    ref.document.addEventListener('touchstart', wrapper(touchstart, ref))
    ref.document.addEventListener('touchend', wrapper(touchend, ref))
    ref.document.addEventListener('touchmove', wrapper(touchmove, ref))
    // touch

    // mouse
    ref.document.addEventListener('mousedown', wrapper(mousedown, ref))
    ref.document.addEventListener('mouseup', wrapper(mouseup, ref))
    ref.document.addEventListener('mousemove', wrapper(mousemove, ref))
    // mouse

    // listen for click
    ref.document.addEventListener('CoCreateClickLeft', wrapper(CoCreateClickLeft, ref))

    // })
  })


}


function dndReady(document) {
  // disable native drag
  document.addEventListener('dragstart', () => {
    return false;
  })
  // disable selection
  document.addEventListener('selectstart', (e) => {
    let [el, att] = getCocs(e.target, [draggable, cloneable])
    if (el) e.preventDefault();
  })
}


function wrapper(func, ref) {
  return function(e) {
    func.apply(this, [e, ref])
  }
}


// init
window.addEventListener('load', () => {
  // only run if it's the host but not iframe
  if (window.location === window.parent.location)
    dnd(window, document, {
      iframes: Object.values(window.iframes.guests).map(o => o.frame)
    })
})
