export default {
    bind(el, binding) {
        if (binding.value === false) {
            delete el.dataset.intro;
            delete el.dataset.hint;
        }
    }
};
