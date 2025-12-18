import { useContext, useEffect, useRef } from "react";
import { MicroAppContext } from "@applet/common";

export default function AuditTemplate({}) {
  const { microWidgetProps } = useContext(MicroAppContext);
  const widgetElement = useRef(null);
  const microApp: any = useRef(null);

  useEffect(() => {
    const flowConfig = microWidgetProps?.config?.getMicroWidgetByName(
      "workflow-manage-client",
      true
    );
    setTimeout(() => {
      microApp.current = microWidgetProps?._qiankun?.loadMicroApp({
        name: flowConfig?.name,
        entry: flowConfig?.subapp?.entry,
        container: widgetElement.current,
        props: {
          microWidgetProps,
        },
        microWidgetProps,
      });
    }, 10);

    return () => {
      microApp.current?.unmount();
    };
  }, [widgetElement]);

  return (
    <>
      <div ref={widgetElement}></div>
    </>
  );
}
