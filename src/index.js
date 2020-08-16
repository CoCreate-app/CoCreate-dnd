import './util/iframe';
import { dropMarker, boxMarker, boxMarkerTooltip, getCoc, ghostEffect, getGroupName, parse, getCocs,distanceToChild, autoScroller } from './util/common'

import VirtualDnd from './virtualDnd';
import './util/onClickLeftEvent';
import { droppable, draggable, selectable, hoverable, name, cloneable, data_insert_html } from './util/variables.js'

 let ref = { x: 0, y: 0, window, document, isIframe: false, }

export default function dnd(window, document, options) {
  console.log('dnd is loading', window.location.pathname)
   
  options = Object.assign({
    scroller: new autoScroller(),
    tagNameTooltip: new boxMarkerTooltip((el) => {
      let name = el.getAttribute(name);
      return name ? name : false;
    }, window),

    myDropMarker: new dropMarker(),

    hoverBoxMarker: new boxMarker("CoC-hovered", 1),

    selectBoxMarker: new boxMarker("CoC-selected", 2, {
      onRemove: (lastEl) => {
        // console.log({
        //   comment: 'onUnselect',
        //   obj: cssPath(lastEl),
        //   method: 'removeAttribute',
        // });

        lastEl.removeAttribute('data-selected_users')
      },
      onAdd: (el) => {
        // console.log({
        //   comment: 'onSelect',
        //   obj: cssPath(el),
        //   method: 'setAttribute',
        //   value: ['id']
        // })
        el.setAttribute('data-selected_users', 'id')
      }
    })

  }, options)
  // weird bug: dropMarker override the imported dropMarker in the above
  let { myDropMarker, selectBoxMarker, hoverBoxMarker, tagNameTooltip, scroller } = options;
  let isDraging = false;
  let consolePrintedEl = null; // dev only
  //// defining events
    let isActive = undefined;
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
    if (ghost)
      ghost.hide(data.ref)

  })
  dnd.on('dragOver', (data) => {
    myDropMarker.draw(data.el, data.closestEl, data.orientation, !data.hasChild, data.ref);
    hoverBoxMarker.draw(data.el)
    tagNameTooltip.draw(data.el, data.ref)

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
    let groupResult = getGroupName(el)
    startGroup = groupResult[1];


    ref.document.body.style.cursor = 'crosshair !important'


    isDraging = true;
    hoverBoxMarker.hide();
    tagNameTooltip.hide();
    dnd.dragStart(e, el, null, ref, att);
  }

  function end(e, ref) {
    ref.document.body.style.cursor = ''

    dnd.dragEnd(e);
    myDropMarker.hide();
    hoverBoxMarker.hide();
    tagNameTooltip.hide();
        isActive = false;
    scroller.deactivateScroll()
    isDraging = false;

  }

  function move({ x, y, target }, ref, stopScroll) {
  


    if( isDraging )
    {
      if (ghost)
      ghost.draw({x,y,target}, ref)
      
      let [groupEl, groupname] = getGroupName(target);
      if ( startGroup &&  groupname && startGroup !== groupname )
        do{
          let groupResult = getGroupName(groupEl);
          if(!groupResult[0]) return; // or return
          groupEl = groupResult[0].parentElement;
          groupname = groupResult[1];
          if ( startGroup === groupname ){
             target = groupResult[0];
             break;
          }
          
        }while(true)
    }
    else
    {
      if (ghost)
        ghost.hide(ref)
      return;
    }

    if (!target) return; // it's out of iframe if this is multi frame
    
    let onEl = target; // dev
    let el = getCoc(target, droppable);
    // if (consolePrintedEl != target) { // dev
    //   // dev
    //   console.log("you are on: \n", onEl, "\nDroping in: \n", el);
    //   consolePrintedEl = el;
    // }

    if (!el || !isDraging) return;



    if(!stopScroll)
    {
      
      scroller.calculateScroll({
        x,y,element: el.parentElement, onMouseScrollMove: (e)=> move(e,  ref, true)
      })
      
    }
    scroller.update(x,y)




    // todo:
    
    dnd.dragOver({ x, y, target: el }, el, ref)

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


  })


}


function dndReady(document) {
  // disable native drag
  document.addEventListener('dragstart', (e) => {
    e.preventDefault();
    return false;
  })

  // disable selection
  document.addEventListener('selectstart', (e) => {
    let result = getCocs(e.target, [draggable, cloneable])
    if (result[0]) e.preventDefault();
  })
}


function wrapper(func, ref) {
  return function(e) {
    func.apply(this, [e, ref])
  }
}


window.initdnd = () => {


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
    iframes: Object.values(window.iframes.guests).map(o => o.frame)
  })
  console.log('dnd is loaded', window.location.pathname)

  function parse(text) {
    let doc = new DOMParser().parseFromString(text, 'text/html');
    if (doc.head.children[0])
      return doc.head.children[0];
    else
      return doc.body.children[0];
  }


  CoCreateSocket.listen('dndNewElement', function(data) {
    // resolving the element_id to real element in the clinet
    console.log('raw object recieved: ', data.target, data.value[1], window.location.pathname)
    data.target = document.querySelector(`[data-element_id=${data.target}]`);

    let newElement = parse(data.value[1]);
    if (data.target.classList.contains('vdom-item') && window.vdomObject)
      data.value[1] = window.vdomObject.renderNew([newElement]);
    else
      data.value[1] = newElement;

    console.log('with object: ', data, window.location.pathname)
    // passing it to domEditor
    domEditor(data);
  })

};

window.addEventListener('load', () => {
  window.initdnd()
});
