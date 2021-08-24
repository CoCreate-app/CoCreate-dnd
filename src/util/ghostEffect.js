export function ghostEffect(elementEvent, el, ref) {
  this.effectCb;
  el.removeAttribute("CoC-dragging");
  this.start = () => {
    this.cloneEl = el.cloneNode(true);
    let { width, height } = ref.window.getComputedStyle(el);
    this.wrapper = document.createElement("div");

    this.wrapper.style.height = height;
    this.wrapper.style.width = width;
    this.wrapper.append(this.cloneEl);
    this.wrapper.style.display = "none";
    ref.document.body.append(this.wrapper);

    this.wrapper.style.pointerEvents = "none";
    this.wrapper.id = "ghostEffect";
  };

  this.draw = (e, ref) => {
    this.wrapper.style.display = "block";

    let frameRect;
    if (ref.frameElement) frameRect = ref.frameElement.getBoundingClientRect();
    else frameRect = { top: 0, left: 0 };

    this.wrapper.style.top = frameRect.top + e.y - elementEvent.offsetY + "px";
    this.wrapper.style.left =
      frameRect.left + e.x - elementEvent.offsetX + "px";
  };

  this.hide = () => {
    this.wrapper.remove();
  };
}
