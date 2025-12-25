import {
  bind,
  find
} from 'min-dash';

import TextBox from './TextBox';


/**
 * A direct editing component that allows users
 * to edit an elements text directly in the diagram
 *
 * @param {EventBus} eventBus the event bus
 */
export default function DirectEditing(eventBus, canvas) {

  this._eventBus = eventBus;

  this._providers = [];
  this._textbox = new TextBox({
    container: canvas.getContainer(),
    keyHandler: bind(this._handleKey, this),
    resizeHandler: bind(this._handleResize, this)
  });
}

DirectEditing.$inject = [ 'eventBus', 'canvas' ];


/**
 * Register a direct editing provider

 * @param {Object} provider the provider, must expose an #activate(element) method that returns
 *                          an activation context ({ bounds: {x, y, width, height }, text }) if
 *                          direct editing is available for the given element.
 *                          Additionally the provider must expose a #update(element, value) method
 *                          to receive direct editing updates.
 */
DirectEditing.prototype.registerProvider = function(provider) {
  this._providers.push(provider);
};


/**
 * Returns true if direct editing is currently active
 *
 * @return {Boolean}
 */
DirectEditing.prototype.isActive = function() {
  return !!this._active;
};


/**
 * Cancel direct editing, if it is currently active
 */
DirectEditing.prototype.cancel = function() {
  if (!this._active) {
    return;
  }

  this._fire('cancel');
  this.close();
};


DirectEditing.prototype._fire = function(event, context) {
  this._eventBus.fire('directEditing.' + event, context || { active: this._active });
};

DirectEditing.prototype.close = function() {
  this._textbox.destroy();

  this._fire('deactivate');

  this._active = null;

  this.resizable = undefined;
};


DirectEditing.prototype.complete = function() {

  var active = this._active;

  if (!active) {
    return;
  }

  var containerBounds,
      previousBounds = active.context.bounds,
      newBounds = this.$textbox.getBoundingClientRect(),
      newText = this.getValue(),
      previousText = active.context.text;

  if (
    newText !== previousText ||
    newBounds.height !== previousBounds.height ||
    newBounds.width !== previousBounds.width
  ) {
    containerBounds = this._textbox.container.getBoundingClientRect();

    active.provider.update(active.element, newText, active.context.text, {
      x: newBounds.left - containerBounds.left,
      y: newBounds.top - containerBounds.top,
      width: newBounds.width,
      height: newBounds.height
    });
  }

  this._fire('complete');

  this.close();
};


DirectEditing.prototype.getValue = function() {
  return this._textbox.getValue();
};


DirectEditing.prototype._handleKey = function(e) {

  // stop bubble
  e.stopPropagation();

  var key = e.keyCode || e.charCode;

  // ESC
  if (key === 27) {
    e.preventDefault();
    return this.cancel();
  }

  // Enter
  if (key === 13 && !e.shiftKey) {
    e.preventDefault();
    return this.complete();
  }
};


DirectEditing.prototype._handleResize = function(event) {
  this._fire('resize', event);
};


/**
 * Activate direct editing on the given element
 *
 * @param {Object} ElementDescriptor the descriptor for a shape or connection
 * @return {Boolean} true if the activation was possible
 */
DirectEditing.prototype.activate = function(element) {
  if (this.isActive()) {
    this.cancel();
  }

  // the direct editing context
  var context;

  var provider = find(this._providers, function(p) {
    return (context = p.activate(element)) ? p : null;
  });

  // check if activation took place
  if (context) {
    this.$textbox = this._textbox.create(
      context.bounds,
      context.style,
      context.text,
      context.options
    );

    this._active = {
      element: element,
      context: context,
      provider: provider
    };

    if (context.options && context.options.resizable) {
      this.resizable = true;
    }

    this._fire('activate');
  }

  return !!context;
};
