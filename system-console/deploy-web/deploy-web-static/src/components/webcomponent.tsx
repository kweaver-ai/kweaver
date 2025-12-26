import React from "react";
import ReactDOM from "react-dom";
import { Props } from "./webcomponent.d";
import { isFunction } from "lodash";

export default class WebComponent<
    P extends Props,
    T
> extends React.PureComponent<P, T> {
    /**
     * 销毁组件
     */
    destroy() {
        if (
            !isFunction(this.props.beforeDestroy) ||
            this.props.beforeDestroy() !== false
        ) {
            const dom = ReactDOM.findDOMNode(this);
            const container = dom ? dom.parentNode : null;

            if (isFunction(this.componentWillUnmount)) {
                this.componentWillUnmount();
            }

            if (container) {
                ReactDOM.unmountComponentAtNode(container as Element);
            }
        }
    }
}
