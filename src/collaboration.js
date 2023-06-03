import {cssPath, parseTextToHtml} from '@cocreate/utils';
import message from '@cocreate/message-client';

function wrapper() {

	if (window.parent !== window) return;

	window.addEventListener("load", () => {
		message.listen('dnd', function(response) {
			try {
				let data = response.data;
				if (data.path) {
					let iframe = document.querySelector(data.path);
					let frame = iframe.contentWindow.document || iframe.contentDocument;
					data.target = frame.querySelector(data.target);
				} else {
					data.target = document.querySelector(data.target);
				}
				if (!data.target)
					return console.log('dnd error: draggble is null')

				if (data.dropType == 'cloneable') {
					data.value[1] = parseTextToHtml(data.value[1]);
					if (data.hiddenAttribute) {
						for(const key of Object.keys(data.hiddenAttribute)) {
							data.value[1].dnd[key] = data.hiddenAttribute[key];
						}
					}
				} else {
					if (data.value[1])
						data.value[1] = document.querySelector(data.value[1]);
					if (!data.value[1])
						return console.log('dnd error: droppable is null')
				}

				let [position, el] = data.value
				data.target.insertAdjacentElement(position, el)
			} catch(error) {
				console.error(error);
			}
		})
	});

	window.addEventListener("dndsuccess", (e) => {
		let { droppedElCSSPath, draggedEl, position, dropType, path } = e.detail;
		let data = {
			target: droppedElCSSPath,
			method: "insertAdjacentElement",
			value: [position, draggedEl],
			dropType
		}
		if (dropType === "cloneable") {
			data.path
			data.value[1] = draggedEl.outerHTML;
			data.hiddenAttribute = draggedEl.dnd;
		} else {
			data.value[1] = cssPath(draggedEl);
		}

		message.send({
			broadcastSender: false,
			broadcastBrowser: 'once',
			message: "dnd",
			data
		});
	});

}

wrapper();
