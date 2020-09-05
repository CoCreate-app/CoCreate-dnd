// todo: jest support import/export
export default function context(html) {
  this.map = new Map();

  /**
   * @param el the element look for context
   *
   * @returns attribute value or false if not found
   */
  this.getContext = function (el, attributeName) {
    do {
      let meta = this.map.get(el);
      if (meta && meta[attributeName]) return el;
      if (el.tagName == "IFRAME") return false;
      if (el.getAttribute(attributeName) == "true") return el;
      el = el.parentElement;
    } while (el);

    return undefined;
  };

  /**
   * @param el the element look for context
   */
  this.getContexts = function (el, attributeNames) {
    do {
      let meta = this.map.get(el);

      for (let attributeName of attributeNames) {
        if (meta && meta[attributeName]) return [el, attributeName];
        if (el.tagName == "IFRAME") return false;
        if (el.getAttribute(attributeName) == "true")
          return [el, attributeName];
      }

      el = el.parentElement;
    } while (el);

    return undefined;
  };

  this.setContext = function (el, att, value) {
    if (this.map.has(el)) {
      let meta = this.map.get(el);
      meta[att] = value;
    } else {
      this.map.set(el, {
        [att]: value,
      });
    }
  };
}
