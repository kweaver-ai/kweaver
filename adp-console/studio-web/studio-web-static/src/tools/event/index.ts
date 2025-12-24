class Event {
    /**
     * 事件对象
     */
    events: {
        [key: string]: (props?: string) => any;
    };

    constructor() {
        this.events = {};
    }

    /**
     * 事件注册
     * @param name 键
     * @param listener 值
     */
    registry(name: string, listener: (props?: string) => any) {
        this.events[name] = listener;
    }

    /**
     * 触发器
     * @param name 键
     */
    trigger(name: string, props?: any) {
        if (this.events[name]) {
            if (props) {
                this.events[name](props);
            } else {
                this.events[name]();
            }
        }
    }
}

export { Event };
