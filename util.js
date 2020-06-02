export function pDistance(x, y, x1, y1, x2, y2) {

  var A = x - x1;
  var B = y - y1;
  var C = x2 - x1;
  var D = y2 - y1;

  var dot = A * C + B * D;
  var len_sq = C * C + D * D;
  var param = -1;
  if (len_sq != 0) //in case of 0 length line
    param = dot / len_sq;

  var xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  }
  else if (param > 1) {
    xx = x2;
    yy = y2;
  }
  else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  var dx = x - xx;
  var dy = y - yy;
  return Math.sqrt(dx * dx + dy * dy);
}


export function closestChild(p, children) {
  let closestDistance = Infinity;
  let closestchild;
  let topOrientation;
  for (let child of children) {
    if (child.classList.contains('hidden'))
      continue;
    let [orientation, distance] = distanceToChild(p, child);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestchild = child;
      topOrientation = orientation;
    }
  }
  return [topOrientation, closestchild];
}


let orientations = ['left', 'top', 'right', 'bottom']

export function distanceToChild(p, child) {
  let rect = child.getBoundingClientRect();

  let line1 = { p1: [rect.top, rect.left, ], p2: [rect.bottom, rect.left] }
  let line2 = { p1: [rect.top, rect.left, ], p2: [rect.top, rect.right, ] }
  let line3 = { p1: [rect.top, rect.right, ], p2: [rect.bottom, rect.right, ] }
  let line4 = { p1: [rect.bottom, rect.left, ], p2: [rect.bottom, rect.right, ] }


  let distances = [
    pDistance(p[0], p[1], line1.p1[1], line1.p1[0], line1.p2[1], line1.p2[0]),
    pDistance(p[0], p[1], line2.p1[1], line2.p1[0], line2.p2[1], line2.p2[0]),
    pDistance(p[0], p[1], line3.p1[1], line3.p1[0], line3.p2[1], line3.p2[0]),
    pDistance(p[0], p[1], line4.p1[1], line4.p1[0], line4.p2[1], line4.p2[0])
  ];

  let orientation;
  let closestDistance = Infinity;
  distances.forEach((distance, i) => {
    if (distance < closestDistance) {
      closestDistance = distance;
      orientation = orientations[i];
    }
  })
  return [orientation, closestDistance]
}
