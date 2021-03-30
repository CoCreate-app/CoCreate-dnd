/*global dom*/
/*global CoCreate*/
/*global elementConfig*/
/*global DOMParser*/
/*global domEditor*/
/*global CoCreate.socket*/

import utils from '@cocreate/utils';
import message from '@cocreate/message';

function wrapper() {


  if (window.parent !== window) return;


  window.addEventListener("load", () => {
    message.listen('domEditor', function(data) {
      console.log('raw object recieved: ', data.target, data.value[1], window.location.pathname)
      // resolving the element_id to real element in the clinet
      if (data.target) {
        data.target = document.querySelector(`[data-element_id="${data.target}"]`);
      }
      if (data.value[1]) {
        data.value[1] = document.querySelector(`[data-element_id="${data.value[1]}"]`);
      }
      if (!data.target)
        return console.log('dnd error: draggble is null')
      if (!data.value[1])
        return console.log('dnd error: droppable is null')
      // passing it to domEditor
      let [position, el] = data.value
      data.target.insertAdjacentElement(position, el)
    })


    message.listen("dndNewElement", function(data) {
      console.log(
        "raw object recieved: ",
        data.target,
        data.value[1],
        window.location.pathname
      );

      try {
        if (data.path.length) {
          let iframe = document.querySelector(data.path[0]);
          let context = iframe.contentWindow.document || iframe.contentDocument;
          data.target = context.querySelector(`[data-element_id=${data.target}]`);
        }
        else {
          data.target = document.querySelector(
            `[data-element_id=${data.target}]`
          );
        }

        data.value[1] = utils.parseTextToHtml(data.value[1]);
        if (data.hiddenAttribute) {
          for (let [key, value] of Object.entries(data.hiddenAttribute)) {
            data.value[1].setHiddenAttribute(key, value);
          }
        }

        // console.log("with object: ", data, window.location.pathname);
        // passing it to domEditor
        let [position, el] = data.value
        data.target.insertAdjacentElement(position, el)
        // domEditor(data);
      }
      catch (error) {
        console.error(error);
      }
    });
  });

  window.addEventListener("dndsuccess", (e) => {
    let { dropedEl, dragedEl, position, dropType, path } = e.detail;
    let CoCreate =
      dragedEl.ownerDocument !== dropedEl.ownerDocument ?
      window.iframes.guests.canvas.window.CoCreate :
      window.CoCreate;

    if (!dropedEl.getAttribute("data-element_id"))
      dropedEl.setAttribute("data-element_id", utils.UUID());

    dropedEl = dropedEl.getAttribute("data-element_id");

    if (dropType === "data-cloneable") {
      let hiddenAttribute = dragedEl.getAllHiddenAttribute();

      dragedEl = dragedEl.outerHTML;

      message.send({
        broadcast_sender: false,
        rooms: "",
        emit: {
          message: "dndNewElement",
          data: {
            target: dropedEl,
            method: "insertAdjacentElement",
            value: [position, dragedEl],
            path,
            hiddenAttribute,
          },
        },
      });
    }
    else {
      if (!dragedEl.getAttribute("data-element_id"))
        dragedEl.setAttribute("data-element_id", utils.UUID());

      dragedEl = dragedEl.getAttribute("data-element_id");

      message.send({
        broadcast_sender: true,
        rooms: "",
        emit: {
          message: "domEditor",
          data: {
            target: dropedEl,
            method: "insertAdjacentElement",
            value: [position, dragedEl],
          },
        },
      });
    }
  });

}

wrapper();
