/*global dom*/
/*global CoCreate*/
/*global elementConfig*/
/*global DOMParser*/


window.addEventListener("load", () => {
   CoCreateSocket.listen('dndNewElement', function(data) {
    // resolving the element_id to real element in the clinet
    console.log('raw object recieved: ', data.target, data.value[1], window.location.pathname)
    data.target = document.querySelector(`[data-element_id=${data.target}]`);

    let newElement = parse(data.value[1]);
    if (data.target.classList.contains('vdom-item') && window.vdomObject)
      data.value[1] = window.vdomObject.renderNew([newElement]);
    else
      data.value[1] = newElement;

    console.log('with object: ', data, window.location.pathname)
    // passing it to domEditor
    domEditor(data);
  })

});



function parse(text) {
  let doc = new DOMParser().parseFromString(text, 'text/html');
  if (doc.head.children[0])
    return doc.head.children[0];
  else
    return doc.body.children[0];
}

document.addEventListener('dndsuccess',(e)=>{
     let {dropedEl, dragedEl, position, dropType} = e.detail;
  let CoCreate;
  let Document;
  if (dragedEl.ownerDocument !== dropedEl.ownerDocument) {
    let windowObject = window.iframes.guests.canvas.window;
    CoCreate = windowObject.CoCreate;
    Document = windowObject.document;
  }
  else
  {
    CoCreate = window.CoCreate;
    Document = window.document;
  }
  
 
     let broadcast = {
      target: dropedEl,
      method: 'insertAdjacentElement',
      value: [position, dragedEl]
    };
        

      broadcast.target = broadcast.target.getAttribute('data-element_id');
      if (dropType !== 'data-CoC-cloneable')
        broadcast.value[1] = broadcast.value[1].getAttribute('data-element_id');
      else {
        let clonedEl = parse('<div>' + broadcast.value[1].outerHTML + '</div>');
        dom.element(
          elementConfig, { context: clonedEl }
        )
        broadcast.value[1] = clonedEl.innerHTML;
      }


  if (dropType === 'data-CoC-cloneable') {
        dom.element('default', {
          target: broadcast.draggedEl,
          draggable: 'true',
          droppable: 'true',
          hoverable: 'true',
          selectable: 'true',
          editable: 'true',
        });


        CoCreate.sendMessage({
          broadcast_sender: false,
          rooms: '',
          emit: {
            message: 'dndNewElement',
            data: broadcast
          }
        })
        CoCreate.sendMessage({
      
          rooms: '',
          emit: {
            message: 'vdomNewElement',
            data: broadcast
          }
        })



      }
      else
        CoCreate.sendMessage({
          broadcast_sender: false,
          rooms: '',
          emit: {
            message: 'domEditor',
            data: broadcast
          }
        })

})