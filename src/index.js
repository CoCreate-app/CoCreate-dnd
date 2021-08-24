import observer from '@cocreate/observer';
import "./collaboration.js";
import { getCoc, getCocs, initFunctionState }
from "./util/common";
import VirtualDnd from "./virtualDnd";
import * as vars from "./util/variables.js";
import {dropMarker} from "./util/dropMarker.js";
import {ghostEffect} from "./util/ghostEffect.js";
import {autoScroll} from "./util/autoScroll.js";
import './index.css';

import domReader from './util/domReader';
import text from '@cocreate/text';

let windows = new Map();
let dragTimeout;
let beforeDndSuccessCallback;

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
	if(group) target.setHiddenAttribute(vars.group_name, group);
	if(exclude) {
		try {
			let excludeEls = target.querySelectorAll(exclude);
			excludeEls.forEach((el) => {
				el.setHiddenAttribute(vars.exclude, "true");
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
		target.setHiddenAttribute(vars.droppable, "true");
		console.log('dnd loaded target child', target.children)
		if(target.children.length)
			Array.from(target.children).forEach((el) => {
				if(cloneable) {
					el.dnd = {cloneable: true};
					el.setHiddenAttribute(vars.cloneable, "true");
				}
				else {
					el.dnd = {draggble: true};
					el.setHiddenAttribute(vars.draggable, "true");
				}
				try {
					let handleEls = el.querySelectorAll(handle);
					if(handle && handleEls.length) {
						el.dnd = {draggble: true, handle: handleEls};
						el.setHiddenAttribute(vars.draggable, "true");
						handleEls.forEach((el) => {
							el.dnd = {draggble: true};
							el.setHiddenAttribute(vars.draggable, "true");
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
		el.setHiddenAttribute(vars.exclude, "true");
		el.setHiddenAttribute(vars.draggable, "true");
		el.dnd = {draggble: true, exclude: true};
		if(cloneable){
			el.dnd = {cloneable: true};
			el.setHiddenAttribute(vars.cloneable, "true");	
		} 
	});
}

function initWindow(wnd){
	if(!windows.has(wnd.window)) {
		domReader.register(wnd.window);
		if(wnd.CoCreateDnd && wnd.CoCreateDnd.hasInit) return;
	
		if(!wnd.document.querySelector("#dnd-style")) {
			
			let dndStyle = wnd.document.createElement("style");
			dndStyle.id = "dnd-style";
			dndStyle.innerHTML = `    /* dnd specic */
	  [draggable="true"], [cloneable="true"]  {
	    touch-action: none;
	  }
	  /* dnd specic */`;
			wnd.document.head.append(dndStyle);
		}
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
// let isDragging = false;
function startEvent(e) {
	if(e.which > 1) return;
    dragTimeout = setTimeout(() => {
		if(hasSelection(e.target)) {
			return;
		} 
		else startDnd(e);
		// isDragging = true;
    }, 200);
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
	if(ghost) ghost.hide(data.ref);
});
dnd.on("dragOver", (data) => {
	// it will always run when mouse or touch moves
	myDropMarker.draw(
		data.el,
		data.closestEl,
		data.orientation, !!data.hasChild,
		data.ref
	);
});

let startGroup;
let isDraging = false;

function checkDnd(el) {
	if (el.hasAttribute('cloneable') || el.getAttribute('cloneable') != 'false' || el.dnd.cloneable) {
		return 'cloneable';
	}	
	if (el.hasAttribute('draggable') || el.getAttribute('draggable') != 'false' || el.dnd.draggable == 'draggable', true) {
		return 'draggable';
	}
}

function startDnd(e) {
	let wnd = e.view
	let r = getCocs(e.target, [vars.draggable, vars.cloneable, vars.handleable]);
	// let el = e.target;
	// let att = checkDnd(el)
	// if (!att) {
	// 	if (this.checkInitFunction(el, [vars.draggable, vars.cloneable, vars.handleable])) return el;
	// }
	if(!Array.isArray(r)) return;
	let [el, att] = r;

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
			let hasHandle = el.getAnyAttribute(vars.handleable);
			if(hasHandle) return;
			break;

		default:
			el = getCoc(el, vars.draggable);
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

	let el = getCoc(target, vars.droppable);
	// let el;
	// if (target.hasAttribute('droppable') || target.getAttribute('droppable') != 'false' || target.dnd.droppable == 'droppable', true) {
	// 	el = target;
	// }
	
	// if(!el) {
	// 	el = target.closest('.sortable') || target.closest('[droppable]:not([droppable="false"])');
	// }
	
	if(!el) return;

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

function getGroupName(el) {
  if (!el.tagName) el = el.parentElement;
  do {
    let groupName = el.getAttribute(vars.group_name);
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
	name: "dnd-config",
	observe: ['addedNodes'],
	target: '.sortable, .cloneable',
	callback: mutation => {
		initElement({target: mutation.target, cloneable: mutation.target.classList.contains('cloneable')});
	},
});

// observer.init({
// 	name: "dnd-iframe",
// 	observe: ['addedNodes'],
// 	target: 'iframe',
// 	callback: mutation => {
//     	initIframe({isIframe: true, iframe: mutation.target});
// 	},
// });

export default { init, initIframe};
