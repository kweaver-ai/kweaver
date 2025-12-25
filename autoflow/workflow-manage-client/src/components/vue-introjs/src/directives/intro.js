export default {
    bind(el, binding) {
        el.dataset.intro = binding.value;
        window.__introjsDiscovery.ping();
    }
};
