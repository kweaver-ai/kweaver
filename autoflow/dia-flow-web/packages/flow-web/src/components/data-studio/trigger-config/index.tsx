import { useMemo, useRef, useState } from "react";
import {
  Cron,
  CronActions,
  Event,
  EventActions,
  Manual,
  ManualActions,
  TriggerType,
} from "./helper";
import styles from "./trigger-config.module.less";
import { Button, Space } from "antd";
import { useTranslate } from "@applet/common";
import { Tile } from "../../editor/tile";
import { useTranslateExtension } from "../../extension-provider";
import { DocLibType } from "./select-doclib/helper";
import { FlowDetail } from "../types";
import { includes, omit } from "lodash";
import ChangeVersionModal from "../change-version-modal";

const Actions = {
  ...CronActions,
  ...EventActions,
  ...ManualActions,
};

export interface Trigger {
  operator: string;
  dataSource?: {
    operator: string;
    parameters: {
      docids: string[];
      docs?: { docid: string; path: string; doc_lib_type: DocLibType }[];
      depth: number;
    };
  };
  cron?: string;
  parameters?: {
    docids?: string[];
    accessorid?: string;
  };
}

const getDataSourceOperator: Record<string, string> = {
  "@trigger/dataflow-tag": "@anyshare-data/tag-tree",
  "@trigger/dataflow-dept": "@anyshare-data/dept-tree",
  "@trigger/dataflow-user": "@anyshare-data/user",
  "@trigger/dataflow-doc": "@anyshare-data/list-files",
};

