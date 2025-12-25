/* global introJs */
import { waitForDirectives } from '../utils';

let shown = false;

function startTour(el) {
    if (shown) {
        return;
    }
    shown = true;

    // autostart tour
    el.__introjs.start();

    if (el.__introjs.onAutostartHook) {
        el.__introjs.onAutostartHook(el);
    }

    // if flag, autoshow hints
    if (el.hasOwnProperty('__introjsAutoHints')) {
        el.__introjs.showHints();

        if (el.__introjs.onAutostartHintsHook) {
            el.__introjs.onAutostartHintsHook(el);
        }
    }
}

export default async(el, binding) => {
    if (binding.value === false) {
        return;
    }

    // set introjs instance to element
    if (!el.hasOwnProperty('__introjs')) {
        el.__introjs = introJs();
        el.__introjs.onautostart = cb => {
            el.__introjs.onAutostartHook = cb;
        };
        el.__introjs.onautostarthints = cb => {
            el.__introjs.onAutostartHintsHook = cb;
        };
    }

    if (binding.arg === 'hints') {
        el.__introjsAutoHints = true;
    }

    // bind event listeners
    if (binding.arg === 'on') {
        const modifiers = Object.keys(binding.modifiers);
        const callback = elem => {
            return binding.value(elem, el.__introjs);
        };
        callback.bind(el.__introjs);
        for (const mod of modifiers) {
            const event = `on${mod}`;
            el.__introjs[event](callback);
        }
        return;
    }

    // configure introjs
    if ('config' in binding.modifiers) {
        el.__introjs.setOptions(binding.value);
        return;
    }

    try {
        await waitForDirectives();
        startTour(el);
    } catch (e) {
        // eslint-disable-next-line
        console.error(e);
    }
};
