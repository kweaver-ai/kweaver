import {
  assign,
  bind,
  pick
} from 'min-dash';

import {
  domify,
  query as domQuery,
  event as domEvent,
  remove as domRemove
} from 'min-dom';

var min = Math.min,
    max = Math.max;

function preventDefault(e) {
  e.preventDefault();
}

function stopPropagation(e) {
  e.stopPropagation();
}

function isTextNode(node) {
  return node.nodeType === Node.TEXT_NODE;
}

function toArray(nodeList) {
  return [].slice.call(nodeList);
}

/**
 * Initializes a container for a content editable div.
 *
 * Structure:
 *
 * container
 *   parent
 *     content
 *     resize-handle
 *
 * @param {object} options
 * @param {DOMElement} options.container The DOM element to append the contentContainer to
 * @param {Function} options.keyHandler Handler for key events
 * @param {Function} options.resizeHandler Handler for resize events
 */
export default function TextBox(options) {
  this.container = options.container;

  this.parent = domify(
    '<div class="djs-direct-editing-parent">' +
      '<div class="djs-direct-editing-content" contenteditable="true"></div>' +
    '</div>'
  );

  this.content = domQuery('[contenteditable]', this.parent);

  this.keyHandler = options.keyHandler || function() {};
  this.resizeHandler = options.resizeHandler || function() {};

  this.autoResize = bind(this.autoResize, this);
  this.handlePaste = bind(this.handlePaste, this);
}


/**
 * Create a text box with the given position, size, style and text content
 *
 * @param {Object} bounds
 * @param {Number} bounds.x absolute x position
 * @param {Number} bounds.y absolute y position
 * @param {Number} [bounds.width] fixed width value
 * @param {Number} [bounds.height] fixed height value
 * @param {Number} [bounds.maxWidth] maximum width value
 * @param {Number} [bounds.maxHeight] maximum height value
 * @param {Number} [bounds.minWidth] minimum width value
 * @param {Number} [bounds.minHeight] minimum height value
 * @param {Object} [style]
 * @param {String} value text content
 *
 * @return {DOMElement} The created content DOM element
 */
TextBox.prototype.create = function(bounds, style, value, options) {
  var self = this;

  var parent = this.parent,
      content = this.content,
      container = this.container;

  options = this.options = options || {};

  style = this.style = style || {};

  var parentStyle = pick(style, [
    'width',
    'height',
    'maxWidth',
    'maxHeight',
    'minWidth',
    'minHeight',
    'left',
    'top',
    'backgroundColor',
    'position',
    'overflow',
    'border',
    'wordWrap',
    'textAlign',
    'outline',
    'transform'
  ]);

  assign(parent.style, {
    width: bounds.width + 'px',
    height: bounds.height + 'px',
    maxWidth: bounds.maxWidth + 'px',
    maxHeight: bounds.maxHeight + 'px',
    minWidth: bounds.minWidth + 'px',
    minHeight: bounds.minHeight + 'px',
    left: bounds.x + 'px',
    top: bounds.y + 'px',
    backgroundColor: '#ffffff',
    position: 'absolute',
    overflow: 'visible',
    border: '1px solid #ccc',
    boxSizing: 'border-box',
    wordWrap: 'normal',
    textAlign: 'center',
    outline: 'none'
  }, parentStyle);

  var contentStyle = pick(style, [
    'fontFamily',
    'fontSize',
    'fontWeight',
    'lineHeight',
    'padding',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft'
  ]);

  assign(content.style, {
    boxSizing: 'border-box',
    width: '100%',
    outline: 'none',
    wordWrap: 'break-word'
  }, contentStyle);

  if (options.centerVertically) {
    assign(content.style, {
      position: 'absolute',
      top: '50%',
      transform: 'translate(0, -50%)'
    }, contentStyle);
  }

  content.innerText = value;

  domEvent.bind(content, 'keydown', this.keyHandler);
  domEvent.bind(content, 'mousedown', stopPropagation);
  domEvent.bind(content, 'paste', self.handlePaste);

  if (options.autoResize) {
    domEvent.bind(content, 'input', this.autoResize);
  }

  if (options.resizable) {
    this.resizable(style);
  }

  container.appendChild(parent);

  // set selection to end of text
  this.setSelection(content.lastChild, content.lastChild && content.lastChild.length);

  return parent;
};

/**
 * Intercept paste events to remove formatting from pasted text.
 */
TextBox.prototype.handlePaste = function(e) {
  var options = this.options,
      style = this.style;

  e.preventDefault();

  var text;

  if (e.clipboardData) {

    // Chrome, Firefox, Safari
    text = e.clipboardData.getData('text/plain');
  } else {

    // Internet Explorer
    text = window.clipboardData.getData('Text');
  }

  this.insertText(text);

  if (options.autoResize) {
    var hasResized = this.autoResize(style);

    if (hasResized) {
      this.resizeHandler(hasResized);
    }
  }
};

TextBox.prototype.insertText = function(text) {

  // insertText command not supported by Internet Explorer
  var success = document.execCommand('insertText', false, text);

  if (success) {
    return;
  }

  this._insertTextIE(text);
};

