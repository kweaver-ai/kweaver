import Vue from 'vue/dist/vue.common';
import Plugin from '~/index';
import { autoregister } from '~/index';

describe('plugin', () => {
    it('should add $intro variable to vue prototype', () => {
        Vue.use(Plugin);
        const vm = new Vue();
        expect(vm.$intro.constructor).toEqual(Function);
    });

    it('$intro() should return new introJs instance', () => {
        Vue.use(Plugin);
        const vm = new Vue();
        expect(vm.$intro()).toBeTruthy();
    });

    it('should autoregister in window has Vue', () => {
        window.Vue = Vue;
        autoregister();
        const vm = new Vue();
        expect(vm.$intro.constructor).toEqual(Function);
    });

    it('should autoregister discovery service', () => {
        Vue.use(Plugin);
        expect(window.__introjsDiscovery).toBeTruthy;
    });
});
