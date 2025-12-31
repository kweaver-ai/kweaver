import { MicroAppContext, useTranslate } from "@applet/common";
import { Steps as AntSteps, Button, Drawer, Segmented, Space } from "antd";
import clsx from "clsx";
import {
  FC,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDrawerScroll } from "../../utils/hooks";
import { ExecutorAction, Validatable } from "../extension";
import {
  ExtensionContext,
  useExecutor,
  useTranslateExtension,
} from "../extension-provider";
import { ActionList } from "./action-list";
import { EditorContext } from "./editor-context";
import styles from "./editor.module.less";
import { ExecutorList } from "./executor-list";
import { IStep } from "./expr";
import { StepConfigContext } from "./step-config-context";
import { StepsSettings } from "../../extensions/anyshare/steps-settings";
import { hasConfigOperator } from "./utils";

export interface ExecutorConfigProps {
  step?: IStep;
  onFinish?(step: IStep): void;
  onCancel?(): void;
}

export const ExecutorConfig: FC<ExecutorConfigProps> = ({
  step,
  onFinish,
  onCancel,
}) => {
  const { message, platform } = useContext(MicroAppContext);
  const [current, setCurrent] = useState(0);
  const { extensions, executors } = useContext(ExtensionContext);
  const [action, executor, extension] = useExecutor(step?.operator);
  const [currentExtension, setCurrentExtension] = useState(extension);
  const [currentExecutor, setCurrentExecutor] = useState(executor);
  const [currentAction, setCurrentAction] = useState(action);
  const t = useTranslate();
  const te = useTranslateExtension(currentExtension?.name);
  const [parameters, setParameters] = useState<any>(step?.parameters);
  const { getId, getPopupContainer } = useContext(EditorContext);
  const showScrollShadow = useDrawerScroll(!!step);
  const [settings, setSettings] = useState<any>(step?.settings);
  const [nodeConfig, setNodeConfig] = useState(1);

  useLayoutEffect(() => {
    if (step?.operator) {
      const [action, executor, extension] = executors[step.operator] || [];
      setCurrentExtension(extension);
      setCurrentExecutor(executor);
      setCurrentAction(action);
      setParameters(step.parameters);
      setNodeConfig(1);

      if (action && action.components?.Config) {
        setCurrent(2);
      } else if (executor && executor.actions.length > 1) {
        setCurrent(1);
      } else {
        setCurrent(0);
      }
    }
  }, [step?.operator, step?.parameters, executors]);
  const configRef = useRef<Validatable>(null);

  const content = useMemo(() => {
    switch (current) {
      case 0: {
        return (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              {t(
                "editor.executorConfigTip",
                "您想在哪里执行任务 或 选择怎样的方式执行任务："
              )}
            </div>
            <div className={styles.tileWrapper}>
              {extensions.map((extension) => (
                <ExecutorList
                  key={extension.name}
                  extension={extension}
                  current={currentExecutor}
                  onChange={(item) => {
                    setCurrentExtension(extension);
                    setCurrentExecutor(item);
                    if (item.actions.length === 1) {
                      if (item.actions[0].components?.Config) {
                        if (item.actions[0] !== currentAction) {
                          setCurrentAction(item.actions[0]);
                          setParameters(undefined);
                          setSettings(undefined);
                          setNodeConfig(1);
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
                      if (item !== currentExecutor) {
                        setCurrentAction(undefined);
                        setParameters(undefined);
                        setSettings(undefined);
                        setNodeConfig(1);
                      }
                      setCurrent(current + 1);
                    }
                  }}
                />
              ))}
            </div>
          </div>
        );
      }
      case 1: {
        const ungrouped: ExecutorAction[] = [];
        const grouped: Record<string, ExecutorAction[]> = {};
        currentExecutor?.groups?.forEach(({ group }) => {
          grouped[group] = [];
        });
        currentExecutor?.actions?.forEach((action) => {
          if (action.group && grouped[action.group]) {
            grouped[action.group].push(action);
          } else {
            ungrouped.push(action);
          }
        });
        const onChange = (item: ExecutorAction) => {
          setCurrentAction(item);
          if (item !== currentAction) {
            setParameters(undefined);
          }
          if (typeof item.components?.Config) {
            setCurrent(current + 1);
          } else {
            onFinish &&
              onFinish({
                id: getId(),
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
            {currentExecutor?.groups?.map((group) => {
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
        return (
          <div className={styles.section}>
            {Config && step ? (
              <>
                {!hasConfigOperator({
                  operator: currentAction!.operator,
                  parameters,
                }) &&
                  platform !== "operator" && (
                    <Segmented
                      className={styles["step-segmented"]}
                      value={nodeConfig}
                      onChange={(val: any) => {
                        setNodeConfig(val);
                      }}
                      options={[
                        { label: t("edit.base.settings"), value: 1 },
                        { label: t('edit.advanced.settings'), value: 2 },
                      ]}
                    />
                  )}
                {nodeConfig === 1 ? (
                  <Config
                    key={step?.id}
                    ref={configRef}
                    action={currentAction!}
                    t={te}
                    parameters={parameters}
                    onChange={setParameters}
                  />
                ) : (
                  <StepsSettings
                    step={{
                      ...step,
                      operator: currentAction!.operator,
                    }}
                    onChange={(settings: any) => {
                      setSettings(settings);
                    }}
                  />
                )}
              </>
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
    currentExecutor,
    onFinish,
    te,
    t,
    getId,
    step,
    parameters,
    nodeConfig,
    settings,
  ]);

  return (
    <StepConfigContext.Provider value={{ step }}>
      <Drawer
        className={clsx(styles.configDrawer, {
          "show-scroll-shadow": showScrollShadow,
        })}
        open={!!step}
        push={false}
        maskClosable={false}
        onClose={onCancel}
        width={
          currentExecutor?.name === "sqlWrite.name" && current === 2
            ? 1024
            : 528
        }
        afterOpenChange={(open) => {
          if (!open) {
            setCurrent(0);
            setCurrentAction(undefined);
            setCurrentExecutor(undefined);
            setCurrentExtension(undefined);
            setParameters(undefined);
            setSettings(undefined);
            setNodeConfig(1);
          }
        }}
        getContainer={getPopupContainer}
        style={platform === "client" ? { position: "absolute" } : undefined}
        title={
          <>
            <div className={styles.configTitle}>
              {t("editor.executorConfigTitle", "选择执行操作")}
            </div>
            <AntSteps
              className={styles.configSteps}
              current={current}
              size="small"
              onChange={(cur) => {
                if (cur > 0 && !currentExecutor) {
                  message.info(
                    t("editor.executorConfigStepMessage", "请先完成前面的步骤")
                  );
                  return;
                }

                if (cur > 1 && !currentAction) {
                  message.info(
                    t("editor.executorConfigStepMessage", "请先完成前面的步骤")
                  );
                  return;
                }

                setCurrent(cur);
              }}
            >
              <AntSteps.Step
                stepIndex={0}
                title={t("editor.executorConfigStep1", "选择执行类型")}
              />
              <AntSteps.Step
                stepIndex={1}
                title={t("editor.executorConfigStep2", "选择动作")}
              />
              <AntSteps.Step
                stepIndex={2}
                title={t("editor.executorConfigStep3", "详细设置")}
              />
            </AntSteps>
          </>
        }
        footerStyle={{
          display: "flex",
          justifyContent: "flex-end",
          borderTop: "none",
        }}
        footer={
          current === 2 ? (
            <Space>
              <Button
                type="primary"
                className="automate-oem-primary-btn"
                onClick={async () => {
                  if (typeof configRef?.current?.validate === "function") {
                    try {
                      if (await configRef?.current?.validate()) {
                        onFinish &&
                          onFinish({
                            id: step!.id,
                            operator: currentAction!.operator,
                            parameters,
                            settings: settings || step?.settings,
                          });
                      } else {
                        console.log("Invalid");
                      }
                    } catch (e) {
                      console.log(e);
                    }
                  } else {
                    onFinish &&
                      onFinish({
                        id: step!.id,
                        operator: currentAction!.operator,
                        parameters,
                        settings: settings || step?.settings,
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
