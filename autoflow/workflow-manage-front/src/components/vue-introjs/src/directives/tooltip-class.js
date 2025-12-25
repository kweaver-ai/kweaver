export default {
    bind(el, binding) {
        el.dataset['tooltipclass'] = binding.value;
    }
};
