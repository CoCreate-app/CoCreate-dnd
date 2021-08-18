/*global dom*/
/*global CoCreate*/
/*global DOMParser*/
/*global domEditor*/
/*global CoCreate.socket*/

import utils from '@cocreate/utils';
import message from '@cocreate/message-client';
import uuid from '@cocreate/uuid';

function wrapper() {


	if(window.parent !== window) return;


	window.addEventListener("load", () => {
		message.listen('domEditor', function(data) {
			// console.log('raw object recieved: ', data.target, data.value[1], window.location.pathname)
			// resolving the element_id to real element in the clinet
			if(data.target) {
				data.target = document.querySelector(`[element_id="${data.target}"]`);
			}
			if(data.value[1]) {
				data.value[1] = document.querySelector(`[element_id="${data.value[1]}"]`);
			}
			if(!data.target)
				return console.log('dnd error: draggble is null')
			if(!data.value[1])
				return console.log('dnd error: droppable is null')
			let [position, el] = data.value
			data.target.insertAdjacentElement(position, el)
		})


		message.listen("dndNewElement", function(data) {
			// console.log(
			//   "raw object recieved: ",
			//   data.target,
			//   data.value[1],
			//   window.location.pathname
			// );

			try {
				if(data.path.length) {
					let iframe = document.querySelector(data.path[0]);
					let context = iframe.contentWindow.document || iframe.contentDocument;
					data.target = context.querySelector(`[element_id=${data.target}]`);
				}
				else {
					data.target = document.querySelector(
						`[element_id=${data.target}]`
					);
				}

				data.value[1] = utils.parseTextToHtml(data.value[1]);
				if(data.hiddenAttribute) {
					for(let [key, value] of Object.entries(data.hiddenAttribute)) {
						data.value[1].setHiddenAttribute(key, value);
					}
				}

				// console.log("with object: ", data, window.location.pathname);
				let [position, el] = data.value
				data.target.insertAdjacentElement(position, el)
			}
			catch(error) {
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

		if(!dropedEl.getAttribute("element_id"))
			dropedEl.setAttribute("element_id", uuid.generate(6));

		dropedEl = dropedEl.getAttribute("element_id");

		if(dropType === "cloneable") {
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
			if(!dragedEl.getAttribute("element_id"))
				dragedEl.setAttribute("element_id", uuid.generate(6));

			dragedEl = dragedEl.getAttribute("element_id");

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
