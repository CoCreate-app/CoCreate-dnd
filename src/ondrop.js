import domEditor from './util/domEditor.js';

export default function ondrop(dropedEl, position, dragedEl) {

  let dropedElCounterpart = dropedEl.getAttribute('data-css_path');
  if (dropedElCounterpart) {
    let dragedElCounterpart = dragedEl.getAttribute('data-css_path');

    let correspondAction = {
      target: dropedElCounterpart,
      method: 'insertAdjacentElement',
      value: [position, dragedElCounterpart]
    };

    correspondAction.target = document.querySelector(correspondAction.target)
    correspondAction.value[1] = document.querySelector(correspondAction.value[1]);
    CoCreate.sendMessage(correspondAction)
    domEditor(correspondAction)

  }


}
