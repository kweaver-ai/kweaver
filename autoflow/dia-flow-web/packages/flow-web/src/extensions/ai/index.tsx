import {
  ExecutorAction,
  ExecutorActionConfigProps,
  ExecutorActionInputProps,
  ExecutorActionOutputProps,
  Extension,
  Output,
  Validatable,
} from "../../components/extension";
import zhCN from "./locales/zh-cn.json";
import zhTW from "./locales/zh-tw.json";
import enUS from "./locales/en-us.json";
import viVN from "./locales/vi-vn.json";
import OcrSVG from "./assets/ocr.svg";
import OcrEleinvoiceSVG from "./assets/ocr-eleinvoice.svg";
import OcrIdcardSVG from "./assets/ocr-idcard.svg";
import CognitiveAssistantSVG from "./assets/cognitive-assistant.svg";
import AudioSVG from "./assets/audio.svg";
import {
  ForwardedRef,
  forwardRef,
  useContext,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
} from "react";
import { Form, Typography } from "antd";
import { FormItem } from "../../components/editor/form-item";
import { AsFileSelect } from "../../components/as-file-select";
import styles from "./index.module.less";
import { ExtensionContext } from "../../components/extension-provider";
import { TranslateFn } from "@applet/common";
import { DocPromptAction, MeetPromptAction } from "./custom-prompt-action";
import { CustomExtractAction } from "./custom-extract-action";
import { ChatCompletionAction } from "./chat-completion-action";
import { CallAgentAction } from "./call-agent";
import { EmbeddingAction } from "./embedding-action";
import { RerankerAction } from "./reranker-action";

export function useConfigForm(parameters: any, ref: ForwardedRef<Validatable>) {
  const [form] = Form.useForm();

  useImperativeHandle(ref, () => {
    return {
      validate() {
        return form.validateFields().then(
          () => true,
          () => false
        );
      },
    };
  });

  useLayoutEffect(() => {
    form.setFieldsValue(parameters);
  }, [form, parameters]);

  return form;
}

export function isVariableLike(value: any) {
  return typeof value === "string" && /^\{\{(__(\d+).*)\}\}$/.test(value);
}

export function isGNSLike(value: any) {
  return typeof value === "string" && /^gns:\/(\/[0-9A-F]{32})+$/.test(value);
}

const ocrSupportExtensions = [
  ".pdf",
  //图片类型
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".tif",
  ".bmp",
];

const getPlaceholder = (globalConfig: Record<string, any>, t: TranslateFn) =>
  globalConfig?.["@anyshare/ocr/general"] === "fileReader"
    ? t("ocr.sourcePlaceholder")
    : t("ocr.sourcePlaceholder.img");

const getSupportExtensions = (globalConfig: Record<string, any>) =>
  globalConfig?.["@anyshare/ocr/general"] === "fileReader"
    ? ocrSupportExtensions
    : ocrSupportExtensions.filter((i) => i !== ".pdf");

