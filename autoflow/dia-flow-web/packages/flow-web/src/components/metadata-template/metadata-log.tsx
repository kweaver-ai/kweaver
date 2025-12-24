import { useMemo } from "react";
import useSWR from "swr";
import { find } from "lodash";
import { API } from "@applet/common";
import { AttrValue } from "./render-item";
import styles from "./styles/metadata-template.module.less";
import { getDicts } from "../workflow-plugin-details";

export const MetadataLog = ({ t, templates }: any) => {
    // 数据字典

    const catalogs = useMemo(() => {
        return (Array.isArray(templates) ? templates : [templates]).filter(
            Boolean
        );
    }, [templates]);

    // 编目模板
    const { data } = useSWR(
        ["getMetaLogs"],
        () => {
            return API.metadata.metadataV1TemplatesGet(1000, 0, "aishu");
        },
        {
            revalidateOnFocus: false,
            onError(error: any) {
                console.error(error);
            },
        }
    );

    const dictItems = useMemo(() => {
        return getDicts(data?.data?.entries);
    }, [data?.data?.entries]);

    return (
        <>
            {catalogs &&
                catalogs.map((template) =>
                    Object.keys(template).map((key: any) => {
                        const currentTemplate = find(data?.data.entries, [
                            "key",
                            key,
                        ]);
                        if (currentTemplate?.fields) {
                            return (
                                <>
                                    <tr>
                                        <td className={styles.label}>
                                            {t(
                                                "metadata.selectTemplate",
                                                "选择编目模板"
                                            )}
                                            {t("colon", "：")}
                                        </td>
                                        <td>{currentTemplate?.display_name}</td>
                                    </tr>
                                    {currentTemplate?.fields.map((field) => (
                                        <tr>
                                            <td className={styles.label}>
                                                <div
                                                    className={
                                                        styles["label-wrapper"]
                                                    }
                                                    title={field.display_name}
                                                >
                                                    <div
                                                        className={
                                                            styles["label"]
                                                        }
                                                    >
                                                        {field.display_name}
                                                    </div>
                                                    {t("colon", "：")}
                                                </div>
                                            </td>
                                            <td>
                                                <AttrValue
                                                    type={field.type}
                                                    value={
                                                        template[key][field.key]
                                                    }
                                                    dicts={dictItems[key]}
                                                    useDict={Boolean(
                                                        (field as any)
                                                            ?.options_dict?.id
                                                    )}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </>
                            );
                        } else {
                            return null;
                        }
                    })
                )}
        </>
    );
};
