import { useContext, useMemo } from "react";
import { useTranslate } from "@applet/common";
import ReactJsonView from "react-json-view";
import { ExtensionContext, useTranslateExtension } from "../extension-provider";
import { isObject } from "lodash";

interface PopoverErrorReasonProps {
  record?: any;
}

const BeautyJsonView: any = ReactJsonView;
const JsonView = ({ data }: { data: object }) => {
    return (
        <BeautyJsonView
            src={data}
            name={false}
            displayDataTypes={false}
            displayObjectSize={false}
            enableClipboard={false}
        />
    );
};

export const PopoverErrorReason = ({ record }: PopoverErrorReasonProps) => {
  const t = useTranslate();
  const { triggers, executors } = useContext(ExtensionContext);

  const logData: any = useMemo(() => {
    if (record?.reason?.actionName) {
      const operator = record?.reason?.actionName;
      // 触发器节点
      if (operator.indexOf("trigger") > -1) {
        return triggers[operator] || [];
      }
      //  AnyShare文档操作节点/工具方法节点
      else {
        return executors[operator] || [];
      }
    }
    // 空节点
    return [];
  }, [record, triggers, executors]);

  const extensionName =
    (logData?.length && logData[logData?.length - 1]?.name) || "anyshare";

  const __t = useTranslateExtension(extensionName);

  const getTitle = (logData: any, log?: any) => {
    if (log?.name) {
      return log?.name;
    }
    if (!logData) {
      return "---";
    }
    let title = logData[0]?.name;

    const operator = logData[0]?.operator;
    if (title && operator) {
      switch (true) {
        case /^@internal\/text/.test(operator):
          return __t("EText", "文本处理") + __t("colon", "：") + __t(title);
        default:
          return __t(title);
      }
    }
    return "";
  };

  return (
    <div
      style={{
        maxWidth: "400px",
        wordBreak: "break-word",
      }}
    >
      <p>
        <span style={{ color: "rgba(0, 0, 0, 0.55" }}>{t("failed.node")}</span>
        {getTitle(logData, record?.reason) || "---"}
      </p>
      <p style={{ color: "rgba(0, 0, 0, 0.55" }}>{t("reason.for.failure")}</p>
      {typeof record?.reason === "object" ? (
        <>
         {isObject(record?.reason?.detail) ? <JsonView data={record?.reason?.detail} /> : String(record?.reason?.detail)}
        </>
      ) : (
        <span>{record?.reason || "--"}</span>
      )}
    </div>
  );
};
