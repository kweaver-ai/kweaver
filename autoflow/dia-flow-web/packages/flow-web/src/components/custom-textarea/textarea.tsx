import React, { useRef, useState } from "react";
import clsx from "clsx";
import { Input, InputRef } from "antd";
import { isFunction } from "lodash";
import styles from "./textarea.module.less";
import useSize from "@react-hook/size";

interface CustomTextAreaProps {
    placeholder: string;
    value?: string;
    maxLength: number;
    height?: number;
    readOnly?: boolean;
    class?: string;
    onChange?: (val: string) => void;
}

const { TextArea: AntTextArea } = Input;

export const CustomTextArea: React.FC<CustomTextAreaProps> = ({
    value,
    placeholder,
    maxLength,
    height: maxHeight,
    readOnly = false,
    onChange,
    class: customClass,
}: CustomTextAreaProps) => {
    const [isFocus, setIsFocus] = useState(false);
    const ref = useRef<InputRef>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [_, height] = useSize(containerRef);

    const handleFocus = () => {
        if (readOnly) {
            return;
        }
        setIsFocus(true);
        if (ref.current) {
            ref.current.focus();
        }
    };

    const handleBlur = () => {
        setIsFocus(false);
    };

    const handleChange = (e: any) => {
        if (isFunction(onChange)) {
            onChange(e.target.value);
        }
    };

    return (
        <div
            onClick={handleFocus}
            className={clsx(
                styles["applet-textarea"],
                customClass ? customClass : "",
                {
                    [styles["textarea-focus"]]: isFocus,
                }
            )}
            style={{ height: `${maxHeight ? maxHeight : 116}px` }}
            aria-hidden
            ref={containerRef}
        >
            <AntTextArea
                value={value}
                ref={ref}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onChange={handleChange}
                readOnly={readOnly}
                showCount
                bordered={false}
                maxLength={maxLength}
                style={{
                    height: `${maxHeight ? maxHeight - 28 : height - 28}px`,
                }}
                placeholder={placeholder}
            />
        </div>
    );
};
