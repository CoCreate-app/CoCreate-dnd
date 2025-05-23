export function ghostEffect(elementEvent, el, wnd) {
    // el.removeAttribute("dragging");
    this.start = () => {
        let { width, height } = wnd.window.getComputedStyle(el);

        this.element = el.cloneNode(true);
        this.element.setAttribute("ghostEffect", '');
        this.element.style.height = height;
        this.element.style.width = width;
        this.element.style.position = "fixed";
        this.element.style.pointerEvents = "none";

        wnd.document.body.append(this.element);

    };

    this.draw = (e, wnd) => {
        this.element.style.display = "block";
        let frameRect = { top: 0, left: 0 };

        if (wnd.frameElement) {
            let frameElement = wnd.frameElement;
            do {
                if (this.element.ownerDocument !== wnd.document) {
                    let frameFrameRect = frameElement.getBoundingClientRect();
                    frameRect.top += frameFrameRect.top;
                    frameRect.left += frameFrameRect.left;
                    frameElement = frameElement.ownerDocument.defaultView.parent.frameElement;
                } else {
                    frameElement = "";
                }
            } while (frameElement);
        }

        // Get computed styles to consider margins
        const computedStyle = window.getComputedStyle(this.element);
        const marginTop = parseFloat(computedStyle.marginTop) || 0;
        const marginLeft = parseFloat(computedStyle.marginLeft) || 0;

        this.element.style.position = "fixed";

        // Adjust top and left positions with margins and mouse offset taken into account
        this.element.style.top = e.y + frameRect.top - elementEvent.offsetY - marginTop + "px";
        this.element.style.left = e.x + frameRect.left - elementEvent.offsetX - marginLeft + "px";

    };

    this.hide = () => {
        this.element.remove();
    };
}
