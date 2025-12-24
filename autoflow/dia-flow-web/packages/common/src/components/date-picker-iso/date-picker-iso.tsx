import { DatePicker, DatePickerProps } from "antd";
import moment, { Moment } from "moment";
import React, { FC, useCallback, useMemo } from "react";

const AntDatePicker: any = DatePicker;

export type DatePickerISOProps = Omit<
    DatePickerProps,
    "defaultValue" | "value" | "onChange"
> & {
    showTime?: boolean;
    popupClassName?: string | undefined;
    defaultValue?: string;
    value?: string;
    onChange?: (value?: string) => void;
};

export const DatePickerISO: FC<DatePickerISOProps> = ({
    defaultValue,
    value,
    onChange,
    ...props
}) => {
    const defaultTime = useMemo(
        () => (defaultValue ? moment(defaultValue) : null),
        [defaultValue]
    );
    const time = useMemo(() => (value ? moment(value) : null), [value]);
    const onTimeChange = useCallback(
        (time: Moment) => {
            onChange && onChange(time?.toISOString() || undefined);
        },
        [onChange]
    );

    return (
        <AntDatePicker
            defaultValue={defaultTime}
            value={time}
            onChange={onTimeChange}
            {...props}
        />
    );
};
