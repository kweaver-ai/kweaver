import { useCallback } from "react";
import { useTranslate } from "./use-translate";

export type PermStr =
    | "cache"
    | "delete"
    | "modify"
    | "create"
    | "download"
    | "preview"
    | "display";

export interface AsPermValue {
    allow: PermStr[];
    deny?: PermStr[];
}

export const AllPerms: PermStr[] = [
    "display",
    "preview",
    "cache",
    "download",
    "create",
    "modify",
    "delete",
];

export function useFormatPermText() {
    const t = useTranslate("common.asPermSelect");
    return useCallback(
        (value: AsPermValue) => {
            if (Array.isArray(value.allow) || Array.isArray(value.deny)) {
                const allowText = value.allow
                    ?.sort((a, b) => {
                        return AllPerms.indexOf(a) - AllPerms.indexOf(b)
                    })
                    ?.map((perm) => t(`perm.${perm}`))
                    ?.join("/");

                if (!value.deny?.length) {
                    return allowText;
                }

                if (value.deny?.length === AllPerms.length) {
                    return t("denyAll");
                }

                const denyText = t("permTextDeny", {
                    denyText: value.deny
                        ?.sort((a, b) => {
                            return AllPerms.indexOf(a) - AllPerms.indexOf(b)
                        })
                        .map((perm) => t(`perm.${perm}`))
                        .join("/"),
                });
                if (value.allow?.length === 0) {
                    return denyText;
                }

                return `${allowText} ${denyText}`;
            }
            return "";
        },
        [t]
    );
}
