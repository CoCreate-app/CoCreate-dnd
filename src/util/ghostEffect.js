export function ghostEffect(elementEvent, el, wnd) {
	this.effectCb;
	el.removeAttribute("dragging");
	this.start = () => {
		this.cloneEl = el.cloneNode(true);
		let { width, height } = wnd.window.getComputedStyle(el);
		this.wrapper = document.createElement("div");

		this.wrapper.style.height = height;
		this.wrapper.style.width = width;
		this.wrapper.append(this.cloneEl);
		this.wrapper.style.display = "none";
		wnd.document.body.append(this.wrapper);

		this.wrapper.style.pointerEvents = "none";
		this.wrapper.id = "ghostEffect";
	};

	this.draw = (e, wnd) => {
		this.wrapper.style.display = "block";
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
		this.wrapper.style.top = e.y + frameRect.top  + "px";
		this.wrapper.style.left =
			frameRect.left + e.x - elementEvent.offsetX + "px";
	};

	this.hide = () => {
		this.wrapper.remove();
	};
}
