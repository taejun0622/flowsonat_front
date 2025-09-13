// FlowSonat Instagram Controller - Content Script
class FlowSonatController {
  constructor() {
    this.isActive = false;
    this.overlay = null;
    this.statusIndicator = null;
    this.currentPosition = { x: 0, y: 0 };
    this.isClicking = false;
    this.isDragging = false;
    this.dragStart = null;
    this.scrollableAreas = [];
    this.clickableElements = [];
    
    this.init();
  }

  init() {
    console.log('🚀 FlowSonat Instagram Controller initialized');
    this.createOverlay();
    this.createStatusIndicator();
    this.setupMessageListener();
    this.scanPage();
  }


  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'flowsonat-overlay';
    this.overlay.style.display = 'none';
    document.body.appendChild(this.overlay);
  }

  createStatusIndicator() {
    this.statusIndicator = document.createElement('div');
    this.statusIndicator.className = 'flowsonat-status';
    this.statusIndicator.textContent = 'FlowSonat Controller Ready';
    document.body.appendChild(this.statusIndicator);
  }

  setupMessageListener() {
    window.addEventListener('message', (event) => {
      if (event.source !== window) return;
      
      const { type, data } = event.data;
      
      switch (type) {
        case 'FLOWSONAT_ACTIVATE':
          this.activate();
          break;
        case 'FLOWSONAT_DEACTIVATE':
          this.deactivate();
          break;
        case 'FLOWSONAT_CLICK':
          this.click(data.x, data.y, data.button || 'left');
          break;
        case 'FLOWSONAT_DOUBLE_CLICK':
          this.doubleClick(data.x, data.y);
          break;
        case 'FLOWSONAT_RIGHT_CLICK':
          this.rightClick(data.x, data.y);
          break;
        case 'FLOWSONAT_DRAG_START':
          this.startDrag(data.x, data.y);
          break;
        case 'FLOWSONAT_DRAG_MOVE':
          this.dragMove(data.x, data.y);
          break;
        case 'FLOWSONAT_DRAG_END':
          this.endDrag();
          break;
        case 'FLOWSONAT_SCROLL':
          this.scroll(data.x, data.y, data.deltaX, data.deltaY);
          break;
        case 'FLOWSONAT_FIND_SCROLLABLE_AREAS':
          this.findScrollableAreas();
          break;
        case 'FLOWSONAT_FIND_CLICKABLE_ELEMENTS':
          this.findClickableElements();
          break;
        case 'FLOWSONAT_FIND_ELEMENT_BY_TEXT':
          this.findElementByText(data.text);
          break;
        case 'FLOWSONAT_FIND_ELEMENT_BY_SELECTOR':
          this.findElementBySelector(data.selector);
          break;
        case 'FLOWSONAT_GET_ELEMENT_INFO':
          this.getElementInfo(data.x, data.y);
          break;
        case 'FLOWSONAT_TAKE_SCREENSHOT':
          this.takeScreenshot();
          break;
      }
    });
  }

  activate() {
    this.isActive = true;
    this.overlay.style.display = 'block';
    document.body.classList.add('flowsonat-overlay-active');
    this.updateStatus('Controller Active');
    console.log('✅ FlowSonat Controller activated');
  }

  deactivate() {
    this.isActive = false;
    this.overlay.style.display = 'none';
    document.body.classList.remove('flowsonat-overlay-active');
    this.updateStatus('Controller Inactive');
    console.log('❌ FlowSonat Controller deactivated');
  }

  moveCursor(x, y) {
    if (!this.isActive) return;
    
    this.currentPosition = { x, y };
  }

  click(x, y, button = 'left') {
    if (!this.isActive) return;
    
    this.moveCursor(x, y);
    
    const element = document.elementFromPoint(x, y);
    if (element) {
      const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
        button: button === 'right' ? 2 : 0,
        buttons: button === 'right' ? 2 : 1,
        clientX: x,
        clientY: y
      });
      
      element.dispatchEvent(event);
    }
  }

  doubleClick(x, y) {
    if (!this.isActive) return;
    
    this.moveCursor(x, y);
    
    const element = document.elementFromPoint(x, y);
    if (element) {
      const event = new MouseEvent('dblclick', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: x,
        clientY: y
      });
      
      element.dispatchEvent(event);
    }
  }

  rightClick(x, y) {
    this.click(x, y, 'right');
  }

  startDrag(x, y) {
    if (!this.isActive) return;
    
    this.isDragging = true;
    this.dragStart = { x, y };
  }

  dragMove(x, y) {
    if (!this.isActive || !this.isDragging) return;
    
    this.moveCursor(x, y);
    
    const element = document.elementFromPoint(x, y);
    if (element) {
      const event = new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: x,
        clientY: y,
        buttons: 1
      });
      
      element.dispatchEvent(event);
    }
  }

  endDrag() {
    if (!this.isActive) return;
    
    this.isDragging = false;
    this.dragStart = null;
  }

  scroll(x, y, deltaX, deltaY) {
    if (!this.isActive) return;
    
    this.moveCursor(x, y);
    
    const element = document.elementFromPoint(x, y);
    if (element) {
      const event = new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        view: window,
        deltaX: deltaX || 0,
        deltaY: deltaY || 0,
        clientX: x,
        clientY: y
      });
      
      element.dispatchEvent(event);
    }
  }

  findScrollableAreas() {
    const scrollableElements = [];
    
    // Find elements with overflow scroll
    const elements = document.querySelectorAll('*');
    elements.forEach(element => {
      const style = window.getComputedStyle(element);
      if (style.overflow === 'scroll' || style.overflow === 'auto' || 
          style.overflowY === 'scroll' || style.overflowY === 'auto') {
        const rect = element.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          scrollableElements.push({
            element: element,
            rect: rect,
            selector: this.getElementSelector(element)
          });
        }
      }
    });
    
    this.scrollableAreas = scrollableElements;
    this.highlightScrollableAreas();
    
    return scrollableElements;
  }

  findClickableElements() {
    const clickableElements = [];
    
    // Find buttons, links, and other clickable elements
    const selectors = [
      'button', 'a', 'input[type="button"]', 'input[type="submit"]',
      '[role="button"]', '[onclick]', '[data-testid*="button"]',
      '[class*="btn"]', '[class*="button"]'
    ];
    
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (this.isClickable(element)) {
          const rect = element.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            clickableElements.push({
              element: element,
              rect: rect,
              selector: this.getElementSelector(element),
              text: element.textContent?.trim() || '',
              type: element.tagName.toLowerCase()
            });
          }
        }
      });
    });
    
    this.clickableElements = clickableElements;
    this.highlightClickableElements();
    
    return clickableElements;
  }

  findElementByText(text) {
    const elements = document.querySelectorAll('*');
    const matches = [];
    
    elements.forEach(element => {
      if (element.textContent?.includes(text)) {
        const rect = element.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          matches.push({
            element: element,
            rect: rect,
            selector: this.getElementSelector(element),
            text: element.textContent?.trim() || ''
          });
        }
      }
    });
    
    return matches;
  }

  findElementBySelector(selector) {
    const elements = document.querySelectorAll(selector);
    const matches = [];
    
    elements.forEach(element => {
      const rect = element.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        matches.push({
          element: element,
          rect: rect,
          selector: this.getElementSelector(element),
          text: element.textContent?.trim() || ''
        });
      }
    });
    
    return matches;
  }

  getElementInfo(x, y) {
    const element = document.elementFromPoint(x, y);
    if (!element) return null;
    
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    return {
      tagName: element.tagName,
      className: element.className,
      id: element.id,
      text: element.textContent?.trim() || '',
      selector: this.getElementSelector(element),
      rect: rect,
      isClickable: this.isClickable(element),
      isScrollable: style.overflow === 'scroll' || style.overflow === 'auto',
      attributes: this.getElementAttributes(element)
    };
  }

  takeScreenshot() {
    // This would require additional permissions and implementation
    // For now, return the current viewport info
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      url: window.location.href
    };
  }

  // Helper methods
  isClickable(element) {
    const style = window.getComputedStyle(element);
    return style.pointerEvents !== 'none' && 
           style.cursor !== 'default' &&
           element.offsetWidth > 0 &&
           element.offsetHeight > 0;
  }

  getElementSelector(element) {
    if (element.id) {
      return `#${element.id}`;
    }
    
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.trim());
      if (classes.length > 0) {
        return `${element.tagName.toLowerCase()}.${classes.join('.')}`;
      }
    }
    
    return element.tagName.toLowerCase();
  }

  getElementAttributes(element) {
    const attributes = {};
    for (let attr of element.attributes) {
      attributes[attr.name] = attr.value;
    }
    return attributes;
  }

  highlightScrollableAreas() {
    // Remove existing indicators
    document.querySelectorAll('.flowsonat-scrollable-indicator').forEach(el => el.remove());
    
    this.scrollableAreas.forEach(area => {
      const indicator = document.createElement('div');
      indicator.className = 'flowsonat-scrollable-indicator';
      indicator.style.left = `${area.rect.left}px`;
      indicator.style.top = `${area.rect.top}px`;
      indicator.style.width = `${area.rect.width}px`;
      indicator.style.height = `${area.rect.height}px`;
      document.body.appendChild(indicator);
    });
  }

  highlightClickableElements() {
    // Remove existing indicators
    document.querySelectorAll('.flowsonat-clickable-indicator').forEach(el => el.remove());
    
    this.clickableElements.forEach(item => {
      const indicator = document.createElement('div');
      indicator.className = 'flowsonat-clickable-indicator';
      indicator.style.left = `${item.rect.left}px`;
      indicator.style.top = `${item.rect.top}px`;
      indicator.style.width = `${item.rect.width}px`;
      indicator.style.height = `${item.rect.height}px`;
      document.body.appendChild(indicator);
    });
  }

  updateStatus(message) {
    this.statusIndicator.textContent = message;
    this.statusIndicator.classList.remove('hidden');
    
    setTimeout(() => {
      this.statusIndicator.classList.add('hidden');
    }, 3000);
  }

  scanPage() {
    // Initial scan for scrollable and clickable elements
    setTimeout(() => {
      this.findScrollableAreas();
      this.findClickableElements();
    }, 2000);
  }
}

// Initialize the controller when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new FlowSonatController();
  });
} else {
  new FlowSonatController();
}
