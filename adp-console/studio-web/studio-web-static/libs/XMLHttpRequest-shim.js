// ------ XMLHttpRequest.onload ------
// monkey patch XMLHttpRequest to make IE8 call onload when readyState === 4
if (!!navigator.userAgent.match(/MSIE\s8/)) {
    var sendFn = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function () {
      // only if onreadystatechange has not already been set
      // to avoid breaking anything outside of angular
      if (!this.onreadystatechange) {
        this.onreadystatechange = function () {
          if (this.readyState === 4 && this.onload) {
            this.onload();
          }
        };
      }
      // apply this & args to original send
      sendFn.apply(this, arguments);
    };
}