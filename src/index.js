import observer from '@cocreate/observer';
import "./collaboration.js";
import {
	dropMarker,
	getCoc,
	ghostEffect,
	getGroupName,
	parse,
	getCocs,
	// distanceToChild,
	autoScroller,
	initFunctionState,
}
from "./util/common";
// import { checkInitFunction } from "./util/domContext";
import VirtualDnd from "./virtualDnd";
import * as vars from "./util/variables.js";
import './index.css';

import domReader from './util/domReader';
import text from '@cocreate/text';

let touchTimeout;
let draggingTimeout;
let beforeDndSuccessCallback;
let refs = new Map();

function initDnd() {
	if(window.parent !== window) return;
	let sortables = document.querySelectorAll(".sortable");
	initElements(sortables);
	let cloneables = document.querySelectorAll(".cloneable");
	initElements(cloneables, true)
	let iframes = document.querySelectorAll("iframe");
	initIframes(iframes);
}

function initElements(elements, cloneable) {
  for (let el of elements)
    initElement({target: el, cloneable})
}

function initIframes(iframes) {
  for (let iframe of iframes)
    initIframe(iframe);
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
	let ref = { x: 0, y: 0, window, document, isIframe: false };
	newDnD(ref);
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


function initIframe(iframe) {
	let iframeWindow = iframe.contentWindow;
	let iframeDocument = iframeWindow.document || iframe.contentDocument;
	let rect = iframe.getBoundingClientRect();
	let ref = {
		x: rect.left,
		y: rect.top,
		frame: iframe,
		window: iframeWindow,
		document: iframeDocument,
		isIframe: true,
	};
	newDnD(ref);
}

function newDnD(ref){
	
	domReader.register(ref.window);
	if(ref.window.CoCreateDnd && ref.window.CoCreateDnd.hasInit) return;

	if(!ref.document.querySelector("#dnd-style")) {
		let dndStyle = ref.document.createElement("style");
		dndStyle.id = "dnd-style";
		dndStyle.innerHTML = `    /* dnd specic */
  [draggable="true"], [cloneable="true"]  {
    touch-action: none;
  }
  /* dnd specic */`;
		ref.document.head.append(dndStyle);
	}
	initEvents(ref);
};

function initEvents(ref){
	let mousedown, mousemove, mouseup, touchstart, touchmove, touchend;
		ref.document.addEventListener("dragstart", (e) => {
			e.preventDefault();
			return false;
		});

	if(!refs.has(ref.window)) {
		
		mousedown = function(e) {
			if(e.which != 1) return;
		    draggingTimeout = setTimeout(() => {
				if(hasSelection(e.target)) {
					return;
				} 
				else startDnd(e, ref);
		    }, 200);
		}
		
		mousemove = function(e) {
			move(e, ref);
		};
		
		mouseup = function(e) {
			if(e.which != 1) return;
			endDnd(e, ref);
			clearTimeout(draggingTimeout);
		};

		touchstart = function(e) {
			if(touchTimeout)
				clearTimeout(touchTimeout);
			touchTimeout = setTimeout(() => {
				ref.document.body.style.touchAction = "none";
				e.preventDefault();
				startDnd(e, ref);
			}, 200);
		}

		touchmove = function(e) {
			if(!isDraging) {
				if(touchTimeout)
					clearTimeout(touchTimeout);
				return;
			}

			console.log('touch dnd')
			e.preventDefault();

			let touch = e.touches[0];
			let x = touch.clientX;
			let y = touch.clientY;
			let el = ref.document.elementFromPoint(x, y);
			if(!el) return; // it's out of iframe

			// sending object representing an event data
			move({ x, y, target: el, isTouch: true }, ref);
		};
		
		touchend = function(e) {
			ref.document.body.style.touchAction = "auto"
			if(!isDraging) {
				if(touchTimeout)
					clearTimeout(touchTimeout);
				return;
			}
			e.preventDefault();
			endDnd(e, ref);
		}

		
		refs.set(ref.window, { mousemove, mouseup, mousedown, touchmove, touchend, touchstart })
	}
	else {
		({ mousemove, mouseup, mousedown, touchmove, touchend, touchstart } = refs.get(ref.window));
	}

	// removeEvents(ref);
	ref.document.addEventListener("touchstart", touchstart);
	ref.document.addEventListener("touchend", touchend, { passive: false });
	ref.document.addEventListener("touchmove", touchmove, { passive: false });
 	ref.document.addEventListener("mousedown", mousedown);
	ref.document.addEventListener("mouseup", mouseup);
	ref.document.addEventListener("mousemove", mousemove);
}

function removeEvents(ref) {
	ref.document.removeEventListener("touchstart", touchstart);
	ref.document.removeEventListener("touchend", touchend, { passive: false });
	ref.document.removeEventListener("touchmove", touchmove, { passive: false });
 	ref.document.removeEventListener("mousedown", mousedown);
	ref.document.removeEventListener("mouseup", mouseup);
	ref.document.removeEventListener("mousemove", mousemove);
}

function hasSelection(el) {
	let { start, end } = text.getSelections(el);
	if(start != end) {
		return true;
	}
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
	scroller: new autoScroller({ speed: 4, threshold: 3 }),
	myDropMarker: new dropMarker(),
};

//// defining events
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

function startDnd(e, ref) {
	let r = getCocs(e.target, [vars.draggable, vars.cloneable, vars.handleable]);
		
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

	ref.document.body.style.cursor = "crosshair !important";

	isDraging = true;

	dnd.dragStart(e, el, null, ref, att);
}

function endDnd(e, ref) {
	ref.document.body.style.cursor = "";
	isDraging = false;

	dnd.dragEnd(e);
	myDropMarker.hide();

	scroller.deactivateScroll();

}

function move({ x, y, target, isTouch }, ref, stopScroll) {
	if(!isDraging) return;
	var selection = ref.document.getSelection();
	selection.removeAllRanges();
	if(ghost) ghost.draw({ x, y }, ref);
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

	if(!el) return;

	if(!stopScroll) {
		scroller.calculateScroll({
			x,
			y,
			element: el.parentElement ? el.parentElement : el,
			onMouseScrollMove: (e) => move(e, ref, true),
		});
	}
	dnd.dragOver({ x, y, target: el }, el, ref);
}

export {
	initFunction,
	initIframe
};

let exp = {
	initFunction,
};

function init(params) {
	let { mode } = params;
	delete params.mode;
	if(!['function', 'element', 'container'].includes(mode))
		throw new Error('invalid mode provided');
	let funcName = 'init' + mode.charAt(0).toUpperCase() + mode.slice(1);
	exp[funcName].apply(null, [params]);
}

initDnd();

observer.init({
	name: "dnd-config",
	observe: ['addedNodes'],
	target: '.sortable, .cloneable',
	callback: mutation => {
		initElement(mutation.target, !!mutation.target.classList.contains('cloneable'));
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

export default { initIframe, init };
