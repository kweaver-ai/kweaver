export default {
    bind(el, binding) {
        el.dataset.hint = binding.value;
        window.__introjsDiscovery.ping();
    }
};
