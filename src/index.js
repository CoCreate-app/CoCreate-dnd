import observer from '@cocreate/observer';
import "./collaboration.js";
import VirtualDnd from "./virtualDnd";
import * as vars from "./util/variables.js";
import {dropMarker} from "./util/dropMarker.js";
import {ghostEffect} from "./util/ghostEffect.js";
import {autoScroll} from "./util/autoScroll.js";
import './index.css';

import text from '@cocreate/text';

let windows = new Map();
let dragTimeout;
let beforeDndSuccessCallback;
let initFunctionState = [];

function initDnd() {
	if(window.parent !== window) return;
	let iframes = document.querySelectorAll("iframe");
	initIframes(iframes);
	let sortables = document.querySelectorAll(".sortable");
	initElements(sortables);
	let cloneables = document.querySelectorAll(".cloneable");
	initElements(cloneables, true)
}


function initIframes(iframes) {
  for (let iframe of iframes)
    initIframe(iframe);
}

function initIframe(iframe) {
	let wnd = iframe.contentWindow;
	initWindow(wnd);
	
	let iframes = wnd.document.querySelectorAll("iframe")
	if (iframes) initIframes(iframes);
}

function initElements(elements, cloneable) {
  for (let el of elements)
    initElement({target: el, cloneable})
}

function initElement({
	target,
	cloneable = false,
	nested = false,
	handle,
	group,
	exclude,
}) {
	if(group) target.dnd = {groupName: group};
	if(exclude) {
		try {
			let excludeEls = target.querySelectorAll(exclude);
			excludeEls.forEach((el) => {
				el.dnd = {exclude: true};
			});
		}
		catch(err) {
			if(err instanceof DOMException) {
				let error = "Dnd Sortable: exclude must be valid selector";
				console.error(error);
				throw error;
			}
			else throw err;
		}
	}

	if(!target.tagName) {
		let error = "Dnd Sortable: Please provide a valid element";
		console.error(error);
		throw error;
	}

	if(typeof cloneable != "boolean") {
		let error = "Dnd Sortable: please provide valid data type for cloneable";
		console.error(error);
		throw error;
	}

	if(typeof nested != "boolean") {
		let error = "Dnd Sortable: please provide valid data type for nested";
		console.error(error);
		throw error;
	}

	if(nested) {
		addNestedAttribute(target, cloneable);
	}
	else {
		target.dnd = {droppable: true};
		console.log('dnd loaded target child', target.children)
		if(target.children.length)
			Array.from(target.children).forEach((el) => {
				if(cloneable) {
					el.dnd = {cloneable: true};
				}
				else {
					el.dnd = {draggable: true};
				}
				try {
					let handleEls = el.querySelectorAll(handle);
					if(handle && handleEls.length) {
						el.dnd = {draggable: true, handle: handleEls};
						handleEls.forEach((el) => {
							el.dnd = {draggable: true};
						});
					}
				}
				catch(err) {
					if(err instanceof DOMException) {
						let error = "Dnd Sortable: handle must be a valid selector";
						console.error(error);
						throw error;
					}
					else throw err;
				}
			});
	}
	initWindow(window);
}

function addNestedAttribute(el, cloneable) {
	if(!el.children.length) return;
	Array.from(el.children).forEach((el) => {
		addNestedAttribute(el);
		el.dnd = {draggable: true, exclude: true};
		if(cloneable){
			el.dnd = {cloneable: true};
		} 
	});
}

function initWindow(wnd){
	if(!windows.has(wnd.window)) {
		if(wnd.CoCreateDnd && wnd.CoCreateDnd.hasInit) return;
		initEvents(wnd);
    	windows.set(wnd);
	}
}

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
		else startDnd(e);
    }, 200);
    // If preventDefault textselection does not work... If no preventDefault Iframe to Iframe does not work
   	e.preventDefault();
}

function moveEvent(e) {
	if(e.which > 1) return;
	if (e.target.getAttribute('coc-dragging') == 'true')
		e.preventDefault();
	// e.target.ownerDocument.body.style.touchAction = "none"
	move(e);
}

function endEvent(e) {
	if(e.which > 1) return;
	// e.target.ownerDocument.body.style.touchAction = "auto"
	endDnd(e);
	clearTimeout(dragTimeout);
	// e.preventDefault();
}

function hasSelection(el) {
	let { start, end } = text.getSelections(el);
	if(start != end) {
		return true;
	}
}

let startGroup;
let isDraging = false;

