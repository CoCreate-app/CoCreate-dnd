/*global expect*/
// unit testing
let context = require("./context");
let domHtml = {
  tagName: "html",
};

let domBody = {
  tagName: "body",
  parentElement: domHtml,
};

let domDiv1 = {
  tagName: "div",
  parentElement: domBody,
};

let domDiv2 = {
  tagName: "div",
  parentElement: domDiv1,
};

let domDiv3 = {
  tagName: "div",
  parentElement: domDiv2,
};

let contextObj;

beforeEach(() => {
  contextObj = new context();
});



test("add context to html and check values", () => {
  contextObj.setContext(domBody, "attBody", "domBodyValue");
  contextObj.setContext(domHtml, "domHtml", "domHtmlValue");
  contextObj.setContext(domDiv2, "domDiv2", "domDiv2Value");

  
  expect(contextObj.getContext(domDiv3,"domHtml")).toBe("domHtmlValue");
  expect(contextObj.getContext(domDiv3,"attBody")).toBe("domBodyValue");
  expect(contextObj.getContext(domDiv3,"domDiv2")).toBe("domDiv2Value");

  
  expect(contextObj.getContext(domDiv2,"domHtml")).toBe("domHtmlValue");
  expect(contextObj.getContext(domDiv2,"attBody")).toBe("domBodyValue");
  expect(contextObj.getContext(domDiv2,"domDiv2")).toBe("domDiv2Value");

  
  expect(contextObj.getContext(domDiv1,"domHtml")).toBe("domHtmlValue");
  expect(contextObj.getContext(domDiv1,"attBody")).toBe("domBodyValue");
  expect(contextObj.getContext(domDiv1,"domDiv2")).toBeFalsy();

  
  expect(contextObj.getContext(domBody,"domHtml")).toBe("domHtmlValue");
  expect(contextObj.getContext(domBody,"attBody")).toBe("domBodyValue");
  expect(contextObj.getContext(domBody,"domDiv2")).toBeFalsy();

  
  expect(contextObj.getContext(domHtml,"domHtml")).toBe("domHtmlValue");
  expect(contextObj.getContext(domHtml,"attBody")).toBeFalsy();
  expect(contextObj.getContext(domHtml,"domDiv2")).toBeFalsy();
    
});
