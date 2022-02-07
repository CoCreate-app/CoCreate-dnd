import eventUtil from "./util/customEvents";
import {cssPath} from '@cocreate/utils';
import { initFunctions } from "./dndEvents";


let topleft = ["left", "top"];

export default function virtualDnd() {
	this.dragedEl;
	this.dropedEl;
	this.position;
	this.id;
	this.type;

	let evnt = new eventUtil();

	this.on = function() {
		evnt.on.apply(evnt, arguments);
	};

	this.dragStart = (e, el, id, wnd, dropType) => {
		this.id = id;
		this.dropType = dropType;
		this.dragedEl = el;
		evnt.dispatch("dragStart", { e, el, wnd });
	};

	this.dragEnd = (e, wnd) => {
		try {
			if(this.dragedEl) this.dragedEl.removeAttribute("dragging");
			if(this.position) {
				if(this.dropedEl === this.dragedEl)
					throw "dnd cancelled. you can't dnd on the same element.";

				if(this.dragedEl.contains(this.dropedEl))
					throw "dnd cancelled, you can't dnd from parent to its children.";

				let iframe = this.dropedEl.ownerDocument.defaultView.frameElement;
				let path = cssPath(iframe);
				
				let detail = {
					position: this.position,
					dragedEl: this.dragedEl,
					dropedEl: this.dropedEl,
					dropedElCSSPath: cssPath(this.dropedEl),
					dropType: this.dropType,
					path,
				};

				beforeDndSuccess(e.currentTarget, detail);
				

				let domTextEditor = this.dropedEl.closest('[contenteditable]');
				if (domTextEditor){

					let elementValue;
					if(this.dropType == 'cloneable')
						elementValue = this.dragedEl.outerHTML;
				
					CoCreate.text.insertAdjacentElement({
						domTextEditor,
						position: this.position,
						target: this.dropedEl,
						element: this.dragedEl,
						elementValue: elementValue
					});
				}
				else {
					this.dropedEl.insertAdjacentElement(this.position, this.dragedEl);
				}
				
				/*global CustomEvent*/
				const event = new CustomEvent("dndsuccess", {
					bubbles: false,
					detail,
				});
				window.dispatchEvent(event, { bubbles: false });
			}
		}
		catch(e) {
			console.error(e);
		}
		finally {
			if(this.type) {
				this.position = null;
				// console.log("dnd completed", "type:", this.type, "position:", this.position);
			}
			evnt.dispatch("dragEnd", { e, wnd });
		}
	};

	this.dragOver = (e, el, wnd) => {
		// el is the element hovered
		if(this.dragedEl) this.dragedEl.setAttribute("dragging", true);
		if(el.children.length === 0) {
			// place top or bottom inside the element
			let [orientation, closestEl] = closestChild([e.x, e.y], [el]);
			evnt.dispatch("dragOver", {
				e,
				el,
				closestEl,
				orientation,
				hasChild: true,
				wnd,
			});

			this.position = topleft.includes(orientation) ?
				"afterbegin" :
				"beforeend";
			this.dropedEl = el;
			this.type = "normal";
		}
		else {
			// find closest child and put outside the child element on top or bottom relating to that child,
			let [orientation, closestEl] = closestChild([e.x, e.y], el.children);

			if(closestEl.getAttribute("dnd-exclude") == "true") {
				this.dropedEl = closestEl.parentElement;
				// only to get orientation
				let [orientation2] = closestChild(
					[e.x, e.y], [this.dropedEl]
				);
				orientation = orientation2;
			}
			else this.dropedEl = closestEl;

			evnt.dispatch("dragOver", {
				e,
				el,
				closestEl,
				orientation,
				hasChild: false,
				wnd,
			});

			this.position = topleft.includes(orientation) ?
				"beforebegin" :
				"afterend";

			this.type = "children";
		}
	};
}


function closestChild(p, children) {
	let closestDistance = Infinity;
	let closestchild;
	let topOrientation;
	for(let child of children) {
		if(child.classList.contains("hidden")) continue;
		let [orientation, distance] = distanceToChild(p, child);
		if(distance < closestDistance) {
			closestDistance = distance;
			closestchild = child;
			topOrientation = orientation;
		}
	}
	return [topOrientation, closestchild];
}
let orientations = ["left", "top", "right", "bottom"];

function distanceToChild(p, child) {
	let rect = child.getBoundingClientRect();

	let line1 = { p1: [rect.top, rect.left], p2: [rect.bottom, rect.left] };
	let line2 = { p1: [rect.top, rect.left], p2: [rect.top, rect.right] };
	let line3 = { p1: [rect.top, rect.right], p2: [rect.bottom, rect.right] };
	let line4 = { p1: [rect.bottom, rect.left], p2: [rect.bottom, rect.right] };

	let distances = [
		pDistance(p[0], p[1], line1.p1[1], line1.p1[0], line1.p2[1], line1.p2[0]),
		pDistance(p[0], p[1], line2.p1[1], line2.p1[0], line2.p2[1], line2.p2[0]),
		pDistance(p[0], p[1], line3.p1[1], line3.p1[0], line3.p2[1], line3.p2[0]),
		pDistance(p[0], p[1], line4.p1[1], line4.p1[0], line4.p2[1], line4.p2[0]),
	];

	let orientation;
	let closestDistance = Infinity;
	distances.forEach((distance, i) => {
		if(distance < closestDistance) {
			closestDistance = distance;
			orientation = orientations[i];
		}
	});
	return [orientation, closestDistance];
}

export function pDistance(x, y, x1, y1, x2, y2) {
	var A = x - x1;
	var B = y - y1;
	var C = x2 - x1;
	var D = y2 - y1;

	var dot = A * C + B * D;
	var len_sq = C * C + D * D;
	var param = -1;
	if(len_sq != 0)
		//in case of 0 length line
		param = dot / len_sq;

	var xx, yy;

	if(param < 0) {
		xx = x1;
		yy = y1;
	}
	else if(param > 1) {
		xx = x2;
		yy = y2;
	}
	else {
		xx = x1 + param * C;
		yy = y1 + param * D;
	}

	var dx = x - xx;
	var dy = y - yy;
	return Math.sqrt(dx * dx + dy * dy);
}

function beforeDndSuccess(targetDocument, detail) {
	for(let func of initFunctions) {
		if(func.onDrop) {
			if(func.targetDocument.contains(targetDocument))
				func.onDrop(detail);
		}
	}
}