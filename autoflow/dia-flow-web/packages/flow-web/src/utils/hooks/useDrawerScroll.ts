import { throttle } from "lodash";
import { useState, useEffect, useCallback } from "react";

const useDrawerScroll = (open: boolean) => {
    const [showScrollShadow, setShowShadow] = useState(false);

    const handleScroll = useCallback(() => {
        const drawer = document.getElementsByClassName(
            `${ANT_PREFIX}-drawer-open`
        );
        if (drawer.length > 0) {
            const contentDom = drawer[0].getElementsByClassName(
                `${ANT_PREFIX}-drawer-body`
            )[0];
            setShowShadow(
                contentDom.clientHeight + contentDom.scrollTop !==
                    contentDom.scrollHeight
            );
            return contentDom;
        }
        return undefined;
    }, []);

    useEffect(() => {
        const contentDom = handleScroll();
        let mutationObserver: MutationObserver;
        if (contentDom) {
            contentDom.addEventListener("scroll", handleScroll);
            window.addEventListener("resize", throttle(handleScroll, 1000));
            mutationObserver = new MutationObserver(() => {
                setShowShadow(
                    contentDom.clientHeight + contentDom.scrollTop !==
                        contentDom.scrollHeight
                );
            });
            mutationObserver.observe(contentDom, {
                childList: true, // 子节点的变动
                attributes: true, // 属性的变动
                characterData: true, // 节点内容或节点文本的变动
                subtree: true, // 将观察器应用于该节点的后代节点
            });
        }

        return () => {
            contentDom?.removeEventListener("scroll", handleScroll);
            window?.removeEventListener("resize", handleScroll);
            if (mutationObserver) {
                mutationObserver?.disconnect();
            }
        };
    }, [handleScroll, open]);

    return showScrollShadow;
};

export { useDrawerScroll };
