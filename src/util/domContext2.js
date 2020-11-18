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
      if (el.getAnyAttribute(attributeName) == "true") return el;
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
      }

      el = el.parentElement;
    } while (el);

    return undefined;
  };

  this.setContext = function (el, att, value) {
    el.setHiddenAttribute(att, value);
  };
}
