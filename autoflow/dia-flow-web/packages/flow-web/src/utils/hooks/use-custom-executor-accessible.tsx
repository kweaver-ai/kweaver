import { API } from "@applet/common";
import useSWR from "swr";

const ExecutorWhiteListKey = "automation_custom_executor";

export enum TabFields {
    ProcessTemplate = 'process_template',
    AICapabilities = 'ai_capabilities'
}

export function useCustomExecutorAccessible() {
    const { data = false } = useSWR<boolean>(
        `/api/appstore/v1/app/${ExecutorWhiteListKey}/accessible`,
        async (url) => {
            try {
                const { data } = await API.axios.get<{ enable: boolean }>(url);
                return data.enable;
            } catch (e) { }
            return false;
        }
    );

    return data;
}

const queryParams = new URLSearchParams({
    key: [
        TabFields.AICapabilities,
        TabFields.ProcessTemplate
    ].join(',')
});

// tab启用配置
export function useTilterTabs() {
    const { data } = useSWR<Record<TabFields, boolean>>(
        `/api/automation/v1/configs?${queryParams.toString()}`,
        async (url: string): Promise<Record<TabFields, boolean>> => {
            try {
                const { data: { configs } } = await API.axios.get<{ configs: readonly { key: TabFields, value: '0' | '1' }[] }>(url);

                let enabledTabs = {} as Record<TabFields, boolean>

                configs.forEach(({ key, value }) => enabledTabs[key] = value === '1')

                return enabledTabs;
            } catch (e) {
                return {} as Record<TabFields,boolean>;
            }
        }
    );

    return data;
}
