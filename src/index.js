/*global DOMException*/

import observer from '@cocreate/observer';
import {initEvents, initFunctions} from "./dndEvents";
import "./collaboration.js";
import './index.css';


let windows = new Map();

function initDnd() {
	initWindow(window);
}

function initWindow(wnd){
	const topWindow = window.top;
	if(!windows.has(wnd.window)) {
		windows.set(wnd);
		initEvents(wnd);

		let elements = wnd.document.querySelectorAll("iframe, [sortable], [cloneables]");
		initElements(elements);
	}
}

function initElements(elements) {
  for (let el of elements)
    initElement({target: el});
}

function initElement({
	target,
	draggable,
	droppable = true,
	cloneable = false,
	nested = false,
	handle,
	group,
	exclude,
	init
}) {
	if (!target.tagName) {
		let error = "Dnd Sortable: Please provide a valid element";
		console.error(error);
		throw error;
	}

	if (target.hasAttribute('cloneables'))
		cloneable = true

	let isNested = target.getAttribute('nested');
	if (isNested != 'false' || isNested != undefined)
		nested = true;

	if (target.tagName == 'IFRAME') {
		initWindow(target.contentWindow);
		if (init || target.hasAttribute('cloneables') || target.hasAttribute('sortable')) {
			target = target.contentDocument.documentElement;
		}
		else return
	}

	target.dnd = {droppable: droppable};

	if (group) 
		target.dnd['groupName'] = group;

	if (exclude) {
		try {
			let excludeEls = target.querySelectorAll(exclude);
			excludeEls.forEach((el) => {
				el.dnd['exclude'] = true;
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
	
	if (target.children.length) {
		Array.from(target.children).forEach((el) => {
			el.dnd = {};
			if (cloneable) {
				el.dnd['cloneable'] = cloneable;
			}
			else if (draggable != false){
				el.dnd['draggable'] = true;
			}
			try {
				let handleEls = el.querySelectorAll(handle);
				if(handle && handleEls.length) {
					el.dnd['draggable'] = true
					el.dnd['handle'] = handleEls;
					handleEls.forEach((el) => {
						el.dnd['draggable'] = true;
					});
				}
			}
			catch (err) {
				if(err instanceof DOMException) {
					let error = "Dnd Sortable: handle must be a valid selector";
					console.error(error);
					throw error;
				}
				else throw err;
			}
			if (nested) {
				if (el.children.length) {
					el.dnd['droppable'] = droppable;
					Array.from(el.children).forEach((el) => {
						initElement({target: el, draggable, droppable, cloneable, nested, handle, group, exclude});
					});
				}
			}
		});
	}
}

function init(params){
	if (params.target){
		params['init'] = true;
		initElement(params);
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
	target: '[cloneables], [sortable]',
	callback: mutation => {
		if (mutation.target.tagName == 'IFRAME')
			setTimeout(() => {
				initElement({target: mutation.target});
			}, 2000);
		else
			initElement({target: mutation.target});
	}
});

export default { init };
