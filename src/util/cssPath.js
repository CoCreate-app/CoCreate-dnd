export default function cssPath(node) {

  let pathSplits = [];
  do {
    let pathSplit = node.tagName.toLowerCase();
    if (node.id)
      pathSplit += '#' + node.id;

    if (node.classList.length) {
      node.classList.forEach(item => {
        pathSplit += '.' + item;
      })
    }

    if (node.tagName !== 'BODY' && node.parentNode) {
      let index = Array.prototype.indexOf.call(node.parentNode.children, node)
      pathSplit += `:nth-child(${index+1})`;
    }

    pathSplits.unshift(pathSplit)
    node = node.parentNode;

  } while (node.tagName !== 'HTML')

  return pathSplits.join(' > ')

}
