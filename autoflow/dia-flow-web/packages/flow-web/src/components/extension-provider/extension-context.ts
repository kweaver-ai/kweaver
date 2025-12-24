import { TranslateFn, useTranslate } from "@applet/common";
import { createContext, useCallback, useContext, useMemo } from "react";
import {
    Executor,
    ExecutorAction,
    Extension,
    Comparator,
    Trigger,
    TriggerAction,
    ValueType,
    DataSource,
} from "../extension/types";
import { ExtensionTranslatePrefix } from "./extension-provider";

export interface ExtensionContextType {
    extensions: Extension[];
    types: Record<string, [ValueType, Extension]>;
    triggers: Record<string, [TriggerAction, Trigger, Extension]>;
    executors: Record<string, [ExecutorAction, Executor, Extension]>;
    comparators: Record<string, [Comparator, Extension]>;
    dataSources: Record<string, [DataSource, Extension]>;
    globalConfig: Record<string, any>;
    reloadAccessableExecutors(): void;
    isDataStudio: boolean;
    reloadOperatorDataSource(): void;
}

export const ExtensionContext = createContext<ExtensionContextType>({
    extensions: [],
    types: {},
    triggers: {},
    executors: {},
    comparators: {},
    dataSources: {},
    globalConfig: {},
    reloadAccessableExecutors: () => { },
    isDataStudio: false,
     reloadOperatorDataSource: () => { },
});

export function useTrigger(operator?: string) {
    const { triggers } = useContext(ExtensionContext);
    return useMemo<[TriggerAction?, Trigger?, Extension?]>(
        () => (operator ? triggers[operator] || [] : []),
        [operator, triggers]
    );
}

export function useExecutor(operator?: string) {
    const { executors } = useContext(ExtensionContext);
    return useMemo<[ExecutorAction?, Executor?, Extension?]>(
        () => (operator ? executors[operator] || [] : []),
        [operator, executors]
    );
}

export function useComparator(operator?: string) {
    const { comparators } = useContext(ExtensionContext);
    return useMemo<[Comparator?, Extension?]>(
        () => (operator ? comparators[operator] || [] : []),
        [operator, comparators]
    );
}

export function useDataSource(operator?: string) {
    const { dataSources } = useContext(ExtensionContext);
    return useMemo<[DataSource?, Extension?]>(
        () => (operator ? dataSources[operator] || [] : []),
        [operator, dataSources]
    );
}

export interface TranslateExtension {
    (extension: string | undefined, id: string): string;
    (extension: string | undefined, id: string, defaultMessage: string): string;
    (
        extension: string | undefined,
        id: string,
        values: Record<string, any>
    ): string;
    (
        extension: string | undefined,
        id: string,
        defaultMessage: string,
        values: Record<string, any>
    ): string;
}

export function useExtensionTranslateFn(): TranslateExtension {
    const t = useTranslate();
    return useCallback(
        (
            extension,
            id,
            defaultMessage?: string | Record<string, any>,
            values?: Record<string, any>
        ) => {
            return t(
                extension
                    ? `${ExtensionTranslatePrefix}/${extension}/${id}`
                    : id,
                typeof defaultMessage === "string" ? defaultMessage : id,
                values ||
                (typeof defaultMessage !== "string" && defaultMessage) ||
                {}
            );
        },
        [t]
    );
}

export function useTranslateExtension(extension?: string): TranslateFn {
    const te = useExtensionTranslateFn();
    return useCallback(
        (
            id,
            defaultMessage?: string | Record<string, any>,
            values?: Record<string, any>
        ) => te(extension, id, defaultMessage as string, values as any),
        [te, extension]
    );
}
