import { useCallback } from "react";
import API from "../api";
import { useTranslate } from "./use-translate";
import { efast } from "@applet/api";

export function useGetFilePath() {
    const t = useTranslate("common.useGetFilePath");

    return useCallback(async function getFilePathById(id: string) {
        const [
            {
                data: { namepath },
            },
            { data: libs },
        ] = await Promise.all([
            API.efast.efastV1FileConvertpathPost({
                docid: id,
            }),
            API.efast.efastV1ClassifiedEntryDocLibsGet(),
        ]);

        for (const lib of libs) {
            const libName = t(lib.id, lib.name);

            if (
                lib.doc_libs &&
                lib.doc_libs.some((item) => id.startsWith(item.id))
            ) {
                return `${libName}/${namepath}`;
            }

            if (lib.subtypes) {
                for (const subtype of lib.subtypes) {
                    if (
                        (subtype.doc_libs as unknown as efast.EntryDoc[]).some(
                            (item) => id.startsWith(item.id)
                        )
                    ) {
                        return `${subtype.name}/${namepath}`;
                    }
                }
            }
        }

        return namepath;
    }, []);
}
