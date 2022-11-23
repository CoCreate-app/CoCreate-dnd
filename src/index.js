/*global DOMException*/

import observer from '@cocreate/observer';
import {initEvents, initFunctions} from "./dndEvents";
import "./collaboration.js";
import './index.css';


// let windows = new Map();
let windows = window.top.dnd;
if (!windows) {
	window.top.dnd = new Map();
	windows = window.top.dnd
}

function initDnd() {
	initWindow(window);
}

function initWindow(wnd){
	const topWindow = window.top;
	if (!windows.has(wnd.window)) {
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
	droppable,
	cloneable,
	nested,
	handle,
	group,
	exclude,
	dragType,
	init
}) {

	if (!target.tagName) {
		let error = "Dnd Sortable: Please provide a valid element";
		console.error(error);
		throw error;
	}

	if (!draggable) {
		let isDraggable = target.getAttribute('draggable');
		if (isDraggable != 'false')
			draggable = true;
		if (isDraggable == 'absolute' || isDraggable == 'fixed')
			dragType = isDraggable;
		else
			dragType = true;
	}

	if (!cloneable) {
		let isCloneable = target.getAttribute('cloneables');
		if (isCloneable != 'false' && isCloneable != null && isCloneable != undefined)
			cloneable = true;
	}

	if (!droppable) {
		let isDroppable = target.getAttribute('droppable');
		if (isDroppable != 'false' && !cloneable || cloneable && isDroppable != 'false' && isDroppable != null && isDroppable != undefined)
			droppable = true;
	}

	if (!nested) {
		let isNested = target.getAttribute('nested');
		if (isNested != 'false' && isNested != null && isNested != undefined)
			nested = true;
	}

	if (!handle)
		handle = target.getAttribute('drag-handle');

	if (!group)
		group = target.getAttribute('dnd-group-name');

	if (!exclude)
		exclude = target.getAttribute('dnd-exclude');


	if (target.tagName == 'IFRAME') {
		initWindow(target.contentWindow);
		let sortable = target.hasAttribute('sortable')
		let cloneables = target.hasAttribute('cloneables')
		if (init || sortable || cloneables) {
			target = target.contentDocument.documentElement;
			if (sortable)
				target.setAttribute('sortable', target.getAttribute('sortable') || '')
			if (cloneables)
				target.setAttribute('cloneables', target.getAttribute('cloneables') || '')
			if (nested) {
				target.elementConfig = [{
					selector: "*",
					draggable: true,
					droppable: true,
					selectable: true,
					hoverable: true,
				  }]
				target.setAttribute('nested', target.getAttribute('nested') || '')
			}
		}
		else return
	}

	target.dnd = {droppable};

	if (dragType) 
		target.dnd['dragType'] = dragType;
		
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
			if (err instanceof DOMException) {
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
				el.dnd['draggable'] = draggable;
				if (dragType) 
					target.dnd['dragType'] = dragType;		
			}
			try {
				if (handle) {
					let handleEls = el.querySelectorAll(handle);
					el.dnd['draggable'] = true
					el.dnd['handle'] = handleEls;
					handleEls.forEach((el) => {
						el.dnd['draggable'] = true;
						if (dragType) 
							target.dnd['dragType'] = dragType;
					});
				}
			}
			catch (err) {
				if (err instanceof DOMException) {
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
	name: "dndAddedNodes",
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

// observer.init({
// 	name: "dndAttributes",
// 	observe: ['attributes'],
// 	attributeName: ['cloneables', 'sortable'],
// 	callback: mutation => {
// 		if (mutation.target.tagName == 'IFRAME')
// 			setTimeout(() => {
// 				initElement({target: mutation.target});
// 			}, 2000);
// 		else
// 			initElement({target: mutation.target});
// 	}
// });

export default { init };
