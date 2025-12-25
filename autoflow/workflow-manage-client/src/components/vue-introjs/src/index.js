/* global introJs */
import { DIRECTIVES } from './directives';
import timer from './timer';

const DEFAULT_OPTIONS = {
    waitTimeout: 400
};

const Plugin = {
    install(Vue, options) {
        options = Object.assign({}, DEFAULT_OPTIONS, options);

        Vue.prototype.$intro = (...args) => {
            return introJs(...args);
        };

        const Comp = Vue.extend(timer);
        window.__introjsDiscovery = new Comp({
            propsData: options
        });

        Vue.directive('intro', DIRECTIVES.intro);
        Vue.directive('intro-step', DIRECTIVES.step);
        Vue.directive('intro-position', DIRECTIVES.position);
        Vue.directive('intro-tooltip-class', DIRECTIVES.tooltipClass);
        Vue.directive('intro-highlight-class', DIRECTIVES.highlightClass);
        Vue.directive('intro-scroll-to', DIRECTIVES.scrollTo);
        Vue.directive('intro-disable-interaction', DIRECTIVES.disableInteraction);
        Vue.directive('intro-hint', DIRECTIVES.hint);
        Vue.directive('intro-hint-position', DIRECTIVES.hintPosition);
        Vue.directive('intro-autostart', DIRECTIVES.autostart);
        Vue.directive('intro-if', DIRECTIVES.conditional);
    }
};

export default Plugin;

export function autoregister() {
    if (window.Vue) {
        window.Vue.use(Plugin);
    }
}

autoregister();
