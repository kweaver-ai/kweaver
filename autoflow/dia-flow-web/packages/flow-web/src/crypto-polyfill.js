(function () {
    if (!window.crypto) {
        window.crypto = window.msCrypto;
    }
    
    // Polyfill for Object.hasOwn - ES2022 feature (not supported in Chrome < 93)
    if (!Object.hasOwn) {
        Object.hasOwn = function(obj, prop) {
            return Object.prototype.hasOwnProperty.call(obj, prop);
        };
    }
})();
