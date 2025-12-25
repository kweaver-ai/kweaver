export default {
    props: { waitTimeout: Number },
    data() {
        return {
            timer: null,
            ready: false
        };
    },
    created() {
        this.restartTimer();
    },
    methods: {
        restartTimer() {
            clearTimeout(this.timer);
            this.timer = setTimeout(() => {
                this.ready = true;
                this.$emit('ready', this.ready);
            }, this.waitTimeout);
        },
        ping() {
            this.restartTimer();
        }
    }
};