TextBox.prototype._insertTextIE = function(text) {

  // Internet Explorer
  var range = this.getSelection(),
      startContainer = range.startContainer,
      endContainer = range.endContainer,
      startOffset = range.startOffset,
      endOffset = range.endOffset,
      commonAncestorContainer = range.commonAncestorContainer;

  var childNodesArray = toArray(commonAncestorContainer.childNodes);

  var container,
      offset;

  if (isTextNode(commonAncestorContainer)) {
    var containerTextContent = startContainer.textContent;

    startContainer.textContent =
      containerTextContent.substring(0, startOffset)
      + text
      + containerTextContent.substring(endOffset);

    container = startContainer;
    offset = startOffset + text.length;

  } else if (startContainer === this.content && endContainer === this.content) {
    var textNode = document.createTextNode(text);

    this.content.insertBefore(textNode, childNodesArray[startOffset]);

    container = textNode;
    offset = textNode.textContent.length;
  } else {
    var startContainerChildIndex = childNodesArray.indexOf(startContainer),
        endContainerChildIndex = childNodesArray.indexOf(endContainer);

    childNodesArray.forEach(function(childNode, index) {

      if (index === startContainerChildIndex) {
        childNode.textContent =
          startContainer.textContent.substring(0, startOffset) +
          text +
          endContainer.textContent.substring(endOffset);
      } else if (index > startContainerChildIndex && index <= endContainerChildIndex) {
        domRemove(childNode);
      }
    });

    container = startContainer;
    offset = startOffset + text.length;
  }

  if (container && offset !== undefined) {

    // is necessary in Internet Explorer
    setTimeout(function() {
      self.setSelection(container, offset);
    });
  }
};

/**
 * Automatically resize element vertically to fit its content.
 */
TextBox.prototype.autoResize = function() {
  var parent = this.parent,
      content = this.content;

  var fontSize = parseInt(this.style.fontSize) || 12;

  if (content.scrollHeight > parent.offsetHeight ||
      content.scrollHeight < parent.offsetHeight - fontSize) {
    var bounds = parent.getBoundingClientRect();

    var height = content.scrollHeight;
    parent.style.height = height + 'px';

    this.resizeHandler({
      width: bounds.width,
      height: bounds.height,
      dx: 0,
      dy: height - bounds.height
    });
  }
};

/**
 * Make an element resizable by adding a resize handle.
 */
TextBox.prototype.resizable = function() {
  var self = this;

  var parent = this.parent,
      resizeHandle = this.resizeHandle;

  var minWidth = parseInt(this.style.minWidth) || 0,
      minHeight = parseInt(this.style.minHeight) || 0,
      maxWidth = parseInt(this.style.maxWidth) || Infinity,
      maxHeight = parseInt(this.style.maxHeight) || Infinity;

  if (!resizeHandle) {
    resizeHandle = this.resizeHandle = domify(
      '<div class="djs-direct-editing-resize-handle"></div>'
    );

    var startX, startY, startWidth, startHeight;

    var onMouseDown = function(e) {
      preventDefault(e);
      stopPropagation(e);

      startX = e.clientX;
      startY = e.clientY;

      var bounds = parent.getBoundingClientRect();

      startWidth = bounds.width;
      startHeight = bounds.height;

      domEvent.bind(document, 'mousemove', onMouseMove);
      domEvent.bind(document, 'mouseup', onMouseUp);
    };

    var onMouseMove = function(e) {
      preventDefault(e);
      stopPropagation(e);

      var newWidth = min(max(startWidth + e.clientX - startX, minWidth), maxWidth);
      var newHeight = min(max(startHeight + e.clientY - startY, minHeight), maxHeight);

      parent.style.width = newWidth + 'px';
      parent.style.height = newHeight + 'px';

      self.resizeHandler({
        width: startWidth,
        height: startHeight,
        dx: e.clientX - startX,
        dy: e.clientY - startY
      });
    };

    var onMouseUp = function(e) {
      preventDefault(e);
      stopPropagation(e);

      domEvent.unbind(document,'mousemove', onMouseMove, false);
      domEvent.unbind(document, 'mouseup', onMouseUp, false);
    };

    domEvent.bind(resizeHandle, 'mousedown', onMouseDown);
  }

  assign(resizeHandle.style, {
    position: 'absolute',
    bottom: '0px',
    right: '0px',
    cursor: 'nwse-resize',
    width: '0',
    height: '0',
    borderTop: (parseInt(this.style.fontSize) / 4 || 3) + 'px solid transparent',
    borderRight: (parseInt(this.style.fontSize) / 4 || 3) + 'px solid #ccc',
    borderBottom: (parseInt(this.style.fontSize) / 4 || 3) + 'px solid #ccc',
    borderLeft: (parseInt(this.style.fontSize) / 4 || 3) + 'px solid transparent'
  });

  parent.appendChild(resizeHandle);
};


/**
 * Clear content and style of the textbox, unbind listeners and
 * reset CSS style.
 */
TextBox.prototype.destroy = function() {
  var parent = this.parent,
      content = this.content,
      resizeHandle = this.resizeHandle;

  // clear content
  content.innerText = '';

  // clear styles
  parent.removeAttribute('style');
  content.removeAttribute('style');

  domEvent.unbind(content, 'keydown', this.keyHandler);
  domEvent.unbind(content, 'mousedown', stopPropagation);
  domEvent.unbind(content, 'input', this.autoResize);
  domEvent.unbind(content, 'paste', this.handlePaste);

  if (resizeHandle) {
    resizeHandle.removeAttribute('style');

    domRemove(resizeHandle);
  }

  domRemove(parent);
};


TextBox.prototype.getValue = function() {
  const val = this.content.innerText.trim();
  console.log(val);
  return val.length>15?val.substring(0,15):val;
};


TextBox.prototype.getSelection = function() {
  var selection = window.getSelection(),
      range = selection.getRangeAt(0);

  return range;
};


TextBox.prototype.setSelection = function(container, offset) {
  var range = document.createRange();

  if (container === null) {
    range.selectNodeContents(this.content);
  } else {
    range.setStart(container, offset);
    range.setEnd(container, offset);
  }

  var selection = window.getSelection();

  selection.removeAllRanges();
  selection.addRange(range);
};
