import { FC, useContext, useMemo } from "react";
import { isFunction } from "lodash";
import { NavigationContext } from "@applet/common";
import { Executor, Extension } from "../extension";
import { ExtensionContext, useTranslateExtension } from "../extension-provider";
import { Tile } from "./tile";

export interface ExecutorListProps {
    current?: Executor;
    extension: Extension;
    onChange(item: Executor): void;
}

export const ExecutorList: FC<ExecutorListProps> = ({
    extension,
    current,
    onChange,
}) => {
    const te = useTranslateExtension(extension.name);
    const { globalConfig } = useContext(ExtensionContext);
    const { getLocale } = useContext(NavigationContext);
    // 适配导航栏OEM
    const documents = useMemo(() => {
        return getLocale && getLocale("documents");
    }, [getLocale]);

    return (
        <>
            {extension.executors?.map((item) => (
                <Tile
                    key={item.name}
                    name={
                        extension.name === "custom"
                            ? item.name
                            : item.name === "EDocument"
                            ? te("EDocumentCustom", { name: documents })
                            : isFunction(item.name)
                            ? te(item.name(globalConfig))
                            : te(item.name)
                    }
                    description={
                        extension.name === "custom"
                            ? (item.description as string) || ""
                            : isFunction(item.description)
                            ? te(item.description(globalConfig))
                            : te(item.description || "")
                    }
                    icon={item.icon}
                    selected={current === item}
                    onClick={() => onChange(item)}
                />
            ))}
        </>
    );
};
