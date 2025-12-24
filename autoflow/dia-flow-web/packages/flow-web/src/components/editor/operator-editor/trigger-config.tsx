import { MicroAppContext, useTranslate } from "@applet/common";
import { Button, Drawer } from "antd";
import clsx from "clsx";
import { FC, useContext, useLayoutEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDrawerScroll } from "../../../utils/hooks";
import { Validatable } from "../../extension";
import {
  ExtensionContext,
  useTranslateExtension,
  useTrigger,
} from "../../extension-provider";
import { EditorContext } from "../editor-context";
import styles from "../editor.module.less";
import { IStep } from "../expr";
import { StepConfigContext } from "../step-config-context";
import { OperatorFormTriggerAction } from "../../../extensions/internal/operator-form-trigger";

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
  const Config: any = OperatorFormTriggerAction?.components?.Config;
  const dataSourceConfigRef = useRef<Validatable>(null);
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
        const trigger = extension.triggers?.filter(
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
              设置开始算子
            </div>
          </>
        }
        footerStyle={{
          display: "flex",
          justifyContent: "flex-end",
          borderTop: "none",
        }}
        footer={
          <>
            <Button
              type="primary"
              className="automate-oem-primary-btn"
              style={{ marginRight: "20px" }}
              onClick={async () => {
                  const validateResult =
                      await Promise.allSettled([
                          typeof configRef?.current
                              ?.validate === "function"
                              ? configRef.current.validate()
                              : true,
                          typeof dataSourceConfigRef.current
                              ?.validate === "function"
                              ? dataSourceConfigRef.current.validate()
                              : true,
                      ]);
                  if (
                      validateResult.every(
                          (v) =>
                              v.status === "fulfilled" &&
                              v.value
                      ) &&
                      typeof onFinish === "function"
                  ) {
                      onFinish({
                          id: step!.id,
                          operator: "@trigger/form",
                          parameters,
                          dataSource:
                              currentAction?.allowDataSource
                                  ? dataSource
                                  : undefined,
                      });
                  }
              }}
          >
              {t("ok", "确定")}
          </Button>
            <Button onClick={onCancel}>{t("cancel", "取消")}</Button>
          </>
        }
      >
        <Config
          // key={step?.id}
          ref={configRef}
          action={currentAction!}
          t={te}
          parameters={parameters}
          onChange={setParameters}
        />
      </Drawer>
    </StepConfigContext.Provider>
  );
};
