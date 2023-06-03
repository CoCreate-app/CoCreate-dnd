export function setPosition(el, wnd, e, dragType) {
	let parentX = el.parentElement.offsetLeft
	let parentY = el.parentElement.offsetTop
	el.style.position = dragType
	
	if (dragType === 'absolute') {
		el.parentElement.style.position = 'relative'
		el.style.left = e.pageX - parentX - el.dnd.offsetX + "px";
		el.style.top = e.pageY - parentY - el.dnd.offsetY + "px";
	}
	else if (dragType === 'fixed') {
		el.style.left = e.x - el.dnd.offsetX + "px";
		el.style.top = e.y - el.dnd.offsetY + "px";
	}
}
