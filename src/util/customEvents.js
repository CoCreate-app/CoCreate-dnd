// create a javascript-like event to be used in other classes

export default function eventUtil() {
  this.listener = {}

  // register event, like addEventListener
  this.on = function(type, callback) {
    if (!Object.hasOwnProperty(type)) {
      this.listener[type] = [];
    }
    this.listener[type].push(callback)
  }

  // dispatch an event
  this.dispatch = function(type, data) {
    if (this.listener.hasOwnProperty(type)) {
      this.listener[type].forEach(callback => callback(data))
    }
  }

}
