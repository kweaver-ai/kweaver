import { MicroAppContext, useTranslate } from "@applet/common";
import { Steps as AntSteps, Button, Drawer, Space } from "antd";
import clsx from "clsx";
import { find } from "lodash";
import {
  FC,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";
import { DataSourceConfig as CronDataSourceConfig } from "../../extensions/cron/data-source-config";
import { useDrawerScroll } from "../../utils/hooks";
import { Group, Trigger, TriggerAction, Validatable } from "../extension";
import {
  ExtensionContext,
  useTranslateExtension,
  useTrigger,
} from "../extension-provider";
import { ActionList } from "./action-list";
import { DataSourceConfig as ManualDataSourceConfig } from "./data-source-config";
import { EditorContext } from "./editor-context";
import styles from "./editor.module.less";
import { IStep } from "./expr";
import { StepConfigContext } from "./step-config-context";
import { TriggerList } from "./trigger-list";

export interface TriggerConfigProps {
  step?: IStep;
  onFinish?(step: IStep): void;
  onCancel?(): void;
}

export const TriggerConfig: FC<TriggerConfigProps> = ({
  step,
  onFinish,
  onCancel,
}) => {
  const { message, platform } = useContext(MicroAppContext);
  const [current, setCurrent] = useState(0);
  const { extensions, triggers, isDataStudio } = useContext(ExtensionContext);
  const [action, trigger, extension] = useTrigger(step?.operator);
  const { getPopupContainer } = useContext(EditorContext);
  const [currentExtension, setCurrentExtension] = useState(extension);
  const [currentTrigger, setCurrentTrigger] = useState(trigger);
  const [currentAction, setCurrentAction] = useState(action);
  const t = useTranslate();
  const te = useTranslateExtension(currentExtension?.name);
  const [parameters, setParameters] = useState<any>(step?.parameters);
  const [dataSource, setDataSource] = useState<IStep | undefined>(
    step?.dataSource
  );
  const showScrollShadow = useDrawerScroll(!!step);
  const [params] = useSearchParams();

  useLayoutEffect(() => {
    const type = params.get("type");
    if (type && !step?.operator) {
      const filterByName = (
        extensionName: string,
        triggerName: string,
        actionName?: string
      ) => {
        const extension = extensions.filter(
          (item) => item.name === extensionName
        )[0];
        setCurrentExtension(extension);
        const trigger = extension?.triggers?.filter(
          (item) => item.name === triggerName
        )[0];
        setCurrentTrigger(trigger);
        if (trigger?.actions.length === 1) {
          if (
            trigger.actions[0].components?.Config ||
            trigger.actions[0].allowDataSource
          ) {
            setCurrent(2);
          } else {
            onFinish &&
              onFinish({
                id: step!.id,
                operator: trigger.actions[0].operator,
              });
          }
        } else {
          setCurrent(1);
        }

        if (actionName) {
          const action = trigger?.actions.filter(
            (item) => item.name === actionName
          )[0];
          action && setCurrentAction(action);
          if (action?.components?.Config || action?.allowDataSource) {
            setCurrent(2);
          } else {
            onFinish &&
              onFinish({
                id: step!.id,
                operator: action?.operator!,
              });
          }
        }
      };
      switch (type) {
        case "manual":
          filterByName("internal", "TManual");
          break;
        // case "form":
        //     filterByName("internal", "TManual", "TAForm");
        //     break;
        case "cron":
          filterByName("cron", "TCron");
          break;
        // 事件触发
        case "event":
          filterByName("anyshare", "TDocument");
      }
    }
  }, []);

  useLayoutEffect(() => {
    if (step?.operator) {
      const [action, trigger, extension] = triggers[step.operator] || [];
      setCurrentExtension(extension);
      setCurrentTrigger(trigger);
      setCurrentAction(action);
      setParameters(step.parameters);
      setDataSource(step.dataSource);

      if (action && (action.components?.Config || action.allowDataSource)) {
        setCurrent(2);
      } else if (trigger && trigger.actions.length > 1) {
        setCurrent(1);
      } else {
        setCurrent(0);
      }
    }
  }, [step?.operator, step?.parameters, step?.dataSource, triggers]);
  const configRef = useRef<Validatable>(null);
  const dataSourceConfigRef = useRef<Validatable>(null);

  const content = useMemo(() => {
    switch (current) {
      case 0: {
        const ungrouped: Trigger[] = [];
        const grouped: Record<string, Trigger[]> = {};
        const groups: Group[] = [];

        extensions?.forEach((extension) => {
          extension?.triggers?.forEach((trigger) => {
            trigger.extensionName = extension.name;
            if (trigger?.group) {
              if (!grouped[trigger.group.group]) {
                grouped[trigger.group.group] = [trigger];
                groups.push(trigger.group);
              } else {
                grouped[trigger.group.group].push(trigger);
              }
            } else {
              ungrouped.push(trigger);
            }
          });
        });

        const onChange = (item: Trigger) => {
          const extension = find(extensions, {
            name: item.extensionName,
          });
          setCurrentExtension(extension);
          setCurrentTrigger(item);
          if (item.actions.length === 1) {
            if (
              item.actions[0].components?.Config ||
              item.actions[0].allowDataSource
            ) {
              if (currentAction !== item.actions[0]) {
                setCurrentAction(item.actions[0]);
                setParameters(undefined);
                setDataSource(undefined);
              }
              setCurrent(current + 2);
            } else {
              onFinish &&
                onFinish({
                  id: step!.id,
                  operator: item.actions[0].operator,
                });
            }
          } else {
            if (item !== currentTrigger) {
              setCurrentAction(undefined);
              setParameters(undefined);
              setDataSource(undefined);
            }
            setCurrent(current + 1);
          }
        };
        return (
          <div>
            {/* <div className={styles.sectionTitle}>
                            {t(
                                "editor.triggerConfigTip",
                                "您想在哪里触发任务 或 选择怎样的方式触发任务："
                            )}
                        </div> */}
            {/* <div className={styles.tileWrapper}> */}
            {ungrouped?.length ? (
              <TriggerList
                triggers={ungrouped}
                current={currentTrigger}
                onChange={onChange}
              />
            ) : null}
            {groups.map((group) => (
              <>
                <TriggerList
                  key={group.group}
                  current={currentTrigger}
                  onChange={onChange}
                  triggers={grouped[group.group]}
                  group={group}
                />
              </>
            ))}
            {/* </div> */}
          </div>
        );
      }
      case 1: {
        const ungrouped: TriggerAction[] = [];
        const grouped: Record<string, TriggerAction[]> = {};
        currentTrigger?.groups?.forEach(({ group }) => {
          grouped[group] = [];
        });
        currentTrigger?.actions?.forEach((action) => {
          if (action.group && grouped[action.group]) {
            grouped[action.group].push(action);
          } else {
            ungrouped.push(action);
          }
        });
        const onChange = (item: TriggerAction) => {
          setCurrentAction(item);
          if (item !== currentAction) {
            setParameters(undefined);
          }
          if (item?.components?.Config || item.allowDataSource) {
            setCurrent(current + 1);
          } else {
            onFinish &&
              onFinish({
                id: step!.id,
                operator: item.operator,
              });
          }
        };
        return (
          <div className={styles.section}>
            {ungrouped?.length ? (
              <ActionList
                extension={currentExtension!}
                actions={ungrouped}
                current={currentAction}
                onChange={onChange}
              />
            ) : null}
            {currentTrigger?.groups?.map((group) => {
              if (grouped[group.group].length) {
                return (
                  <ActionList
                    key={group.group}
                    extension={currentExtension!}
                    group={group}
                    actions={grouped[group.group]}
                    current={currentAction}
                    onChange={onChange}
                  />
                );
              }
              return null;
            })}
          </div>
        );
      }
      case 2: {
        const Config: any = currentAction?.components?.Config;
        const DataSourceConfig =
          currentAction!.operator?.indexOf("@trigger/cron") > -1
            ? CronDataSourceConfig
            : ManualDataSourceConfig;

        return (
          <div className={styles.section}>
            {Config ? (
              <Config
                // key={step?.id}
                ref={configRef}
                action={currentAction!}
                t={te}
                parameters={parameters}
                onChange={setParameters}
              />
            ) : null}
            {currentAction?.allowDataSource ? (
              <DataSourceConfig
                ref={dataSourceConfigRef}
                step={dataSource}
                onChange={setDataSource}
              />
            ) : null}
          </div>
        );
      }
      default: {
        return null;
      }
    }
  }, [
    current,
    extensions,
    currentExtension,
    currentAction,
    currentTrigger,
    onFinish,
    t,
    te,
    step,
    parameters,
    dataSource,
  ]);

  return (
    <StepConfigContext.Provider value={{ step }}>
      <Drawer
        className={clsx(styles.configDrawer, {
          "show-scroll-shadow": showScrollShadow,
        })}
        open={!!step}
        maskClosable={false}
        onClose={onCancel}
        width={528}
        push={false}
        afterOpenChange={(open) => {
          if (!open) {
            setCurrent(0);
            setCurrentAction(undefined);
            setCurrentTrigger(undefined);
            setCurrentExtension(undefined);
            setParameters(undefined);
            setDataSource(undefined);
          }
        }}
        getContainer={getPopupContainer}
        style={platform === "client" ? { position: "absolute" } : undefined}
        title={
          <>
            <div className={styles.configTitle}>
              {isDataStudio
                ? t("datastudio.selectsource", "选择数据源")
                : t("editor.triggerConfigTitle", "选择触发器")}
            </div>
            {!isDataStudio ? (
              <AntSteps
                className={styles.configSteps}
                current={current}
                size="small"
                onChange={(cur) => {
                  if (cur > 0 && !currentTrigger) {
                    message.info(
                      t("editor.triggerConfigStepMessage", "请先完成前面的步骤")
                    );
                    return;
                  }

                  if (cur > 1 && !currentAction) {
                    message.info(
                      t("editor.triggerConfigStepMessage", "请先完成前面的步骤")
                    );
                    return;
                  }

                  setCurrent(cur);
                }}
              >
                <AntSteps.Step
                  stepIndex={0}
                  title={t("editor.triggerConfigStep1", "选择触发类型")}
                />
                <AntSteps.Step
                  stepIndex={1}
                  title={t("editor.triggerConfigStep2", "选择动作")}
                />
                <AntSteps.Step
                  stepIndex={2}
                  title={t("editor.triggerConfigStep3", "详细设置")}
                />
              </AntSteps>
            ) : (
              <div style={{ marginBottom: "-10px", opacity: "0.45" }}>
                {current === 0
                  ? t("datastudio.selectdatasource", "请选择数据源类型")
                  : t("datastudio.selectdatastructure", "请选择数据结构的类型")}
              </div>
            )}
          </>
        }
        footerStyle={{
          display: "flex",
          borderTop: "none",
          padding: "10px 16px",
        }}
        footer={
          isDataStudio ? (
            current > 0 ? (
              <>
                <Button
                  style={{ marginRight: "100px" }}
                  onClick={() => {
                    if (
                      currentAction?.operator === "@trigger/form" ||
                      currentAction?.operator === "@trigger/dataview"
                    ) {
                      setCurrent((current) => current - 2);
                      return;
                    }
                    setCurrent((current) => current - 1);
                  }}
                >
                  {t("datastudio.trigger.back", "返回")}
                </Button>
                {(currentAction?.operator === "@trigger/form" ||
                  currentAction?.operator.startsWith("@trigger/operator/") ||
                  currentAction?.operator === "@trigger/dataview") && (
                  <Space style={{ marginLeft: "auto" }}>
                    <Button
                      type="primary"
                      onClick={async () => {
                        const validateResult = await Promise.allSettled([
                          typeof configRef?.current?.validate === "function"
                            ? configRef.current.validate()
                            : true,
                          typeof dataSourceConfigRef.current?.validate ===
                          "function"
                            ? dataSourceConfigRef.current.validate()
                            : true,
                        ]);
                        if (
                          validateResult.every(
                            (v) => v.status === "fulfilled" && v.value
                          ) &&
                          typeof onFinish === "function"
                        ) {
                          onFinish({
                            id: step!.id,
                            operator: currentAction!.operator,
                            parameters,
                            dataSource: currentAction?.allowDataSource
                              ? dataSource
                              : undefined,
                          });
                        }
                      }}
                    >
                      {t("ok", "确定")}
                    </Button>
                    <Button onClick={onCancel}>{t("cancel", "取消")}</Button>
                  </Space>
                )}
              </>
            ) : null
          ) : current === 2 ? (
            <Space style={{ marginLeft: "auto" }}>
              <Button
                type="primary"
                className="automate-oem-primary-btn"
                onClick={async () => {
                  const validateResult = await Promise.allSettled([
                    typeof configRef?.current?.validate === "function"
                      ? configRef.current.validate()
                      : true,
                    typeof dataSourceConfigRef.current?.validate === "function"
                      ? dataSourceConfigRef.current.validate()
                      : true,
                  ]);
                  if (
                    validateResult.every(
                      (v) => v.status === "fulfilled" && v.value
                    ) &&
                    typeof onFinish === "function"
                  ) {
                    onFinish({
                      id: step!.id,
                      operator: currentAction!.operator,
                      parameters,
                      dataSource: currentAction?.allowDataSource
                        ? dataSource
                        : undefined,
                    });
                  }
                }}
              >
                {t("ok", "确定")}
              </Button>
              <Button onClick={onCancel}>{t("cancel", "取消")}</Button>
            </Space>
          ) : null
        }
      >
        {content}
      </Drawer>
    </StepConfigContext.Provider>
  );
};
