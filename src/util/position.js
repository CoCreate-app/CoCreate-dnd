export function setPosition(el, wnd, e, dragType) {
	let parentX = el.parentElement.offsetLeft
	let parentY = el.parentElement.offsetTop
	el.style.position = dragType
	if (dragType === 'absolute') {
		el.parentElement.style.position = 'relative'
		el.style.left = e.pageX - parentX - 28 + "px";
		el.style.top = e.pageY - parentY - 28 + "px";
	}
	else if (dragType === 'fixed') {
		el.style.left = e.x + "px";
		el.style.top = e.y + "px";
	}
}
