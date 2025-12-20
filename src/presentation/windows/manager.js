
export class WindowLayer {
  constructor() {
    this.element = document.createElement("div");
    this.element.id = "window-layer";
  }
  addChild(window) {
    this.element.appendChild(window.overlay);
    this.element.appendChild(window.element);
  }
  appendTo(parent) {
    parent.appendChild(this.element);
  }
}

/**
 * @class WindowManager
 */
export class WindowManager {
  constructor() {
    this.stack = [];
  }
  push(window) {
    const index = this.stack.indexOf(window);
    if (index > -1) {
      this.stack.splice(index, 1);
    }
    this.stack.push(window);
    window.open();
    this.updateState();
  }
  pop() {
    if (this.stack.length === 0) return null;
    const window = this.stack.pop();
    window.close();
    this.updateState();
    return window;
  }
  close(window) {
    const index = this.stack.indexOf(window);
    if (index === -1) return;
    if (index === this.stack.length - 1) {
      this.pop();
    } else {
      this.stack.splice(index, 1);
      window.close();
      this.updateState();
    }
  }
  handleInput(e) {
      if (this.stack.length === 0) return false;
      const topWindow = this.stack[this.stack.length - 1];
      if (e.key === "Escape") {
          topWindow.onEscape();
          return true;
      }
      return false;
  }
  updateState() {
    this.stack.forEach((win, index) => {
      const isTop = index === this.stack.length - 1;
      win.element.style.zIndex = 10 + index * 10;
      win.overlay.style.zIndex = 10 + index * 10;
      if (isTop) {
        win.overlay.classList.remove("window--dimmed");
      } else {
        win.overlay.classList.add("window--dimmed");
      }
    });
  }
}