function checkDnd(el, att ) {
    do {
		let element, isDraggable, isCloneable, isDroppable;
		if (el.dnd) {
	    	isCloneable = (el.dnd.cloneable)
	    	isDraggable = (el.dnd.draggable)
	    	isDroppable = (el.dnd.droppable)
    	}
    	if (att == 'droppable'){
			if ((el.hasAttribute('droppable') && el.getAttribute('droppable') != 'false') || (isDroppable)) {
				return [el, 'droppable'];
			}	
			element = checkInitFunction(el, [vars.droppable]);
    	}
    	else {
			if ((el.hasAttribute('cloneable') && el.getAttribute('cloneable') != 'false') || (isCloneable)) {
				return [el, 'cloneable'];
			}
			if ((el.hasAttribute('draggable') && el.getAttribute('draggable') != 'false') || (isDraggable)) {
				return [el, 'draggable'];
			}
			element = checkInitFunction(el, [vars.draggable, vars.cloneable, vars.handleable]);
    	}
    	if(element)
    		console.log('checkDnd: ', element);
			if (Array.isArray(element)) return element;
    	el = el.parentElement;
    } while (el);
}

function checkInitFunction(element, request) {
    for (let state of initFunctionState) {
      if (state.target.contains(element)) {
        let r = state.onDnd(element, request);
        if (Array.isArray(r)) return r;
      }
    }
}

function startDnd(e) {
	let wnd = e.view
	let	[el, att] = checkDnd(e.target);

	switch(att) {
		case vars.cloneable:
			let html = el.getAttribute(vars.data_insert_html);
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
			// el = getCoc(el, vars.draggable);
			[el, att] = checkDnd(e.target, vars.draggable);
	}

	// get group
	let groupResult = getGroupName(el);
	startGroup = groupResult[1];

	wnd.document.body.style.cursor = "crosshair !important";

	isDraging = true;

	dnd.dragStart(e, el, null, wnd, att);
}

function move(e, stopScroll) {
	let	wnd = e.view
	let x, y, target;
	if (e.touches){
		let touch = e.touches[0];
		x = touch.clientX;
		y = touch.clientY;
		target = e.target.ownerDocument.elementFromPoint(x, y)
		if (!target)
			target = e.target
			// console.log(e.currentTarget)
	} else {
		x = e.x;
		y = e.y
		target = e.target
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

	if(!target) return; // it's out of iframe if this is multi frame

	// let el = getCoc(target, vars.droppable);
	let element = checkDnd(target, vars.droppable);
	if (!element) return
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
	let wnd = e.view
	wnd.document.body.style.cursor = "";
	isDraging = false;
	dnd.dragEnd(e);
	myDropMarker.hide();
	scroller.deactivateScroll();
}

function init(params) {
	let { mode } = params;
	delete params.mode;
	if(!['function', 'element', 'container'].includes(mode))
		throw new Error('invalid mode provided');
	let funcName = 'init' + mode.charAt(0).toUpperCase() + mode.slice(1);
	exp[funcName].apply(null, [params]);
}

const initFunction = function({ target, onDnd, onDndSuccess }) {
	if(typeof onDndSuccess == "function")
		beforeDndSuccessCallback = onDndSuccess;
	initFunctionState.push({ target, onDnd });
};

function beforeDndSuccess() {
	if(beforeDndSuccessCallback)
		return beforeDndSuccessCallback.apply(null, arguments);
	return {};
}

let options = {
	scroller: new autoScroll({ speed: 4, threshold: 3 }),
	myDropMarker: new dropMarker(),
};
let { myDropMarker, scroller } = options;

let dnd = new VirtualDnd(beforeDndSuccess);
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
    let groupName = el.getAttribute(vars.group_name);
    if (!groupName && el.dnd) {
    	groupName = el.dnd.groupName;
    }
    if (groupName) return [el, groupName];
    el = el.parentElement;
    if (!el) return [null, undefined];
  } while (true);
}

function parse(text) {
  let doc = new DOMParser().parseFromString(text, "text/html");
  if (doc.head.children[0]) return doc.head.children[0];
  else return doc.body.children[0];
}

export {
	initFunction,
	// initIframe
};

let exp = {
	initFunction,
};


initDnd();

observer.init({
	name: "dndClasses",
	observe: ['addedNodes'],
	target: '.sortable, .cloneable',
	callback: mutation => {
		initElement({target: mutation.target, cloneable: mutation.target.classList.contains('cloneable')});
	},
});

observer.init({
	name: "dndAttributes",
	observe: ['addedNodes'],
	target: '[sortable], [droppable], [cloneable]',
	callback: mutation => {
		initWindow(window);
	},
});

observer.init({
	name: "dndIframe",
	observe: ['addedNodes'],
	target: 'iframe',
	callback: mutation => {
	    setTimeout(() => {
	    	initIframe(mutation.target);
	    }, 2000);
	},
});

export default { init, initIframe};
