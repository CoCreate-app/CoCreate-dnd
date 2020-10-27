/*global dom*/
/*global CoCreate*/
/*global elementConfig*/
/*global DOMParser*/
/*global domEditor*/

window.addEventListener("load", () => {
  CoCreateSocket.listen("dndNewElement", function (data) {
    // resolving the element_id to real element in the clinet
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
      } else {
        data.target = document.querySelector(`[data-element_id=${data.target}]`);
      }
      

      data.value[1] = parse(data.value[1]);

      console.log("with object: ", data, window.location.pathname);
      // passing it to domEditor


      domEditor(data);
    } catch (error) {
      console.error(error)
    }
  });
});

function UUID(length = 10) {
  var result = "";
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  var d = new Date().toTimeString();
  var random = d.replace(/[\W_]+/g, "").substr(0, 6);
  result += random;
  return result;
}

function parse(text) {
  let doc = new DOMParser().parseFromString(text, "text/html");
  if (doc.head.children[0]) return doc.head.children[0];
  else return doc.body.children[0];
}

document.addEventListener("dndsuccess", (e) => {
  let { dropedEl, dragedEl, position, dropType, path } = e.detail;
  let CoCreate;
  let Document;
  if (dragedEl.ownerDocument !== dropedEl.ownerDocument) {
    let windowObject = window.iframes.guests.canvas.window;
    CoCreate = windowObject.CoCreate;
    Document = windowObject.document;
  } else {
    CoCreate = window.CoCreate;
    Document = window.document;
  }

  let broadcast = {
    target: dropedEl,
    method: "insertAdjacentElement",
    value: [position, dragedEl],
  };

  broadcast.target = broadcast.target.getAttribute("data-element_id");
  if (dropType !== "data-cloneable")
    broadcast.value[1] = broadcast.value[1].getAttribute("data-element_id");
  else {
    if (!broadcast.value[1].getAttribute("data-element_id"))
      broadcast.value[1].setAttribute("data-element_id", UUID());
      
      // init element-config todo: what to do?
    // let clonedEl = parse( broadcast.value[1].outerHTML );
    // let body = document.createElement('body');
    // body.appendChild(clonedEl)
    // dom.element(
    //   elementConfig, { context: body }
    // )
    // broadcast.value[1].replaceWith(body.children[0])
    // broadcast.value[1] = broadcast.value[1].outerHTML;
  }

  if (dropType === "data-cloneable") {
    dom.element("default", {
      target: broadcast.draggedEl,
      draggable: "true",
      droppable: "true",
      hoverable: "true",
      selectable: "true",
      editable: "true",
    });

    CoCreate.sendMessage({
      broadcast_sender: false,
      rooms: "",
      emit: {
        message: "dndNewElement",
        data: { ...broadcast, path },
      },
    });
    // CoCreate.sendMessage({
    //   rooms: "",
    //   emit: {
    //     message: "vdomNewElement",
    //     data: broadcast,
    //   },
    // });
  } else if(!path.length)
    CoCreate.sendMessage({
      broadcast_sender: true,
      rooms: "",
      emit: {
        message: "domEditor",
        data: broadcast,
      },
    });
});
