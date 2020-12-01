// todo: jest support import/export

let initFunctionState = [];
export { initFunctionState };
export default function context(html) {
  this.map = new Map();

  this.checkInitFunction = function checkInitFunction(element, request) {
    for (let state of initFunctionState) {
      if (state.target.contains(element)) {
        let r = state.onDnd(element, request);
        if (Array.isArray(r)) return r;
      }
    }
  };
  /**
   * @param el the element look for context
   *
   * @returns attribute value or false if not found
   */
  this.getContext = function (el, attributeName) {
    do {
      if (el.getAnyAttribute(attributeName) == "true") return el;
      else {
        if (this.checkInitFunction(el, [attributeName])) return el;
      }
      el = el.parentElement;
    } while (el);

    return undefined;
  };

  /**
   * @param el the element look for context
   */
  this.getContexts = function (el, attributeNames) {
    do {
      for (let attributeName of attributeNames) {
        if (el.getAnyAttribute(attributeName) == "true")
          return [el, attributeName];
        else {
          let r2 = this.checkInitFunction(el, attributeNames);
          if (Array.isArray(r2) && attributeNames.includes(r2[1])) return r2;
          else return;
        }
      }

      el = el.parentElement;
    } while (el);

    return undefined;
  };

  this.setContext = function (el, att, value) {
    el.setHiddenAttribute(att, value);
  };
}
