import {cssPath, parseTextToHtml} from '@cocreate/utils';
import message from '@cocreate/message-client';

function wrapper() {


	if(window.parent !== window) return;


	window.addEventListener("load", () => {
		message.listen('domEditor', function(response) {
			// console.log('raw object recieved: ', data.target, data.value[1], window.location.pathname)
			let data = response.data;
			if(data.target) {
				data.target = document.querySelector(data.target);
			}
			if(data.value[1]) {
				data.value[1] = document.querySelector(data.value[1]);
			}
			if(!data.target)
				return console.log('dnd error: draggble is null')
			if(!data.value[1])
				return console.log('dnd error: droppable is null')
			let [position, el] = data.value
			data.target.insertAdjacentElement(position, el)
		})


		message.listen("dndNewElement", function(response) {
			// console.log(
			//   "raw object recieved: ",
			//   data.target,
			//   data.value[1],
			//   window.location.pathname
			// );
			let data = response.data;
			try {
				if(data.path) {
					let iframe = document.querySelector(data.path);
					let frame = iframe.contentWindow.document || iframe.contentDocument;
					data.target = frame.querySelector(data.target);
				}
				else {
					data.target = document.querySelector(data.target);
				}

				data.value[1] = parseTextToHtml(data.value[1]);
				if(data.hiddenAttribute) {
					for(let [key, value] of Object.entries(data.hiddenAttribute)) {
						data.value[1].dnd(key, value);
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
		let { dropedElCSSPath, dragedEl, position, dropType, path } = e.detail;
 
		if(dropType === "cloneable") {
			let hiddenAttribute = dragedEl.dnd;

			dragedEl = dragedEl.outerHTML;

			message.send({
				broadcast_sender: false,
				rooms: "",
				message: "dndNewElement",
				data: {
					target: dropedElCSSPath,
					method: "insertAdjacentElement",
					value: [position, dragedEl],
					path,
					hiddenAttribute,
				}
			});
		}
		else {
			dragedEl = cssPath(dragedEl);
			message.send({
				broadcast_sender: false,
				rooms: "",
				message: "domEditor",
				data: {
					target: dropedElCSSPath,
					method: "insertAdjacentElement",
					value: [position, dragedEl]
				}
			});
		}
	});

}

wrapper();
