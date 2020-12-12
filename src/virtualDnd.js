import eventUtil from "./eventUtil";
import { closestChild, parse } from "./util/common";
import { exclude } from "./util/variables";

function UUID(length = 10) {
  var result = "";
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  var d = new Date().toTimeString();
  var random = d.replace(/[\W_]+/g, "").substr(0, 6);
  result += random;
  return result;
}

let topleft = ["left", "top"];

export default function virtualDnd(beforeDndSuccess) {
  this.dragedEl;
  this.dropedEl;
  this.position;
  this.id;
  this.type;

  let evnt = new eventUtil();

  this.on = function () {
    evnt.on.apply(evnt, arguments);
  };

  this.dragStart = (e, el, id, ref, dropType) => {
    // #broadcast
    // domEditor({
    //   obj: selectorUtil.cssPath( this.dropedEl),
    //   method: 'insertAdjacentElement',
    //   value: { param1: [this.position, selectorUtil.cssPath(this.dragedEl)] }
    // });
    this.id = id;
    this.dropType = dropType;
    console.log({
      comment: "dragStart",
    });
    // dfonclk.onActive(e.target)
    // selectBoxMarker.hide(onRemove)
    // greenDropMarker.hide();

    this.dragedEl = el;
    evnt.dispatch("dragStart", { e, el, ref });
  };

  this.dragEnd = (e, ref) => {
    try {
      if (this.dragedEl) this.dragedEl.removeAttribute("CoC-dragging");
      if (this.position) {
        if (this.dropedEl === this.dragedEl)
          throw "dnd cancelled. you can't dnd on the same element.";

        // in future we should also disable hover and tag name in dragOver method
        // parent can't be draged into children
        if (this.dragedEl.contains(this.dropedEl))
          throw "dnd cancelled, you can't dnd from parent to its children.";

        let path = CoCreateUtils.getElementPath(this.dropedEl);
        // get iframe path
        // let path = [];
        //   const {cssPath, findIframeFromElement, getTopMostWindow} = window.cc;
        //   let topWindow = getTopMostWindow()
        //   let iframeElement = findIframeFromElement(topWindow, this.dropedEl)
        //   let p = cssPath(iframeElement);
        //   if(p)
        //   path.unshift(p)

        //todo: support for nested iframe
        // while(iframeElement !== findIframeFromElement(topWindow,iframeElement))
        // {
        //   iframeElement = findIframeFromElement(topWindow,iframeElement);
        //   path.unshift(cssPath(iframeElement))
        // }

        let detail = {
          position: this.position,
          dragedEl: this.dragedEl,
          dropedEl: this.dropedEl,
          dropType: this.dropType,
          path,
        };
        let result;
        if (beforeDndSuccess) result = beforeDndSuccess(detail);
        Object.assign(detail, result);

        // dispatch gloval events
        const event = new CustomEvent("dndsuccess", {
          bubbles: false,
          detail,
        });

        let broadcast = {
          target: detail.dropedEl,
          method: "insertAdjacentElement",
          value: [detail.position, detail.dragedEl],
        };
        domEditor(broadcast);
        window.dispatchEvent(event, { bubbles: false });
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (this.type) {
        this.position = null;
        console.log(
          "dnd completed",
          "type:",
          this.type,
          "position:",
          this.position
        );
      }
        evnt.dispatch("dragEnd", { e, ref });
    }
  };

  this.dragOver = (e, el, ref) => {
    // el is the element hovered
    if (this.dragedEl) this.dragedEl.setAttribute("CoC-dragging", true);
    if (el.children.length === 0) {
      // place top or bottom inside the element
      let [orientation, closestEl] = closestChild([e.x, e.y], [el]);
      evnt.dispatch("dragOver", {
        e,
        el,
        closestEl,
        orientation,
        hasChild: true,
        ref,
      });
      // greenDropMarker.draw(el, el, orientation, true);
      // hoverBoxMarker.draw(el)
      // tagNameTooltip.draw(el)
      this.position = topleft.includes(orientation)
        ? "afterbegin"
        : "beforeend";
      this.dropedEl = el;
      this.type = "normal";
    } else {
      // find closest child and put outside the child element on top or bottom relating to that child,
      let [orientation, closestEl] = closestChild([e.x, e.y], el.children);

      // greenDropMarker.draw(el, closestEl, orientation, false);
      // hoverBoxMarker.draw(el)
      // tagNameTooltip.draw(el)
      if (closestEl.getAttribute("data-exclude") == "true") {
        this.dropedEl = closestEl.parentElement;
        // only to get orientation
        let [orientation2, closestEl2] = closestChild(
          [e.x, e.y],
          [this.dropedEl]
        );
        orientation = orientation2;
      } else this.dropedEl = closestEl;

      evnt.dispatch("dragOver", {
        e,
        el,
        closestEl,
        orientation,
        hasChild: false,
        ref,
      });

      this.position = topleft.includes(orientation)
        ? "beforebegin"
        : "afterend";

      this.type = "children";
    }
  };
}
