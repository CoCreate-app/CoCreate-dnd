export function dropMarker(options) {
	options = Object.assign({ borderSize: 2, dropMarkerMargin: 5 }, options);
	let marker = document.createElement("div");
	marker.id = "dropMarker";
	marker.style.pointerEvents = "none";

	this.lastOrigntaion = undefined;

	document.body.append(marker);
	this.obj = marker;

	this.draw = function(parent, el, orientation, isInside, wnd) {
		marker.style.display = "block";

		let rect = el.getBoundingClientRect();
		if (!rect.width && !rect.height) {
			rect = parent.getBoundingClientRect();
			orientation = "top";
		}

		switch(orientation) {
			case "top":
			case "bottom":
				marker.style.height = options.borderSize + "px";
				marker.style.width = rect.width + "px";
				break;
			case "left":
			case "right":
				marker.style.width = options.borderSize + "px";
				marker.style.height = rect.height + "px";
				break;
			default:
				throw new Error("one type of orientation must be specified");
		}

		if (parent != el) {
			let prect = parent.getBoundingClientRect();
			let parentSize = prect[orientation];
			let childSize = rect[orientation];
			if (Math.abs(parentSize - childSize) < options.dropMarkerMargin * 2)
				isInside = true;
		}
		let frameRect;
		if (wnd.frameElement) {
			frameRect = wnd.frameElement.getBoundingClientRect();
			if (wnd.parent.frameElement) {
				let isTopWndDnd = wnd.top.document.getElementById('dropMarker'); 
				if (isTopWndDnd) {
					let frameFrameRect = wnd.parent.frameElement.getBoundingClientRect();
					let topRect = frameRect.top;
					let leftRect = frameRect.left;
					topRect += frameFrameRect.top;
					leftRect += frameFrameRect.left;
					frameRect = { top: topRect, left: leftRect };
				}
			}
		}
		else frameRect = { top: 0, left: 0 };

		marker.style.transition = "top,left 0.2s ease-in-out";
		switch(orientation) {
			case "top":
				marker.style.top =
					frameRect.top +
					rect.top -
					options.borderSize / 2 +
					window.scrollY +
					(isInside ? options.dropMarkerMargin : -options.dropMarkerMargin) +
					"px";
				marker.style.left =
					frameRect.left +
					rect.left -
					options.borderSize / 2 +
					window.scrollX +
					"px";
				break;
			case "bottom":
				marker.style.top =
					frameRect.top +
					rect.bottom -
					options.borderSize / 2 +
					window.scrollY +
					(isInside ? -options.dropMarkerMargin : options.dropMarkerMargin) +
					"px";
				marker.style.left =
					frameRect.left +
					rect.left -
					options.borderSize / 2 +
					window.scrollX +
					"px";
				break;
			case "left":
				marker.style.top =
					frameRect.top +
					rect.top -
					options.borderSize / 2 +
					window.scrollY +
					"px";
				marker.style.left =
					frameRect.left +
					rect.left -
					options.borderSize / 2 +
					window.scrollX +
					(isInside ? options.dropMarkerMargin : -options.dropMarkerMargin) +
					"px";
				break;
			case "right":
				marker.style.top =
					frameRect.top +
					rect.top -
					options.borderSize / 2 +
					window.scrollY +
					"px";
				marker.style.left =
					frameRect.left +
					rect.right -
					options.borderSize / 2 +
					window.scrollX +
					(isInside ? -options.dropMarkerMargin : options.dropMarkerMargin) +
					"px";
				break;
			default:
				throw new Error("one type of orientation must be specified");
		}
		this.lastOrigntaion = orientation;
	};

	this.hide = function(el) {
		marker.style.display = "none";
	};
}
