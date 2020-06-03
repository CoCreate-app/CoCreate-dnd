import eventUtil from './eventUtil';
import { closestChild } from './util/common';
import selectorUtil from './util/selectorUtil';

let topleft = ['left', 'top'];

export default function virtualDnd() {
  this.dragedEl;
  this.dropedEl;
  this.position;
  this.id;


  let evnt = new eventUtil();


  this.on = function() {
    evnt.on.apply(evnt, arguments);
  }

  this.dragStart = (e, el, id, ref) => {
    // #broadcast
    // domEditor({
    //   obj: selectorUtil.cssPath( this.dropedEl),
    //   method: 'insertAdjacentElement',
    //   value: { param1: [this.position, selectorUtil.cssPath(this.dragedEl)] }
    // });
    this.id = id;
    console.log({
      comment: 'dragStart',
    })
    // dfonclk.onActive(e.target)
    // selectBoxMarker.hide(onRemove)
    // greenDropMarker.hide();
    el.setAttribute('CoC-dragging', true)
    this.dragedEl = el;
    evnt.dispatch('dragStart', { e, el, ref })
  }

  this.dragEnd = (e, ref) => {
    try {
      if (this.position) {
        if (this.dropedEl === this.dragedEl)
          throw 'dnd cancelled. you can dnd on the same element.'

        // in future we should also disable hover and tag name in dragOver method
        // parent can't be draged into children
        if (this.dragedEl.contains(this.dropedEl))
          throw 'dnd cancelled, you can\'t dnd from parent to its children.'

        // #broadcast

        // broadcast the object inside the domEditor
        // it's serializable
        // domEditor({
        //   obj: selectorUtil.cssPath(this.dropedEl),
        //   method: 'insertAdjacentElement',
        //   value: { param1: [this.position, selectorUtil.cssPath(this.dragedEl)] }
        // });
        console.log({
          comment: 'dragEnd',
          obj: this.id ? this.id : selectorUtil.cssPath(this.dropedEl),
          method: 'insertAdjacentElement',
          value: { param1: [this.position, selectorUtil.cssPath(this.dragedEl)] }
        })
        this.id = null;
        this.dropedEl.insertAdjacentElement(this.position, this.dragedEl);

      }
    }
    catch (e) {
      console.error(e)
    }
    finally {
      this.position = null;
      if (this.dragedEl)
        this.dragedEl.removeAttribute('CoC-dragging')
      // greenDropMarker.hide()
      // dfonclk.onInactive(e.target)
      console.log('dnd completed')
      evnt.dispatch('dragEnd', { e, ref })
    }
  }

  this.dragOver =
    (e, el, ref) => {
      // el is the element hovered
      if (el.children.length === 0) {
        // place top or bottom inside the element
        let [orientation, closestEl] = closestChild([e.x, e.y], [el]);
        evnt.dispatch('dragOver', { e, el, closestEl, orientation, hasChild: el.children.length, ref })
        // greenDropMarker.draw(el, el, orientation, true);
        // hoverBoxMarker.draw(el)
        // tagNameTooltip.draw(el)
        this.position = topleft.includes(orientation) ? "afterbegin" : "beforeend";
        this.dropedEl = el;
      }
      else {
        // find closest child and put outside the child element on top or bottom relating to that child,
        let [orientation, closestEl] = closestChild([e.x, e.y], el.children);
        evnt.dispatch('dragOver', { e, el, closestEl, orientation, hasChild: el.children.length, ref })
        // greenDropMarker.draw(el, closestEl, orientation, false);
        // hoverBoxMarker.draw(el)
        // tagNameTooltip.draw(el)
        this.position = topleft.includes(orientation) ? "beforebegin" : "afterend";
        this.dropedEl = closestEl;
      }
    }
}
