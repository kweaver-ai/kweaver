import { useTranslate } from "@applet/common";
import { DatePicker, DatePickerProps } from "antd";
import moment, { Moment } from "moment";
import { FC, useCallback, useMemo } from "react";

const AntDatePicker: any = DatePicker;

export type FormDatePickerProps = Omit<
    DatePickerProps,
    "defaultValue" | "value" | "onChange"
> & {
    showTime?: boolean;
    showNow?: boolean;
    popupClassName?: string | undefined;
    defaultValue?: string;
    value?: string;
    onChange?: (value?: string) => void;
};

const format = "YYYY/MM/DD HH:mm";

const range = (start: number, end: number) => {
    const result = [];
    for (let i = start; i < end; i += 1) {
        result.push(i);
    }
    return result;
};

export const getDisabledDate = (current: Moment) =>
    current < moment().add(-1, "day").endOf("day");

export const getDisabledTime = (date: Moment) => {
    const hours = moment().hours();
    const minutes = moment().minutes();
    // 当日只能选择当前时间之后的时间点
    if (
        (date &&
            moment(date).format("YYYY/MM/DD") ===
                moment().format("YYYY/MM/DD")) ||
        !date
    ) {
        if (moment(date).hours() === hours || !date) {
            return {
                disabledHours: () => range(0, 24).splice(0, hours),
                disabledMinutes: () => range(0, 60).splice(0, minutes + 1),
            };
        }
        return {
            disabledHours: () => range(0, 24).splice(0, hours),
            disabledMinutes: () => [],
        };
    }

    if (
        date &&
        moment(date).format("YYYY/MM/DD") < moment().format("YYYY/MM/DD")
    ) {
        return {
            disabledHours: () => range(0, 24).splice(0, 24),
            disabledMinutes: () => range(0, 60).splice(0, 60),
        };
    }

    return {
        disabledHours: () => [],
        disabledMinutes: () => [],
    };
};

export const FormDatePicker: FC<FormDatePickerProps> = ({
    defaultValue,
    value,
    onChange,
    ...props
}) => {
    const t = useTranslate();
    const defaultTime = useMemo(
        () => (defaultValue ? moment(defaultValue) : null),
        [defaultValue]
    );
    const time = useMemo(() => (value ? moment(value) : null), [value]);
    const onTimeChange = useCallback(
        (time: Moment) => {
            onChange && onChange(time?.toISOString() || "");
        },
        [onChange]
    );

    return (
        <AntDatePicker
            defaultValue={defaultTime}
            value={time}
            onChange={onTimeChange}
            placeholder={t("neverExpires")}
            format={format}
            disabledDate={getDisabledDate}
            disabledTime={getDisabledTime}
            {...props}
        />
    );
};
