import observer from '@cocreate/observer';
import "./collaboration.js";
import {initEvents, initFunctionState} from "./dndEvents";
import VirtualDnd from "./virtualDnd";
// import * as vars from "./util/variables.js";
import {dropMarker} from "./util/dropMarker.js";
import {ghostEffect} from "./util/ghostEffect.js";
import {autoScroll} from "./util/autoScroll.js";
import './index.css';


let windows = new Map();
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

export {
	initFunction,
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

export default { init, initIframe, beforeDndSuccessCallback};
