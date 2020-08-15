import './util/iframe';
import { dropMarker, boxMarker, boxMarkerTooltip, getCoc, ghostEffect, getGroupName, parse, getCocs,distanceToChild } from './util/common'

import VirtualDnd from './virtualDnd';
import './util/onClickLeftEvent';
import { droppable, draggable, selectable, hoverable, name, cloneable, data_insert_html } from './util/variables.js'

 let ref = { x: 0, y: 0, window, document, isIframe: false, }
  let lastScrollingElement;
  let onElement;

  let mouse;
  let speed = 12;
   let interval;
    function activateScroll(parent, orientation, callback)
    {
       console.log('scrolling')
      lastScrollingElement = parent;
      interval = setInterval(()=>{
        switch(orientation)
        {
          case 'top':
          parent.scrollBy(0,-speed);
          break;
          case 'bottom':
          parent.scrollBy(0,speed);
          break;
          case 'left':
          parent.scrollBy(-speed,0);
          break;
          case 'right':
          parent.scrollBy(speed,0);
          break;
            
        }

   
        onElement = document.elementFromPoint(mouse.x, mouse.y)
        if(onElement  )
        {
          callback({x:mouse.x, y:mouse.y, target:onElement});
         
        }
        
        
      }, 2)
       
    }
    
    function deactivateScroll(){

      console.log('scrolling disabled')
      clearInterval(interval);
    }


export default function dnd(window, document, options) {
  console.log('dnd is loading', window.location.pathname)
  options = Object.assign({

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
  let { myDropMarker, selectBoxMarker, hoverBoxMarker, tagNameTooltip } = options;
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
    if (ghost)
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
    dnd.dragStart(e, el, null, ref, att);
  }

  function end(e, ref) {
    ref.document.body.style.cursor = ''

    dnd.dragEnd(e);
    myDropMarker.hide();
    hoverBoxMarker.hide();
    tagNameTooltip.hide();
        isActive = false;
    deactivateScroll()
    isDraging = false;

  }

    
  function move({ x, y, target }, ref, stopScroll) {

    if (startGroup && startGroup != getGroupName(target)) return;
    if (!target || !isDraging) return; // it's out of iframe
    let onEl = target; // dev
    let el = getCoc(target, droppable);
    // if (consolePrintedEl != target) { // dev
    //   // dev
    //   console.log("you are on: \n", onEl, "\nDroping in: \n", el);
    //   consolePrintedEl = el;
    // }

    // check if element parent has scroll and scroll it
      
    let parent = el.parentElement;
    let hasHorizontalScrollbar = parent.scrollWidth > parent.clientWidth;
    let hasVerticalScrollbar = parent.scrollHeight > parent.clientHeight;
    
   
if(!stopScroll)
{
  
    let horScrollThreshold = parent.clientWidth / 4;
    let verScrollThreshold = parent.clientHeight / 4;
    
    if((hasVerticalScrollbar || hasHorizontalScrollbar) )
    {
    
      mouse = {x,y}
     let [orientation, closestDistance] = distanceToChild([x,y], parent);
     let condition;
     switch(orientation)
     {
       case 'top':
       case 'bottom':
         speed = ( verScrollThreshold / closestDistance)  * 4;
         condition = closestDistance < verScrollThreshold;
         break;
       case 'left':
       case 'right':
         speed = ( horScrollThreshold / closestDistance)  * 4;
           condition = closestDistance < horScrollThreshold;
         break;
     }
    

      
      // let scrollWidth = parent.offsetWidth - parent.clientWidth; // is scroll active
     if(condition)
     {
          if(!isActive)
          {
            isActive= true; 
            activateScroll(parent, orientation, (e)=> move(e,  ref, true))
          }
          else if(isActive && lastScrollingElement !== parent)
          {
            deactivateScroll()
            activateScroll(parent, orientation, (e)=> move(e,  ref, true))
          }
        
     }
     else if(isActive)
     {
       isActive = false;
       deactivateScroll()
     }
      
    }
   
    
}
   





    // todo:
    if (!el || !isDraging) return;
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
  document.addEventListener('dragstart', () => {
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

let allimages = document.querySelectorAll('img');
allimages.forEach(el =>{ el.ondragstart = function() { return false; }} );
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


  // init elements js
  // dom.element('default', {
  //   selector: ['.sortable *, .sortable'],
  //   draggable: 'true',
  //   droppable: 'true',
  //   hoverable: 'true',
  //   selectable: 'true',
  //   editable: 'true',
  // });

  // dom.element('default', {
  //   selector: ['.dnd, .dnd *'],
  // });
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
// init
// let canvasWindow = document.getElementById('canvas').contentWindow;
// console.log('zzzzzzzzzzzzzzzz', window.location.pathname, canvasWindow)
// canvasWindow.addEventListener('load', )
window.addEventListener('load', () => {


  window.initdnd()

});
