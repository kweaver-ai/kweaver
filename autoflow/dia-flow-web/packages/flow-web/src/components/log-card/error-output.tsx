import { formatSize, useTranslate } from "@applet/common";
import { useContext } from "react";
import { ExtensionContext } from "../extension-provider";

interface ErrorOutputProps {
    error: any;
    operator?: string;
}

export const ErrorOutput = ({ error, operator = "" }: ErrorOutputProps) => {
    const t = useTranslate();
    let errorText = t("err.log.internalError", "服务器内部错误。");
    const { globalConfig } = useContext(ExtensionContext);

    if(error === "token not exist") {
        errorText = t("log.auth.expires", "授权已过期。")
    }

    if (error?.errorcode) {
        switch (true) {
            case error.errorcode === "ContentAutomation.UnAuthorization":
                errorText = t("err.log.expires", "授权已过期。");
                break;
            case error.errorcode === "ContentAutomation.NoPermission":
                errorText = t(
                    "err.log.noPermission",
                    "您对文档没有显示权限。",
                    { name: error?.errordetails?.doc?.docname }
                );
                break;
            case error.errorcode === "ContentAutomation.TaskNotFound" &&
                operator === "@docinfo/entity/extract":
                errorText = t("err.ability.notFound", "该自定义能力已不存在。");
                break;
            case error.errorcode === "ContentAutomation.FileContentUnknow":
                errorText = t("err.log.contentUnknow", "目标内容获取失败");
                break;
            case error.errorcode === "ContentAutomation.FileSizeExceed": {
                if (error?.errordetails?.limit) {
                    const size = formatSize(error.errordetails.limit, 0) || "-";
                    errorText = t("err.log.fileSizeExceed.size", {
                        size,
                    });
                } else {
                    errorText = t(
                        "err.log.fileSizeExceed",
                        "文件已超过100M文件大小的限制。"
                    );
                    if (operator.indexOf("@cognitive-assistant") > -1) {
                        errorText = t(
                            "err.log.fileSizeExceed.10m",
                            "文件已超过10M文件大小的限制。"
                        );
                    }
                    if (operator === "@audio/transfer") {
                        errorText =
                            t(
                                "err.log.fileSizeExceed.audio",
                                "文件大小只支持500M以内"
                            ) + t("period", "。");
                    }
                }
                break;
            }

            case error.errorcode === "ContentAutomation.NotContainPageData":
                errorText = t(
                    "err.log.notContainPageData",
                    "只支持Word和PDF类型的文件"
                );
                break;
            case error.errorcode === "ContentAutomation.FileTypeNotSupported": {
                if (error?.errordetails?.doc?.supportType) {
                    errorText = t("err.log.fileTypeNotSupported.type", {
                        type: error.errordetails.doc.supportType,
                    });
                } else {
                    errorText =
                        globalConfig?.["@anyshare/ocr/general"] === "fileReader"
                            ? t(
                                  "err.log.fileTypeNotSupported",
                                  "只支持图片/PDF格式文件"
                              )
                            : t(
                                  "err.log.imgTypeNotSupported",
                                  "只支持图片格式文件"
                              );
                    if (operator === "@audio/transfer") {
                        errorText =
                            t(
                                "err.log.fileTypeNotSupported.audio",
                                "只支持音频格式文件"
                            ) + t("period", "。");
                    }
                }
                break;
            }
            case error.errorcode === "ContentAutomation.InternalError":
            case error.errorcode ===
                "ContentAutomation.InternalError.ErrorDepencyService": {
                let errordetail = error?.errordetails;
                if (typeof errordetail === "string") {
                    if (errordetail.startsWith("body")) {
                        errordetail = errordetail.slice(
                            errordetail.indexOf("{"),
                            errordetail.lastIndexOf("}") + 1
                        );
                    }
                    try {
                        errordetail = JSON.parse(errordetail);
                        if (errordetail?.body && errordetail.body?.code) {
                            errordetail = errordetail.body;
                        }
                    } catch (error) {
                        console.error(error);
                    }
                }
                if (errordetail?.code) {
                    switch (errordetail.code) {
                        case 403002019:
                            errorText = t(
                                "err.log.403002019",
                                "无法在同一位置下移动文档"
                            );
                            break;
                        case 403001002:
                            errorText = t(
                                "err.log.403001002",
                                "没有权限执行此操作。"
                            );
                            break;
                        case 403002056:
                            errorText = t(
                                "err.log.403002056",
                                "没有权限操作目标位置的对象。"
                            );
                            break;
                        case 403001108:
                        case 403002065:
                            errorText = t(
                                "err.log.securityLevel",
                                "您对该文档密级权限不足。"
                            );
                            break;
                        case 403002039:
                            errorText = t(
                                "err.log.403002039",
                                "存在同类型的同名文件名。"
                            );
                            break;
                        case 403002040:
                            errorText = t(
                                "err.log.403002040",
                                "存在同类型的同名文件，但无修改权限。"
                            );
                            break;
                        case 400000000:
                            errorText = t("err.log.400000000", "参数错误。");
                            break;
                        case 404002005:
                            errorText = t(
                                "err.log.404002005",
                                "顶级文档库不存在。"
                            );
                            break;
                        case 404002013:
                        case 404002006:
                        case 404001024:
                            errorText = t(
                                "err.log.404002006",
                                "请求的文件或目录不存在。"
                            );
                            break;
                        case 403001171:
                            errorText = t(
                                "err.log.frozen",
                                "您的账号已被冻结。"
                            );
                            break;
                        case 403001203:
                            errorText = t(
                                "err.log.readPolicy",
                                "当前文档受策略管控。"
                            );
                            break;
                        case 403001031:
                            errorText = t(
                                "err.log.403001031",
                                "当前文档已被锁定。",
                                {
                                    name: error?.errordetails?.detail?.locker,
                                }
                            );
                            break;
                        case 400002012:
                            errorText = t(
                                "err.log.400002012",
                                '名称不能包含下列任何字符： \\/:*?"<>|'
                            );
                            break;
                        case 403003210:
                            errorText = t("err.log.403003210", {
                                count: error?.errordetails?.detail?.catalogue
                                    .file_template_upper_limit,
                            });
                            break;
                        case 404003032:
                            errorText = t(
                                "err.log.404003032",
                                "该编目模板已被删除。"
                            );
                            break;
                        case 404003036:
                            errorText = t(
                                "err.log.404003036",
                                "该编目的属性已被变更。"
                            );
                            break;
                        case 404019001:
                            errorText = t(
                                "err.log.404019001",
                                "所选人员不存在"
                            );
                            break;
                    }
                }
                break;
            }

            default:
                errorText = t("err.log.internalError", "服务器内部错误。");
        }
    }

    return (
        <div>
            <span>{t("log.error", "错误信息：")}</span>
            <span>{errorText}</span>
        </div>
    );
};