const OcrInvoice: ExecutorAction = {
  name: "EAOcrInvoice",
  description: "EAOcrInvoiceDescription",
  operator: "@anyshare/ocr/eleinvoice",
  icon: OcrEleinvoiceSVG,
  outputs: [
    {
      key: ".invoice_code",
      type: "string",
      name: "EAOcrInvoiceOutputCode",
    },
    {
      key: ".invoice_number",
      type: "string",
      name: "EAOcrInvoiceOutputNumber",
    },
    {
      key: ".title",
      type: "string",
      name: "EAOcrInvoiceOutputTitle",
    },
    {
      key: ".issue_date",
      type: "string",
      name: "EAOcrInvoiceOutputDate",
    },
    {
      key: ".buyer_name",
      type: "string",
      name: "EAOcrInvoiceOutputBuyerName",
    },
    {
      key: ".buyer_tax_id",
      type: "string",
      name: "EAOcrInvoiceOutputBuyerId",
    },
    {
      key: ".item_name",
      type: "string",
      name: "EAOcrInvoiceOutputItemName",
    },
    {
      key: ".amount",
      type: "string",
      name: "EAOcrInvoiceOutputAmount",
    },
    {
      key: ".total_amount_in_words",
      type: "string",
      name: "EAOcrInvoiceOutputAmountInWords",
    },
    {
      key: ".total_amount_numeric",
      type: "string",
      name: "EAOcrInvoiceOutputAmountInNumeric",
    },
    {
      key: ".seller_name",
      type: "string",
      name: "EAOcrInvoiceOutputSellerName",
    },
    {
      key: ".seller_tax_id",
      type: "string",
      name: "EAOcrInvoiceOutputSellerTaxId",
    },
    {
      key: ".total_amount_excluding_tax",
      type: "string",
      name: "EAOcrInvoiceOutputTotalAmount",
    },
    {
      key: ".total_tax_amount",
      type: "string",
      name: "EAOcrInvoiceOutputTotalTaxAmount",
    },
    {
      key: ".verification_code",
      type: "string",
      name: "EAOcrInvoiceOutputTaxCode",
    },
    {
      key: ".tax_rate",
      type: "string",
      name: "EAOcrInvoiceOutputTaxRate",
    },
    {
      key: ".tax_amount",
      type: "string",
      name: "EAOcrInvoiceOutputTaxAmount",
    },
    {
      key: ".results",
      type: "ocrResult",
      name: "EAOcrInvoiceOutputResult",
    },
  ],
  validate(parameters) {
    return (
      parameters &&
      (isVariableLike(parameters.docid) || isGNSLike(parameters.docid))
    );
  },
  components: {
    Config: forwardRef(
      ({ t, parameters, onChange }: ExecutorActionConfigProps, ref) => {
        const form = useConfigForm(parameters, ref);
        const { globalConfig } = useContext(ExtensionContext);

        return (
          <Form
            form={form}
            layout="vertical"
            initialValues={parameters}
            onFieldsChange={() => onChange(form.getFieldsValue())}
          >
            <FormItem
              required
              label={t("ocrGeneral.source")}
              name="docid"
              allowVariable
              type="asFile"
              rules={[
                {
                  required: true,
                  message: t("emptyMessage"),
                },
              ]}
            >
              <AsFileSelect
                title={t("fileSelectTitle")}
                multiple={false}
                omitUnavailableItem
                selectType={1}
                supportExtensions={getSupportExtensions(globalConfig)}
                notSupportTip={getPlaceholder(globalConfig, t)}
                placeholder={getPlaceholder(globalConfig, t)}
                selectButtonText={t("select")}
              />
            </FormItem>
          </Form>
        );
      }
    ),
    FormattedInput: ({ t, input }: ExecutorActionInputProps) => (
      <table>
        <tbody>
          <tr>
            <td className={styles.label}>
              <Typography.Paragraph
                ellipsis={{
                  rows: 2,
                }}
                className="applet-table-label"
                title={t("ocrGeneral.source", "要识别的文件") + t("id", "ID")}
              >
                {t("ocrGeneral.source", "要识别的文件") + t("id", "ID")}
              </Typography.Paragraph>
              {t("colon", "：")}
            </td>
            <td>{input.docid}</td>
          </tr>
        </tbody>
      </table>
    ),
    FormattedOutput: ({
      t,
      outputData,
      outputs,
    }: ExecutorActionOutputProps) => (
      <table>
        <tbody>
          {outputs &&
            (outputs as Output[]).map((item: Output) => {
              const label = t(item.name);
              const key = item.key.replace(".", "");
              let value = outputData[key];
              if (key === "results") {
                value =
                  typeof value === "string"
                    ? outputData.results
                    : JSON.stringify(outputData?.results).replace(/\u00A0/g, ' ');
              }
              if (label) {
                return (
                  <tr>
                    <td className={styles.label}>
                      <Typography.Paragraph
                        ellipsis={{
                          rows: 2,
                        }}
                        className="applet-table-label"
                        title={label}
                      >
                        {label}
                      </Typography.Paragraph>
                      {t("colon", "：")}
                    </td>
                    <td
                      style={{
                        overflowX: "hidden",
                      }}
                    >
                      {value}
                    </td>
                  </tr>
                );
              }
              return null;
            })}
        </tbody>
      </table>
    ),
  },
};

