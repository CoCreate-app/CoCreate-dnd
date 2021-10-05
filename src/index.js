/*global DOMException*/

import observer from '@cocreate/observer';
import {initEvents, initFunctions} from "./dndEvents";
import "./collaboration.js";
import './index.css';


let windows = new Map();

function initDnd() {
	// if(window.parent !== window) return;
	let iframes = document.querySelectorAll("iframe");
	initIframes(iframes);
	let sortables = document.querySelectorAll(".sortable");
	initElements(sortables);
	let cloneables = document.querySelectorAll(".cloneable");
	initElements(cloneables, true);
}


function initIframes(iframes) {
  for (let iframe of iframes)
    initIframe(iframe);
}

function initIframe(iframe) {
	let wnd = iframe.contentWindow;
	initWindow(wnd);
	
	let iframes = wnd.document.querySelectorAll("iframe");
	if (iframes) initIframes(iframes);
}

function initElements(elements, cloneable) {
  for (let el of elements)
    initElement({target: el, cloneable});
}

function initElement({
	target,
	targetDocument,
	draggable,
	droppable = true,
	cloneable = false,
	nested = false,
	handle,
	group,
	exclude,
}) {
	if(target.tagName == 'IFRAME') {
		initWindow(target.contentDocument.defaultView);
		return;
	}
		
	if(group) target.dnd = {groupName: group};
	let isNested = target.getAttribute('nested');
	if(isNested) {
		nested = true;
		target.dnd = {nested: true};
	}
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
	
	target.dnd = {droppable: droppable};
	if(target.children.length)
		Array.from(target.children).forEach((el) => {
			if(cloneable) {
				el.dnd = {cloneable: cloneable};
			}
			else if (draggable != false){
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
			if(nested) {
				if (el.children.length) {
					el.dnd = {droppable: droppable};
					Array.from(el.children).forEach((el) => {
						initElement(el, draggable, droppable, cloneable, nested, handle, group, exclude);
					});
				}
			}
		});
	initWindow(window);
}

function initWindow(wnd){
	var topWindow = window.top;
	if(!windows.has(wnd.window)) {
		// if(wnd.CoCreate.dnd && wnd.CoCreate.dnd.hasInit) return;
		initEvents(wnd);
    	windows.set(wnd);
	}
}

function init(params){
	if (params.target){
		initElement(params)
	}
	else if (params.targetDocument){
		initWindow(params.targetDocument.defaultView)
	}
	if (params.onDrag || params.onDrop)
		initFunctions.push(params);
}

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
	target: '[draggable], [droppable], [cloneable]',
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
