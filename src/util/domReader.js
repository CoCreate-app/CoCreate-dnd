import { logger } from '@cocreate/utils'
let console = logger('off');

/*global Element*/
/*global HTMLElement*/


function context(state) {
  this.state = state;

  this.removeAttribute = (element, attName) => {
    if (this.state.has(element))
      delete this.state.get(element)["attributes"][attName];
  };

  this.hasAttribute = (element, attName) => {
    if (this.state.has(element))
      return this.state.get(element)["attributes"][attName] ? true : false;
  };

  this.getAttribute = (element, attName) => {
    if (this.state.has(element))
      return this.state.get(element)["attributes"][attName];
  };

  this.setAttribute = (element, attName, value) => {
    if (this.state.has(element))
      this.state.get(element).attributes[attName] = value;
    else
      this.state.set(element, {
        element,
        attributes: {
          [attName]: value
        }
      });
  };

  this.getAllAttributes = (element) => {
    if (this.state.has(element)) return this.state.get(element)["attributes"];
  };

  this.getDataset = (element) => {
    let dataset = {};
    for (let [key, value] of Object.entries(
        this.state.get(element)["attributes"]
      ))
      if (key.beginsWith("data-")) dataset[key.substr(5)] = value;

    return dataset;
  };
}

let state = new Map();
let domContext = new context(state);
window.domContext = domContext;

function init() {


  const domReader = {
    splitBydelimiter: (str, delimiter) => {
      return str.split(delimiter).map((s) => s.trim());
    },
    joinBydelimiter: (str, delimiter) => {
      return str.map((s) => s.trim()).join(delimiter);
    },
  };

  // console.log('aaaaaaaaaa', window.frames)
  let allFrames = Array.from(window.frames);
  // console.log('aaaaaaaaaa', allFrames)
  allFrames.unshift(window);

  for (let frame of allFrames) { register(frame.window) }
}



function register( window, context = domContext) {


  
  // console.log('registering domReader for ', frame)
  let htmlPrototype = window.Element.prototype;
  
  if(htmlPrototype.setHiddenAttribute) return;
  // let nativeSetAttribute = htmlPrototype.setAttribute;
  // htmlPrototype.setAttribute = function (attName, value) {
  //   if(this.getAttribute(attName) !== value)
  //   nativeSetAttribute.apply(this, [attName,value])

  // };
  let nativeSetAttribute = htmlPrototype.setAttribute;
  htmlPrototype.setAttribute = function(attName, value) {
    nativeSetAttribute.apply(this, [attName, value])

  };
  htmlPrototype.setHiddenAttribute = function(attName, value) {
    console.log('dnd domReader ', new Date().getSeconds()  + ' ' + new Date().getMilliseconds())
    context.setAttribute(this, attName, value);
  };

  htmlPrototype.getHiddenAttribute = function(attName) {
    return context.getAttribute(this, attName);
  };

  htmlPrototype.getAllHiddenAttribute = function(attName) {
    return context.getAllAttributes(this);
  };

  htmlPrototype.getAnyAttribute = function(attName) {
    if (this.hasAttribute(attName)) return this.getAttribute(attName);
    else if (context.hasAttribute(this, attName))
      return context.getAttribute(this, attName);
  };

  htmlPrototype.setAnyAttribute = function(attName, value) {
    this.setAttribute(attName, value);
    context.setAttribute(this, attName, value);
  };

  htmlPrototype.removeAnyAttribute = function(attName) {
    this.removeAnyAttribute(attName);
    context.removeAttribute(this, attName);
  };

  htmlPrototype.hasAnyAttribute = function(attName, value) {
    return (
      this.hasAttribute(attName) || context.hasAttribute(this, attName)
    );
  };

  // todo: should this cause mutation
  htmlPrototype.hideAttribute = function(attName) {
    if (this.hasAttribute(attName)) {
      if (context.hasAttribute(this, attName)) return false;
      context.setAttribute(this, attName, this.getAttribute(attName));
      this.removeAttribute(attName);
    }
  };

  htmlPrototype.unhideAttribute = function(attName) {
    if (context.hasAttribute(this, attName)) {
      if (this.hasAttribute(attName)) return false;

      this.setAttribute(attName, context.getAttribute(this, attName));
      context.removeAttribute(this, attName);
    }
  };



}

init();

const domReader  = {register, domContext}; 
export default domReader;