const OcrCard: ExecutorAction = {
  name: "EAOcrCard",
  description: "EAOcrCardDescription",
  operator: "@anyshare/ocr/idcard",
  icon: OcrIdcardSVG,
  outputs: [
    {
      key: ".name",
      type: "string",
      name: "EAOcrCardOutputName",
    },
    {
      key: ".gender",
      type: "string",
      name: "EAOcrCardOutputGender",
    },
    {
      key: ".date_of_birth",
      type: "string",
      name: "EAOcrCardOutputBirth",
    },
    {
      key: ".ethnicity",
      type: "string",
      name: "EAOcrCardOutputEthnicity",
    },
    {
      key: ".address",
      type: "string",
      name: "EAOcrCardOutputAddress",
    },
    {
      key: ".id_number",
      type: "string",
      name: "EAOcrCardOutputId",
    },
    {
      key: ".issuing_authority",
      type: "string",
      name: "EAOcrCardOutputAuthority",
    },
    {
      key: ".expiration_date",
      type: "string",
      name: "EAOcrCardOutputExpiration",
    },
    {
      key: ".results",
      type: "ocrResult",
      name: "EAOcrCardOutputResult",
    },
  ],
  validate(parameters) {
    return (
      parameters &&
      (isVariableLike(parameters.docid) || isGNSLike(parameters.docid))
    );
  },
  components: {
    Config: forwardRef(
      ({ t, parameters, onChange }: ExecutorActionConfigProps, ref) => {
        const form = useConfigForm(parameters, ref);
        const { globalConfig } = useContext(ExtensionContext);

        return (
          <Form
            form={form}
            layout="vertical"
            initialValues={parameters}
            onFieldsChange={() => onChange(form.getFieldsValue())}
          >
            <FormItem
              required
              label={t("ocrGeneral.source")}
              name="docid"
              allowVariable
              type="asFile"
              rules={[
                {
                  required: true,
                  message: t("emptyMessage"),
                },
              ]}
            >
              <AsFileSelect
                title={t("fileSelectTitle")}
                multiple={false}
                omitUnavailableItem
                selectType={1}
                supportExtensions={getSupportExtensions(globalConfig)}
                notSupportTip={getPlaceholder(globalConfig, t)}
                placeholder={getPlaceholder(globalConfig, t)}
                selectButtonText={t("select")}
              />
            </FormItem>
          </Form>
        );
      }
    ),
    FormattedInput: ({ t, input }: ExecutorActionInputProps) => (
      <table>
        <tbody>
          <tr>
            <td className={styles.label}>
              <Typography.Paragraph
                ellipsis={{
                  rows: 2,
                }}
                className="applet-table-label"
                title={t("ocrGeneral.source", "要识别的文件") + t("id", "ID")}
              >
                {t("ocrGeneral.source", "要识别的文件") + t("id", "ID")}
              </Typography.Paragraph>
              {t("colon", "：")}
            </td>
            <td>{input.docid}</td>
          </tr>
        </tbody>
      </table>
    ),
    FormattedOutput: ({
      t,
      outputData,
      outputs,
    }: ExecutorActionOutputProps) => (
      <table>
        <tbody>
          {outputs &&
            (outputs as Output[]).map((item: Output) => {
              const label = t(item.name);
              const key = item.key.replace(".", "");
              let value = outputData[key];
              if (key === "results") {
                value =
                  typeof value === "string"
                    ? outputData.results
                    : JSON.stringify(outputData?.results);
              }
              if (label) {
                return (
                  <tr>
                    <td className={styles.label}>
                      <Typography.Paragraph
                        ellipsis={{
                          rows: 2,
                        }}
                        className="applet-table-label"
                        title={label}
                      >
                        {label}
                      </Typography.Paragraph>
                      {t("colon", "：")}
                    </td>
                    <td
                      style={{
                        overflowX: "hidden",
                      }}
                    >
                      {value}
                    </td>
                  </tr>
                );
              }
              return null;
            })}
        </tbody>
      </table>
    ),
  },
};

