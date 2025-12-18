import { API, FileIcon, MicroAppContext } from "@applet/common";
import { useContext, useEffect, useRef, useState } from "react";

export interface IDoc {
    name: string;
    docid: string;
    size: number;
}

interface ThumbnailProps {
    doc: IDoc;
    className: string;
    type?: string;
}

const MaxRequestTimes = 30;

export const Thumbnail = ({
    doc,
    className,
    type = "24*24",
}: ThumbnailProps) => {
    const [url, setUrl] = useState("");
    const { microWidgetProps } = useContext(MicroAppContext);
    const requestTimes = useRef(0);

    const getThumbnail = async () => {
        try {
            const { data } = await API.openDoc.apiOpenDocV1FileThumbnailGet(
                doc.docid.slice(-32),
                type,
                microWidgetProps?.token?.getToken?.access_token || "",
                "false"
            );
            if ((data as any).url) {
                setUrl((data as any).url);
            }
        } catch (error: any) {
            // 转码中
            if (
                error.response.data.code === 503008001 &&
                requestTimes.current < MaxRequestTimes
            ) {
                setTimeout(() => {
                    requestTimes.current = requestTimes.current + 1;
                    getThumbnail();
                }, 1000);
                return;
            }
            console.error(error);
        }
    };

    useEffect(() => {
        if (doc.size === -1) {
            return;
        }
        const supportType =
            /\.(jpg|jpeg|gif|bmp|png|wmf|emf|svg|tga|tif|ai|psb|psd)$/;
        if (supportType.test(doc.name)) {
            getThumbnail();
        }
    }, []);

    return url ? (
        <img className={className} src={url} alt="" />
    ) : (
        <FileIcon name={doc.name} size={doc.size} className={className} />
    );
};
