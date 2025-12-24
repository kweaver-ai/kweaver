import {
    createRef,
    forwardRef,
    useImperativeHandle,
    useMemo,
    useState,
} from "react";
import { Button } from "antd";
import { PlusOutlined } from "@applet/icons";
import { TranslateFn } from "@applet/common";
import { ParamsConfig } from "./params-config";
import styles from "./styles/custom-params-input.module.less";

export interface ValidateParams {
    validate?(): boolean | Promise<boolean>;
}

interface CustomProps {
    t: TranslateFn;
    type: "input" | "output";
    value?: Param[];
    onChange?: (params?: Param[]) => void;
    scope?: number[];
}

export enum ParamType {
    Int = "int",
    String = "string",
    Array = "array",
    Object = "object",
}

export interface Param {
    id: string;
    key: string;
    type?: ParamType;
    value?: string;
}

export const CustomInput = forwardRef<ValidateParams, CustomProps>(
    (props, ref) => {
        const { t, type, value, onChange, scope } = props;
        const [isKeyRepeat, setKeyRepeat] = useState(false);
        useImperativeHandle(ref, () => {
            return {
                async validate() {
                    const isValid = await validateAll();
                    const isValidName = validateName();
                    return isValid && isValidName;
                },
            };
        });

        const allParams = useMemo(() => {
            if (value?.length) {
                return [...value];
            }
            return [];
        }, [type, value]);

        const refs = useMemo(
            () => allParams.map(() => createRef<ValidateParams>()),
            [allParams]
        );

        const handleChange = (index: number, param: Param) => {
            allParams[index].key = param.key;
            allParams[index].type = param.type;
            if (type === "input") {
                (allParams[index] as Param).value = param.value;
            }
            onChange && onChange(allParams);
        };

        const handleAdd = () => {
            const newArr = [
                ...allParams,
                "input"
                    ? {
                          id: Math.random().toString(36).slice(2, 7),
                          key: "",
                          type: ParamType.String,
                          value: undefined,
                      }
                    : {
                          id: Math.random().toString(36).slice(2, 7),
                          key: "",
                          type: ParamType.String,
                      },
            ];
            onChange && onChange(newArr);
        };

        const handleDelete = (index: number) => {
            const newArr = [...allParams];
            newArr.splice(index, 1);
            if (onChange) {
                if (newArr.length > 0) {
                    onChange(newArr);
                } else {
                    onChange([]);
                }
                if (isKeyRepeat) {
                    validateName(newArr);
                }
            }
        };

        // 校验是否变量重名
        const validateName = (arr?: Param[]) => {
            let validateArr = allParams;
            if (typeof arr !== "undefined") {
                validateArr = arr;
            }
            const hash: any = {};
            let isValid = true;
            for (let i = 0; i < validateArr.length; i += 1) {
                const key = validateArr[i].key;
                // 新建多个未编辑时忽略
                if (key === "") {
                    continue;
                }
                if (hash[key]) {
                    isValid = false;
                    break;
                }
                hash[validateArr[i].key] = validateArr[i];
            }
            setKeyRepeat(!isValid);
            return isValid;
        };

        // 检验是否有变量为空
        const validateAll = async () => {
            const results = await Promise.allSettled(
                refs.map((validate) => {
                    if (typeof validate?.current?.validate === "function") {
                        return validate.current.validate();
                    }
                    return true;
                })
            );
            return results.every(
                (result) => result.status === "fulfilled" && result.value
            );
        };

        return (
            <div>
                {allParams.length > 0 &&
                    allParams.map((item: Param, index) => (
                        <ParamsConfig
                            ref={refs[index]}
                            t={t}
                            key={`${type}-${index}-${item.id}`}
                            index={index}
                            param={item}
                            paramsType={type}
                            onChange={handleChange}
                            onValidateName={validateName}
                            onDelete={handleDelete}
                            scope={scope}
                        />
                    ))}
                <Button
                    type="link"
                    className={styles["link-btn"]}
                    icon={<PlusOutlined className={styles["add-icon"]} />}
                    onClick={handleAdd}
                >
                    {t("tool.params.add", "添加")}
                </Button>
                {isKeyRepeat && (
                    <div className={styles["valid-tip"]}>{t("repeatKey")}</div>
                )}
            </div>
        );
    }
);
