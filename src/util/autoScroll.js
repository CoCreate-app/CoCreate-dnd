import { pDistance } from "../dnd";

export function autoScroll({ speed, threshold }) {
  this.lastScrollingElement;
  this.onElement;
  this.mouse;
  this.speed;
  this.interval;
  this.isActive;
  this.update = function (x, y) {
    this.mouse = { x, y };
  };

  this.calculateScroll = function ({ x, y, element, onMouseScrollMove }) {
    while (true) {
      if (
        element &&
        element.tagName &&
        (element.scrollHeight > element.clientHeight ||
          element.scrollWidth > element.clientWidth)
      ) {
        break;
      } else if (element.parentElement) element = element.parentElement;
      else break;
    }

    let hasHorizontalScrollbar = element.scrollWidth > element.clientWidth;
    let hasVerticalScrollbar = element.scrollHeight > element.clientHeight;

    let horScrollThreshold = element.clientWidth / threshold;
    let verScrollThreshold = element.clientHeight / threshold;

    let [orientation, closestDistance] = [];
    if (hasVerticalScrollbar)
      [orientation, closestDistance] = distanceToChildTopBottom(
        [x, y],
        element
      );
    else if (hasHorizontalScrollbar)
      [orientation, closestDistance] = distanceToChildLeftRight(
        [x, y],
        element
      );

    if (orientation) {
      let condition;
      switch (orientation) {
        case "top":
        case "bottom":
          this.speed = (verScrollThreshold / (closestDistance + 1)) * speed;
          condition = closestDistance < verScrollThreshold;
          break;

        case "left":
        case "right":
          this.speed = (horScrollThreshold / (closestDistance + 1)) * speed;
          condition = closestDistance < horScrollThreshold;
          break;
      }

      if (condition) {
        if (!this.isActive) {
          this.isActive = true;
          this.__activateScroll(element, orientation, onMouseScrollMove);
        } else if (this.isActive && this.lastScrollingElement !== element) {
          this.deactivateScroll(element);
          this.__activateScroll(element, orientation, onMouseScrollMove);
        }
      } else if (this.isActive) {
        // console.log("no", orientation, element);
        this.isActive = false;
        this.deactivateScroll(element);
      }
    }
  };
  // this.__scroll = function(element, s1 = 0, s2 = 0)
  // {
  //   for(let i = 0 ; i <= this.speed; i++)
  //   {
  //     element.scrollBy(s1, s2)

  //   }
  // }

  this.__activateScroll = function (element, orientation, callback) {
    // TODO: when interval timeout is low and speed is hight scrollBy doesn't act
    // reTODO: give time to scrollBy equal to speed * 0.25 * timeout
    // element.style.scrollBehavior = "auto";
    this.lastScrollingElement = element;
    this.interval = setInterval(() => {
      switch (orientation) {
        case "top":
          element.scrollBy(0, -this.speed);

          break;
        case "bottom":
          element.scrollBy(0, this.speed);

          break;
        case "left":
          element.scrollBy(-this.speed, 0);

          break;
        case "right":
          element.scrollBy(this.speed, 0);

          break;
        default:
      }

      // this.onElement = document.elementFromPoint(this.mouse.x, this.mouse.y);
      // if (this.onElement) {
      //   callback({ x: this.mouse.x, y: this.mouse.y, target: this.onElement });
      // }
    }, 10);
  };

  this.deactivateScroll = function (element) {
    // if (element) element.style.scrollBehavior = "";
    clearInterval(this.interval);
  };
}

function distanceToChildLeftRight(p, child) {
  let rect = child.getBoundingClientRect();

  let line1 = { p1: [rect.top, 0], p2: [rect.bottom, 0] };
  let line3 = {
    p1: [rect.top, child.clientWidth],
    p2: [rect.bottom, child.clientWidth],
  };

  let distances = [
    pDistance(p[0], p[1], line1.p1[1], line1.p1[0], line1.p2[1], line1.p2[0]),
    pDistance(p[0], p[1], line3.p1[1], line3.p1[0], line3.p2[1], line3.p2[0]),
  ];

  let orientation;
  let closestDistance = Infinity;
  distances.forEach((distance, i) => {
    if (distance < closestDistance) {
      closestDistance = distance;
      orientation = ["left", "right"][i];
    }
  });
  return [orientation, closestDistance];
}

function distanceToChildTopBottom(p, child) {
  let rect = child.getBoundingClientRect();

  let line2 = { p1: [0, rect.left], p2: [0, rect.right] };

  let line4 = {
    p1: [child.clientHeight, rect.left],
    p2: [child.clientHeight, rect.right],
  };

  let distances = [
    pDistance(p[0], p[1], line2.p1[1], line2.p1[0], line2.p2[1], line2.p2[0]),

    pDistance(p[0], p[1], line4.p1[1], line4.p1[0], line4.p2[1], line4.p2[0]),
  ];

  let orientation;
  let closestDistance = Infinity;
  distances.forEach((distance, i) => {
    if (distance < closestDistance) {
      closestDistance = distance;
      orientation = ["top", "bottom"][i];
    }
  });
  return [orientation, closestDistance];
}