const OcrGeneral: ExecutorAction = {
  name: (config: Record<string, any>) => {
    if (config?.["@anyshare/ocr/general"] === "ocr") {
      return "EAOcrGeneralImg";
    }
    return "EAOcrGeneral";
  },
  description: (config: Record<string, any>) => {
    if (config?.["@anyshare/ocr/general"] === "ocr") {
      return "EAOcrGeneralImgDescription";
    }
    return "EAOcrGeneralDescription";
  },
  operator: "@anyshare/ocr/general",
  icon: OcrSVG,
  outputs: [
    {
      key: ".results",
      type: "ocrResult",
      name: "EAOcrGeneralOutputResult",
    },
  ],
  validate(parameters: any) {
    return (
      parameters &&
      (isVariableLike(parameters.docid) || isGNSLike(parameters.docid))
    );
  },
  components: {
    Config: forwardRef<any, any>(
      ({ t, parameters, onChange }: ExecutorActionConfigProps, ref) => {
        const form = useConfigForm(parameters, ref);
        const { globalConfig, isDataStudio } = useContext(ExtensionContext);

        return (
          <Form
            form={form}
            layout="vertical"
            initialValues={parameters}
            onFieldsChange={() => onChange(form.getFieldsValue())}
          >
            <FormItem
              required
              label={t("ocrGeneral.source")}
              name="docid"
              allowVariable
              type="asFile"
              rules={[
                {
                  required: true,
                  message: t("emptyMessage"),
                },
              ]}
            >
              <AsFileSelect
                title={t("fileSelectTitle")}
                multiple={false}
                omitUnavailableItem
                selectType={1}
                readOnly={isDataStudio}
                supportExtensions={getSupportExtensions(globalConfig)}
                notSupportTip={getPlaceholder(globalConfig, t)}
                placeholder={getPlaceholder(globalConfig, t)}
                selectButtonText={t("select")}
              />
            </FormItem>
            {/* <Form.Item label={t("ocr.verify")}>
                            <SampleVerify t={t} />
                        </Form.Item> */}
          </Form>
        );
      }
    ),
    FormattedInput: ({ t, input }: ExecutorActionInputProps) => (
      <table>
        <tbody>
          <tr>
            <td className={styles.label}>
              <Typography.Paragraph
                ellipsis={{
                  rows: 2,
                }}
                className="applet-table-label"
                title={t("ocrGeneral.source", "要识别的文件") + t("id", "ID")}
              >
                {t("ocrGeneral.source", "要识别的文件") + t("id", "ID")}
              </Typography.Paragraph>
              {t("colon", "：")}
            </td>
            <td>{input.docid}</td>
          </tr>
        </tbody>
      </table>
    ),
    FormattedOutput: ({ t, outputData }: ExecutorActionOutputProps) => {
      const results = useMemo(() => {
        try {
          let res = outputData?.results;
          if (typeof res === "string") {
            res = JSON.parse(res);
          }
          let texts: string[] = [];
          if (typeof res === "object") {
            const subTaskList = res?.subTaskList;
            for (let i = 0; i < subTaskList.length; i += 1) {
              try {
                let result = res.subTaskList[i]?.result;
                if (typeof result === "string") {
                  result = JSON.parse(result);
                }

                texts = texts.concat(
                  result?.data?.json?.general_ocr_res?.texts || []
                );
              } catch (error) {
                console.error(error);
              }
            }
            return (texts || []).join("，");
          }
        } catch (error) {
          console.error(error);
        }
        return typeof outputData?.results === "string"
          ? outputData.results
          : JSON.stringify(outputData?.results).replace(/\u00A0/g, ' ');
      }, [outputData.results]);
      return (
        <table>
          <tbody>
            <tr>
              <td className={styles.label}>
                <Typography.Paragraph
                  ellipsis={{
                    rows: 2,
                  }}
                  className="applet-table-label"
                  title={t("EAOcrGeneralOutputResult")}
                >
                  {t("EAOcrGeneralOutputResult")}
                </Typography.Paragraph>
                {t("colon", "：")}
              </td>
              <td style={{ overflowX: "hidden" }}>{results}</td>
            </tr>
          </tbody>
        </table>
      );
    },
  },
} as any;

