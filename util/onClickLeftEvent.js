// synthesize custom event "CoCreateClickLeft" that only trigger when
// mousedown and up happen in 500ms witin the same element

let lastEl = null;
let time = null;

document.addEventListener('mousedown', e => {
  if (e.which === 1) {
    lastEl = e.target;
    time = new Date().getTime()
  }
})

document.addEventListener('mouseup', e => {
  let newTime = new Date().getTime();
  if (lastEl == e.target && newTime < time + 500) {
    const event = new CustomEvent('CoCreateClickLeft', {
      bubbles: true
    });
    e.target.dispatchEvent(event)
  }

})
