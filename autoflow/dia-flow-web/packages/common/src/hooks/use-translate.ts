import { useCallback } from "react";
import { useIntl } from "react-intl";

export interface TranslateFn {
    (id: string): string;
    (id: string, defaultMessage: string): string;
    (id: string, values: Record<string, any>): string;
    (id: string, defaultMessage: string, values: Record<string, any>): string;
}

export function useTranslate(prefix?: string) {
    const intl = useIntl();
    return useCallback<TranslateFn>(
        (
            id: string,
            defaultMessage?: string | Record<string, any>,
            values?: Record<string, any>
        ) => {
            if (prefix) {
                id = `${prefix}.${id}`;
            }
            if (typeof defaultMessage === "object") {
                return intl.formatMessage(
                    {
                        id: id,
                    },
                    defaultMessage
                );
            }
            return intl.formatMessage({ id, defaultMessage }, values);
        },
        [intl, prefix]
    );
}