const AudioTransfer: ExecutorAction = {
  name: "EAAudio",
  description: "EAAudioDescription",
  operator: "@audio/transfer",
  icon: AudioSVG,
  allowDataSource: true,
  outputs: [
    {
      key: ".result",
      type: "string",
      name: "EAAudioOutputResult",
    },
  ],
  validate(parameters: any) {
    return (
      parameters &&
      (isVariableLike(parameters.docid) || isGNSLike(parameters.docid))
    );
  },
  components: {
    Config: forwardRef(
      ({ t, parameters, onChange }: ExecutorActionConfigProps, ref) => {
        const { isDataStudio } = useContext(ExtensionContext);
        const form = useConfigForm(parameters, ref as any);

        return (
          <Form
            form={form}
            layout="vertical"
            initialValues={parameters}
            onFieldsChange={() => onChange(form.getFieldsValue())}
          >
            <FormItem
              required
              label={t("audio.source", "识别文件")}
              name="docid"
              allowVariable
              type="asFile"
              rules={[
                {
                  required: true,
                  message: t("emptyMessage"),
                },
              ]}
            >
              <AsFileSelect
                title={t("fileSelectTitle")}
                readOnly={isDataStudio}
                multiple={false}
                omitUnavailableItem
                selectType={1}
                supportExtensions={[".mp3", ".wav", ".m4a", ".mp4"]}
                notSupportTip={t("type.notSupport")}
                placeholder={t("audio.sourcePlaceholder")}
                selectButtonText={t("select")}
              />
            </FormItem>
          </Form>
        );
      }
    ),
    FormattedInput: ({ t, input }: ExecutorActionInputProps) => (
      <table>
        <tbody>
          <tr>
            <td className={styles.label}>
              <Typography.Paragraph
                ellipsis={{
                  rows: 2,
                }}
                className="applet-table-label"
                title={t("audio.source", "识别文件") + t("id", "ID")}
              >
                {t("audio.source", "识别文件") + t("id", "ID")}
              </Typography.Paragraph>
              {t("colon", "：")}
            </td>
            <td>{input.docid}</td>
          </tr>
        </tbody>
      </table>
    ),
    FormattedOutput: ({ t, outputData }: ExecutorActionOutputProps) => (
      <table>
        <tbody>
          <tr>
            <td className={styles.label}>
              <Typography.Paragraph
                ellipsis={{
                  rows: 2,
                }}
                className="applet-table-label"
                title={t("EAAudioOutputResult")}
              >
                {t("EAAudioOutputResult")}
              </Typography.Paragraph>
              {t("colon", "：")}
            </td>
            <td>
              {typeof outputData?.result === "string"
                ? outputData.result
                : JSON.stringify(outputData?.result)}
            </td>
          </tr>
        </tbody>
      </table>
    ),
  },
} as any;

export const AIExtensionForDataStudio: Extension = {
  name: "ai",
  executors: [
    {
      name: "EAI",
      description: "EAIDescription",
      icon: CognitiveAssistantSVG,
      actions: [
        // OcrGeneral,
        // AudioTransfer,
        ChatCompletionAction,
        CallAgentAction,
        EmbeddingAction,
        RerankerAction,
      ],
    },
  ],
  translations: {
    zhCN,
    zhTW,
    enUS,
    viVN,
  },
};

export default {
    name: "ai",
    executors: [
        {
            name: "EAI",
            description: "EAIDescription",
            icon: CognitiveAssistantSVG,
            actions: [
                OcrInvoice,
                OcrCard,
                OcrGeneral,
                // DocPromptAction,
                // MeetPromptAction,
                // AudioTransfer,
                // CustomExtractAction,
                ChatCompletionAction,
                CallAgentAction,
                EmbeddingAction,
                RerankerAction,
            ],
        },
    ],
  translations: {
    zhCN,
    zhTW,
    enUS,
    viVN,
  },
} as Extension;
