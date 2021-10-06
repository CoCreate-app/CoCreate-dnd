import VirtualDnd from "./dnd";
import * as vars from "./util/variables.js";
import {dropMarker} from "./util/dropMarker.js";
import {ghostEffect} from "./util/ghostEffect.js";
import {autoScroll} from "./util/autoScroll.js";
import {hasSelection} from '@cocreate/selection';
import {checkElementConfig} from '@cocreate/element-config';

let dragTimeout;
let initFunctions = [];

function initEvents(wnd){
	wnd.document.addEventListener("dragstart", (e) => {
		e.preventDefault();
		return false;
	});

	wnd.document.addEventListener("touchstart", startEvent, { passive: false });
	wnd.document.addEventListener("touchmove", moveEvent, { passive: false });
	wnd.document.addEventListener("touchend", endEvent, { passive: false });
 	wnd.document.addEventListener("mousedown", startEvent);
	wnd.document.addEventListener("mousemove", moveEvent);
	wnd.document.addEventListener("mouseup", endEvent);
}

function startEvent(e) {
	if(e.which > 1) return;
    dragTimeout = setTimeout(() => {
		if(hasSelection(e.target)) {
			return;
		}
		else 
	    	startDnd(e);
    }, 200);
    
    // If preventDefault textselection does not work... If no preventDefault Iframe to Iframe does not work
   	// e.preventDefault();
}

function moveEvent(e) {
	// if(e.which > 1) return;
	if (e.target.getAttribute('dragging') == 'true')
	// e.target.ownerDocument.body.style.touchAction = "none"
		e.preventDefault();
	move(e);

}

function endEvent(e) {
	if(e.which > 1) return;
	// e.target.ownerDocument.body.style.touchAction = "auto"
	endDnd(e);
	clearTimeout(dragTimeout);
	// e.preventDefault();
}

let startGroup;
let isDraging = false;

function isDnd(el, options) {
    do {
		let element;

    	if (!options){
    		options = [vars.draggable, vars.cloneable, vars.dragHandle]
    	}
    	else options = [options]
    	for (let option of options) {
			let isOption;
			if (el.dnd) isOption = el.dnd[option];
			if ((el.hasAttribute(option) && el.getAttribute(option) != 'false') || isOption) {
				return [el, option];
			}
			if (checkElementConfig(el, [option])) {
				return [el, option];
			}
			element = checkInitFunctions(el, [option]);
    	}
    	if(element)
			if (Array.isArray(element)) return element;
    	el = el.parentElement;
    } while (el);
}

function checkInitFunctions(element, request) {
    for (let func of initFunctions) {
      if (func.onDrag) {
	      if (func.targetDocument.contains(element)) {
	        let r = func.onDrag(element, request);
	        if (Array.isArray(r)) return r;
	      }
      }
    }
}

function startDnd(e) {
	let wnd = e.view;
	let element = isDnd(e.target);
	if (!element) return;
	let	[el, att] = element;

	switch(att) {
		case vars.cloneable:
			let html = el.getAttribute(vars.cloneableHtml);
			if(html) {
				el = parse(html);
				if(!el) return;
			}
			else el = el.cloneNode(true);
			break;
		case vars.draggable:
			let hasHandle = false;
			if(hasHandle) return;
			break;

		default:
			[el, att] = isDnd(e.target, vars.draggable);
	}

	// get group
	let groupResult = getGroupName(el);
	startGroup = groupResult[1];

	wnd.document.body.style.cursor = "crosshair !important";

	isDraging = true;

	dnd.dragStart(e, el, null, wnd, att);
}

function move(e, stopScroll) {
	let	wnd = e.view;
	let x, y, target;
	if (e.touches){
		let touch = e.touches[0];
		x = touch.clientX;
		y = touch.clientY;
		target = e.target.ownerDocument.elementFromPoint(x, y);
		if (!target)
			target = e.target;
	} else {
		x = e.x;
		y = e.y;
		target = e.target;
	}
	
	if(!isDraging) return;
	var selection = wnd.document.getSelection();
	selection.removeAllRanges();
	if(ghost) ghost.draw({ x, y }, wnd);
	scroller.update(x, y);
	if(isDraging) {
		// skip group names
		let [groupEl, groupname] = getGroupName(target);
		if(startGroup && groupname) {
			if(startGroup !== groupname) {
				do {
					let groupResult = getGroupName(groupEl);
					if(!groupResult[0]) return; // or return
					groupEl = groupResult[0].parentElement;
					groupname = groupResult[1];
					if(startGroup === groupname) {
						target = groupResult[0];
						break;
					}
				} while (true);

			}

		}
		else if(startGroup !== groupname)
			return;
	}
	else {
		if(ghost) ghost.hide();
	}

	if(!target) return;

	let element = isDnd(target, vars.droppable);
	if (!element) return;
	let el = element[0];

	if(!stopScroll) {
		scroller.calculateScroll({
			x,
			y,
			element: el.parentElement ? el.parentElement : el,
			onMouseScrollMove: (e) => move(e, wnd, true),
		});
	}
	dnd.dragOver({ x, y, target: el }, el, wnd);
}

function endDnd(e) {
	let wnd = e.view;
	wnd.document.body.style.cursor = "";
	isDraging = false;
	dnd.dragEnd(e);
	myDropMarker.hide();
	scroller.deactivateScroll();
}

// function beforeDndSuccess() {
// 	if(beforeDndSuccessCallback)
// 		return beforeDndSuccessCallback.apply(null, arguments);
// 	return {};
// }

// function beforeDndSuccess(detail) {
//     for (let state of initFunctionState) {
// 		// if(state.target.contains(element)) {
// 			let result = state.onDndSuccess(detail);
// 			return result;
// 		// }
//     }
// }


let options = {
	scroller: new autoScroll({ speed: 4, threshold: 3 }),
	myDropMarker: new dropMarker(),
};
let { myDropMarker, scroller } = options;

let dnd = new VirtualDnd();
let ghost;

dnd.on("dragStart", (data) => {
	myDropMarker.hide();
	ghost = new ghostEffect(data.e, data.el, { window, document });
	ghost.start();
});

dnd.on("dragEnd", (data) => {
	myDropMarker.hide();
	if(ghost) ghost.hide(data.wnd);
});
dnd.on("dragOver", (data) => {
	// it will always run when mouse or touch moves
	myDropMarker.draw(
		data.el,
		data.closestEl,
		data.orientation, !!data.hasChild,
		data.wnd
	);
});

function getGroupName(el) {
  if (!el.tagName) el = el.parentElement;
  do {
    let groupName = el.getAttribute(vars.groupName);
    if (!groupName && el.dnd) {
    	groupName = el.dnd.groupName;
    }
    if (groupName) return [el, groupName];
    el = el.parentElement;
    if (!el) return [null, undefined];
  } while (true);
}

/*global DOMParser*/
function parse(text) {
  let doc = new DOMParser().parseFromString(text, "text/html");
  if (doc.head.children[0]) return doc.head.children[0];
  else return doc.body.children[0];
}

export { initEvents, initFunctions};
