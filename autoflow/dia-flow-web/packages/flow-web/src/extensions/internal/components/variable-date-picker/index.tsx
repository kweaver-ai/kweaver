import { DatePicker, DatePickerProps } from "antd";
import { isString } from "lodash";
import { Moment } from "moment";
import { FC } from "react";

export type StampDatePickerProps = Omit<
    DatePickerProps,
    "defaultValue" | "value" | "onChange"
> & {
    showTime?: boolean;
    showNow?: boolean;
    popupClassName?: string | undefined;
    defaultValue?: Moment;
    value?: Moment | null | string;
    onChange?: (value?: Moment | null) => void;
};

// 增加/减少时间 避免初始值为时间错时组件报错
export const VariableDatePicker: FC<StampDatePickerProps> = ({
    defaultValue,
    value,
    onChange,
    ...props
}) => {
    return isString(value) ? null : (
        <DatePicker
            defaultValue={defaultValue}
            value={value}
            onChange={onChange}
            {...props}
        />
    );
};
