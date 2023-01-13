export function ghostEffect(elementEvent, el, wnd) {
	// el.removeAttribute("dragging");
	this.start = () => {
		// this.cloneEl = el.cloneNode(true);
		let { width, height } = wnd.window.getComputedStyle(el);
		// this.element = document.createElement("div");
		
		this.element = el;
		this.previousStyle = el.getAttribute('style')
		this.element.setAttribute("ghostEffect", '');
		this.element.style.height = height;
		this.element.style.width = width;
		// this.element.style.display = "none";
		this.element.style.position = "fix";
		this.element.style.pointerEvents = "none";
		
		// this.element.append(this.cloneEl);
		// wnd.document.body.append(this.element);

	};

	this.draw = (e, wnd) => {
		// this.element.style.display = "block";
		let frameRect = { top: 0, left: 0 };
		if (wnd.frameElement) {
			let frameElement = wnd.frameElement;
			do {
				let isFrameDnd = frameElement.ownerDocument.getElementById('dropMarker'); 
				if (isFrameDnd) {
					let frameFrameRect = frameElement.getBoundingClientRect();
					frameRect.top += frameFrameRect.top;
					frameRect.left += frameFrameRect.left;
					frameElement = frameElement.ownerDocument.defaultView.parent.frameElement;
				}
				else frameElement = "";
			} while (frameElement);
		}
		this.element.style.position = "fixed";
		this.element.style.top = e.y + frameRect.top  + "px";
		this.element.style.left =
			frameRect.left + e.x - elementEvent.offsetX + "px";
	};

	this.hide = () => {
		// this.element.remove();
		this.element.removeAttribute("ghostEffect");
		if (this.previousStyle)
			this.element.setAttribute("style", this.previousStyle);
		else
			this.element.removeAttribute("style");

	};
}
