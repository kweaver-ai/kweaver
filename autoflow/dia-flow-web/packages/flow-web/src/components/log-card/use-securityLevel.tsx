import { API } from "@applet/common";
import useSWR from "swr";

export const defaultCsflevel = {
  非密: 5,
  内部: 6,
  秘密: 7,
  机密: 8,
};

interface CsfLevelItem {
  value: number;
  name: string;
}

export function useSecurityLevel() {
  const { data: csflevel } = useSWR(
    `/api/document/v1/file-classifications`,
    async (url) => {
      try {
        const { data } = await API.axios.get<CsfLevelItem[]>(url);
        return Object.fromEntries(data.map((item) => [item.name, item.value]));
      } catch (e) {
        return defaultCsflevel;
      }
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return [csflevel];
}