const TriggerConfig = ({
  flowDetail,
  onFinish,
  onCancel,
  isTemplCreate,
  onBack,
  isEditTrigger,
}: {
  flowDetail: FlowDetail;
  onFinish: (value: any) => void;
  onCancel: () => void;
  isTemplCreate?: boolean;
  onBack?: () => void;
  isEditTrigger?: boolean;
}) => {
  const {
    trigger_config: { operator, dataSource, ...parameters } = { operator: "" },
    steps,
  } = flowDetail;
  const dataSourceOperator = (steps && steps[0]?.operator) || "";
  const Triggers: any =
    steps && steps[0]?.operator === "@trigger/dataview"
      ? {
          [TriggerType.Cron]: Cron,
          [TriggerType.Manual]: Manual,
        }
      : {
          [TriggerType.Cron]: Cron,
          [TriggerType.Event]: Event,
          [TriggerType.Manual]: Manual,
        };

  // 数据源为非结构类型（文件）时才可选择【适用范围】
  const isFile = dataSourceOperator === "@trigger/dataflow-doc";
  const isTag = dataSourceOperator === "@trigger/dataflow-tag";
  const onlyOneStep = [...(!isFile ? [TriggerType.Manual] : [])];

  const t = useTranslate();
  const tCron = useTranslateExtension("cron");

  const [step, setStep] = useState<number>(
    operator && !includes(onlyOneStep, Actions[operator]?.trigger) ? 1 : 0
  );

  const [currentOperator, setCurrentOperator] = useState<string | null>(
    operator
  );
  const [currentTrigger, setCurrentTrigger] = useState<TriggerType>(
    Actions[currentOperator!]?.trigger
  );
  const [currentParameters, setCurrentParameters] = useState<any>(parameters);
  const [currrentDSParameters, setCurrrentDSParameters] = useState<any>(
    (() => {
      if (isTag) {
        return {};
      }

      if (isFile) {
        return dataSource?.parameters || parameters?.parameters || {};
      }

      return { accessorid: "00000000-0000-0000-0000-000000000000" };
    })()
  );

  const selectRef = useRef<{ validate: () => Promise<boolean> }>();
  const configRef = useRef<{ validate: () => Promise<boolean> }>();
  const targetRef = useRef<{ validate: () => Promise<boolean> }>();

  const { OperatorSelect, DataSource } = useMemo(() => {
    if (currentTrigger) {
      return Triggers[currentTrigger]?.components || {};
    }

    return {};
  }, [currentTrigger]);

  const {
    components: { Config },
    allowDataSource,
  } = useMemo(() => {
    if (currentOperator) {
      try {
        return Actions[currentOperator];
      } catch {}
    }

    return { components: {}, allowDataSource: false };
  }, [currentOperator]) || { components: {}, allowDataSource: false };

  const confirm = async (
    trigger: any,
    operator: string,
    data?: any
  ): Promise<void> => {
    const validate = await Promise.all([
      selectRef.current ? selectRef.current.validate() : Promise.resolve(true),
      configRef.current ? configRef.current.validate() : Promise.resolve(true),
      targetRef.current ? targetRef.current.validate() : Promise.resolve(true),
    ]).then((results) => results.every((result) => result));

    if (validate) {
      let trigger_config = {};

      if (trigger === TriggerType.Cron || trigger === TriggerType.Manual) {
        let dataSource = {};

        dataSource = {
          dataSource: {
            operator: getDataSourceOperator[dataSourceOperator] || "",
            parameters: isTemplCreate
              ? currrentDSParameters
              : omit(currrentDSParameters, ["docs"]),
          },
        };

        trigger_config = {
          operator,
          ...dataSource,
          ...currentParameters,
          ...data,
        };
      }

      if (trigger === TriggerType.Event) {
        trigger_config = {
          operator,
          parameters: isTemplCreate
            ? currrentDSParameters
            : omit(currrentDSParameters, ["docs", "depth"]),
        };
      }

      onFinish(trigger_config);
    }
  };

  return (
    <div className={styles["container"]}>
      <div className={styles["trigger-content"]}>
        {step === 0 ? (
          <>
            <div className={styles["mode"]}>
              {t("datastudio.trigger.selectMode", "请选择触发方式")}
            </div>
            <div>
              {Object.values(Triggers).map((trigger: any) => {
                const { name, description, icon } = trigger;
                const translateName = t(`datastudio.trigger.${name}`);
                const translateDescription = t(
                  `datastudio.trigger.${description}`
                );

                return (
                  <Tile
                    className={styles["trigger-mode-item"]}
                    name={translateName}
                    description={translateDescription}
                    icon={icon || ""}
                    selected={name === Actions[currentOperator!]?.trigger}
                    onClick={() => {
                      setCurrentTrigger(trigger.name);

                      if (trigger.name !== currentTrigger) {
                        setCurrentOperator(null);
                        setCurrentParameters({});
                      }

                      if (includes(onlyOneStep, trigger.name)) {
                        confirm(
                          trigger.name,
                          Triggers[trigger?.name as TriggerType]
                            ?.defaultOperator
                        );

                        return;
                      }

                      setStep((step) => step + 1);
                    }}
                  />
                );
              })}
            </div>
          </>
        ) : (
          <div>
            {OperatorSelect ? (
              <OperatorSelect
                ref={selectRef}
                parameters={{ operator: currentOperator }}
                dataSourceOperator={dataSourceOperator}
                onChange={({ operator }: { operator: string }) => {
                  setCurrentOperator((preOperator) => {
                    if (operator !== preOperator) {
                      setCurrentParameters({});

                      if (isFile) {
                        setCurrrentDSParameters({});
                      }
                    }

                    return operator;
                  });
                }}
              />
            ) : null}
            {Config ? (
              <Config
                ref={configRef}
                t={tCron}
                parameters={currentParameters}
                onChange={(value: any) => {
                  setCurrentParameters(value);
                }}
              />
            ) : null}
            {isFile && DataSource && allowDataSource ? (
              <DataSource
                ref={targetRef}
                parameters={currrentDSParameters}
                onChange={(value: any) => {
                  setCurrrentDSParameters(value);
                }}
              />
            ) : null}
          </div>
        )}
      </div>
      {step === 1 ? (
        <div className={styles["trigger-footer"]}>
          <Button onClick={isTemplCreate ? onBack : () => setStep(step - 1)}>
            {t("back", "返回")}
          </Button>
          <Space>
            {!isEditTrigger ? (
              <Button
                type="primary"
                className="automate-oem-primary-btn"
                onClick={() =>
                  confirm(currentTrigger, currentOperator as string)
                }
              >
                {t("ok", "确定")}
              </Button>
            ) : (
              <ChangeVersionModal
                dagId={flowDetail?.id}
                onSaveVersion={(data) =>
                  confirm(currentTrigger, currentOperator as string, data)
                }
              >
                <Button type="primary" className="automate-oem-primary-btn">
                  {t("ok", "确定")}
                </Button>
              </ChangeVersionModal>
            )}
            <Button onClick={onCancel}>{t("cancel", "取消")}</Button>
          </Space>
        </div>
      ) : null}
    </div>
  );
};

export { TriggerConfig };
