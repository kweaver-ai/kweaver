import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
    Checkbox,
    DatePicker,
    DatePickerProps,
    Form,
    Input,
    Select,
    Tag,
} from "antd";
import clsx from "clsx";
import moment from "moment";
import {
    TemplateEntriesFieldBaseInfo,
    TemplateEntriesFieldBaseInfoString,
    TemplateEntriesFieldOptionBaseInfo,
} from "@applet/api/lib/metadata";
import {
    DescribeOutlined,
    IdcardColored,
    MailColored,
    TelephoneColored,
} from "@applet/icons";
import { API, MicroAppContext, TranslateFn } from "@applet/common";
import { VariableInput } from "../editor/form-item";
import { EditorContext } from "../editor/editor-context";
import { StepConfigContext } from "../editor/step-config-context";
import {
    TriggerStepNode,
    ExecutorStepNode,
    DataSourceStepNode,
    LoopOperator,
} from "../editor/expr";
import { Output } from "../extension";
import { isAccessable, isLoopVarAccessible } from "../editor/variable-picker";
import {
    AttrType,
    DictItemType,
    DurationTypeEnum,
    MetaDtaOptionColumn,
    StringTypeEnum,
} from "./metadata.type";
import styles from "./styles/render-item.module.less";
import { UserSelect } from "./as-user-select";
import { MetaDataContext } from "./metadata-template";
import { RightOutlined } from "@ant-design/icons";
import { isArray } from "lodash";

interface RenderItemProps {
    el: TemplateEntriesFieldBaseInfo;
    mode: "new" | "edit" | "view";
    isEditing: boolean; //编辑中则显示属性说明
    templateKey: string;
    t: TranslateFn;
    value?: any;
    onChange?: (value: any) => void;
}

interface ItemEditProps {
    attr: TemplateEntriesFieldBaseInfo | any;
    t: TranslateFn;
    value?: any;
    onChange?: (value: any) => void;
    dicts?: Record<string, any>;
}

const AntDatePicker: any = DatePicker;

const STRING_MAX_LENGTH = 512;
const LONG_STRING_MAX_LENGTH = 4096;

// 编辑模板
export const RenderItem = (props: RenderItemProps) => {
    const { el, mode, isEditing, t, value, onChange, templateKey } = props;
    const { dicts } = useContext(MetaDataContext);

    return (
        <div className={styles["render-item"]}>
            {mode === "view" ? (
                <ItemView
                    type={el.type}
                    value={value}
                    dicts={dicts?.[templateKey]}
                    useDict={Boolean((el as any)?.options_dict?.id)}
                />
            ) : (
                <ItemEdit
                    t={t}
                    attr={el}
                    value={value}
                    onChange={onChange}
                    dicts={dicts?.[templateKey]}
                />
            )}
            {isEditing && el?.description && (
                <div
                    className={clsx(styles["describe"], {
                        [styles.hidden]: !Boolean(el?.description),
                    })}
                    title={el?.description || ""}
                >
                    <DescribeOutlined />
                </div>
            )}
        </div>
    );
};

// 编辑模板
export const ItemEdit = ({
    attr,
    t,
    value,
    onChange,
    dicts,
}: ItemEditProps) => {
    const form = Form.useFormInstance();
    const shouldValidateChange = useRef(true);
    const [itemMulIds, setItemMulIds] = useState<string[]>([]);
    const [itemEnumIds, setItemEnumIds] = useState<string[]>([]);
    const [enumOpen, setEnumOpen] = useState<boolean>();

    const initItemValue = () => {
        if (attr.type === AttrType.DURATION) {
            onChange && onChange(0);
        } else if (
            attr.type === AttrType.MULTISELECT ||
            attr.type === AttrType.PERSONNEL
        ) {
            onChange && onChange([]);
        } else {
            onChange && onChange(null);
        }
    };

    const changeValue = (val: any) => {
        if (
            !shouldValidateChange.current &&
            form.getFieldError(attr.key).length > 0
        ) {
            shouldValidateChange.current = true;
        }

        if (val === undefined || val === null) {
            initItemValue();
        } else {
            onChange && onChange(val);
        }
        if (shouldValidateChange.current) {
            form.validateFields([attr.key]);
        }
    };

    const setInt = (val: any) => {
        const reg = /^\d*$/;
        if (reg.test(val)) {
            changeValue(val);
        }
    };

    const setFloat = (val: any) => {
        const reg = /^\d{0,9}(\.\d{0,6})?$/;
        if (reg.test(val)) {
            changeValue(val);
        }
    };

    useEffect(() => {
        if (value === undefined) {
            initItemValue();
        }
        if (
            attr.type === AttrType.STRING &&
            (attr as TemplateEntriesFieldBaseInfoString)?.check &&
            (attr as TemplateEntriesFieldBaseInfoString).check !== "not_check"
        ) {
            shouldValidateChange.current = false;
        }
    }, []);

    const changeTagHandle = (tags: string[]) => {
        changeValue(tags);
    };

    const changeBoxHandle = (selected: boolean, item: DictItemType) => {
        let itemArr = (value as string[]) || undefined;
        if (selected) {
            itemArr = itemArr.filter((i) => i !== item.id);
        } else {
            itemArr = itemArr ? [...itemArr, item.id] : [item.id];
        }
        changeValue(itemArr);
    };

    switch (attr.type) {
        case AttrType.ENUM:
            if (attr?.options_dict?.status) {
                const isEmpty = attr?.options_dict_items.length === 0;
                return (
                    <Select
                        placeholder="---"
                        dropdownStyle={
                            isEmpty
                                ? undefined
                                : {
                                      maxWidth: 400,
                                      minWidth: 180,
                                      overflow: "auto",
                                      paddingTop: 4,
                                  }
                        }
                        onDropdownVisibleChange={(visible) =>
                            setEnumOpen(visible)
                        }
                        open={enumOpen}
                        allowClear
                        value={
                            value === "" || value === null
                                ? undefined
                                : dicts?.[value]?.text || "-"
                        }
                        dropdownMatchSelectWidth={isEmpty ? true : false}
                        dropdownRender={
                            isEmpty
                                ? undefined
                                : () => {
                                      return (
                                          <div
                                              className={
                                                  styles[
                                                      "as-metadata-dropdownContainer"
                                                  ]
                                              }
                                          >
                                              <div
                                                  className={
                                                      styles[
                                                          "as-metadata-columns"
                                                      ]
                                                  }
                                              >
                                                  {itemEnumIds
                                                      .reduce<
                                                          MetaDtaOptionColumn[]
                                                      >(
                                                          (columns, id) => {
                                                              const parentColumn =
                                                                  columns[
                                                                      columns.length -
                                                                          1
                                                                  ];

                                                              parentColumn.active =
                                                                  id;
                                                              const {
                                                                  options,
                                                              } = parentColumn;

                                                              return [
                                                                  ...columns,
                                                                  {
                                                                      options:
                                                                          options.find(
                                                                              (
                                                                                  item
                                                                              ) =>
                                                                                  item.id ===
                                                                                  id
                                                                          )
                                                                              ?.children ||
                                                                          [],
                                                                      id: [
                                                                          ...parentColumn.id,
                                                                          id,
                                                                      ],
                                                                  },
                                                              ];
                                                          },
                                                          [
                                                              {
                                                                  options:
                                                                      attr?.options_dict_items as DictItemType[],
                                                                  active: undefined,
                                                                  id: [],
                                                              },
                                                          ]
                                                      )
                                                      .map(
                                                          ({
                                                              options,
                                                              active,
                                                              id,
                                                          }) => (
                                                              <ul
                                                                  className={
                                                                      styles[
                                                                          "as-metadata-column"
                                                                      ]
                                                                  }
                                                                  key={id.join(
                                                                      "-"
                                                                  )}
                                                              >
                                                                  {options.map(
                                                                      (
                                                                          option: DictItemType
                                                                      ) => {
                                                                          return (
                                                                              <li
                                                                                  className={clsx(
                                                                                      styles[
                                                                                          "as-metadata-row"
                                                                                      ],
                                                                                      styles[
                                                                                          "as-metadata-enum-row"
                                                                                      ],
                                                                                      {
                                                                                          [styles[
                                                                                              "active"
                                                                                          ]]:
                                                                                              active ===
                                                                                              option?.id,
                                                                                      },
                                                                                      {
                                                                                          [styles[
                                                                                              "selected"
                                                                                          ]]:
                                                                                              value ===
                                                                                              option.id,
                                                                                      }
                                                                                  )}
                                                                                  key={[
                                                                                      ...id,
                                                                                      option.id,
                                                                                  ].join(
                                                                                      "-"
                                                                                  )}
                                                                              >
                                                                                  <div
                                                                                      style={{
                                                                                          display:
                                                                                              "flex",
                                                                                          alignItems:
                                                                                              "center",
                                                                                      }}
                                                                                      onMouseMove={() => {
                                                                                          if (
                                                                                              option
                                                                                                  .children
                                                                                                  ?.length
                                                                                          ) {
                                                                                              setItemEnumIds(
                                                                                                  [
                                                                                                      ...id,
                                                                                                      option.id,
                                                                                                  ]
                                                                                              );
                                                                                          } else {
                                                                                              setItemEnumIds(
                                                                                                  id
                                                                                              );
                                                                                          }
                                                                                      }}
                                                                                      onClick={() => {
                                                                                          changeValue(
                                                                                              option.id
                                                                                          );
                                                                                          setEnumOpen(
                                                                                              false
                                                                                          );
                                                                                      }}
                                                                                  >
                                                                                      <span
                                                                                          className={clsx(
                                                                                              styles[
                                                                                                  "as-metadata-label"
                                                                                              ],
                                                                                              styles[
                                                                                                  "as-metadata-enum-label"
                                                                                              ]
                                                                                          )}
                                                                                      >
                                                                                          {
                                                                                              option.text
                                                                                          }
                                                                                      </span>
                                                                                      {option
                                                                                          .children
                                                                                          ?.length ? (
                                                                                          <RightOutlined
                                                                                              style={{
                                                                                                  fontSize:
                                                                                                      "12px",
                                                                                                  margin: "0 10px",
                                                                                                  opacity: 0.45,
                                                                                                  color: "#000000",
                                                                                              }}
                                                                                          />
                                                                                      ) : null}
                                                                                  </div>
                                                                              </li>
                                                                          );
                                                                      }
                                                                  )}
                                                              </ul>
                                                          )
                                                      )}
                                              </div>
                                          </div>
                                      );
                                  }
                        }
                    ></Select>
                );
            }
            return (
                <Select
                    placeholder="---"
                    popupClassName={styles["metadata-select"]}
                    allowClear
                    value={value === "" ? undefined : value}
                    onChange={(val) => changeValue(val)}
                >
                    {(attr as TemplateEntriesFieldOptionBaseInfo).options?.map(
                        (item) => (
                            <Select.Option
                                key={item.key}
                                value={item.key}
                                title={item.key}
                            >
                                {item.key}
                            </Select.Option>
                        )
                    )}
                </Select>
            );
        case AttrType.MULTISELECT: {
            if (attr?.options_dict?.status) {
                const isEmpty = attr?.options_dict_items.length === 0;
                return (
                    <Select
                        mode="multiple"
                        placeholder="---"
                        className={styles["metadata-select"]}
                        dropdownStyle={
                            isEmpty
                                ? undefined
                                : {
                                      maxWidth: 400,
                                      minWidth: 180,
                                      overflow: "auto",
                                      paddingTop: 4,
                                  }
                        }
                        allowClear
                        value={value}
                        dropdownMatchSelectWidth={false}
                        onChange={changeTagHandle}
                        tagRender={(props) => {
                            const { value: tag, onClose } = props as any;
                            const currentTag = dicts?.[tag]?.text || "-";
                            return (
                                value && (
                                    <Tag
                                        key={tag}
                                        closable={true}
                                        onClose={onClose}
                                    >
                                        <span
                                            className={styles["metadata-tag"]}
                                            key={tag}
                                            title={currentTag}
                                        >
                                            {currentTag}
                                        </span>
                                    </Tag>
                                )
                            );
                        }}
                        dropdownRender={
                            isEmpty
                                ? undefined
                                : () => {
                                      return (
                                          <div
                                              className={
                                                  styles[
                                                      "as-metadata-dropdownContainer"
                                                  ]
                                              }
                                          >
                                              <div
                                                  className={
                                                      styles[
                                                          "as-metadata-columns"
                                                      ]
                                                  }
                                              >
                                                  {itemMulIds
                                                      .reduce<
                                                          MetaDtaOptionColumn[]
                                                      >(
                                                          (columns, id) => {
                                                              const parentColumn =
                                                                  columns[
                                                                      columns.length -
                                                                          1
                                                                  ];

                                                              parentColumn.active =
                                                                  id;
                                                              const {
                                                                  options,
                                                              } = parentColumn;

                                                              return [
                                                                  ...columns,
                                                                  {
                                                                      options:
                                                                          options.find(
                                                                              (
                                                                                  item
                                                                              ) =>
                                                                                  item.id ===
                                                                                  id
                                                                          )
                                                                              ?.children ||
                                                                          [],
                                                                      id: [
                                                                          ...parentColumn.id,
                                                                          id,
                                                                      ],
                                                                  },
                                                              ];
                                                          },
                                                          [
                                                              {
                                                                  options:
                                                                      attr?.options_dict_items as DictItemType[],
                                                                  active: undefined,
                                                                  id: [],
                                                              },
                                                          ]
                                                      )
                                                      .map(
                                                          ({
                                                              options,
                                                              active,
                                                              id,
                                                          }) => (
                                                              <ul
                                                                  className={
                                                                      styles[
                                                                          "as-metadata-column"
                                                                      ]
                                                                  }
                                                                  key={id.join(
                                                                      "-"
                                                                  )}
                                                              >
                                                                  {options.map(
                                                                      (
                                                                          option
                                                                      ) => {
                                                                          const selected =
                                                                              isArray(
                                                                                  value
                                                                              )
                                                                                  ? (
                                                                                        value as string[]
                                                                                    )?.includes(
                                                                                        option.id
                                                                                    )
                                                                                  : false;
                                                                          return (
                                                                              <li
                                                                                  key={[
                                                                                      ...id,
                                                                                      option.id,
                                                                                  ].join(
                                                                                      "-"
                                                                                  )}
                                                                                  className={clsx(
                                                                                      styles[
                                                                                          "as-metadata-row"
                                                                                      ],

                                                                                      {
                                                                                          [styles[
                                                                                              "active"
                                                                                          ]]:
                                                                                              active ===
                                                                                              option?.id,
                                                                                      }
                                                                                  )}
                                                                              >
                                                                                  <Checkbox
                                                                                      checked={
                                                                                          selected
                                                                                      }
                                                                                      style={{
                                                                                          margin: "0 10px",
                                                                                      }}
                                                                                      onChange={() =>
                                                                                          changeBoxHandle(
                                                                                              selected,
                                                                                              {
                                                                                                  id: option.id,
                                                                                                  text: option.text,
                                                                                              }
                                                                                          )
                                                                                      }
                                                                                  />
                                                                                  <div
                                                                                      style={{
                                                                                          display:
                                                                                              "flex",
                                                                                          alignItems:
                                                                                              "center",
                                                                                      }}
                                                                                      onMouseMove={() => {
                                                                                          if (
                                                                                              option
                                                                                                  .children
                                                                                                  ?.length
                                                                                          ) {
                                                                                              setItemMulIds(
                                                                                                  [
                                                                                                      ...id,
                                                                                                      option.id,
                                                                                                  ]
                                                                                              );
                                                                                          } else {
                                                                                              setItemMulIds(
                                                                                                  id
                                                                                              );
                                                                                          }
                                                                                      }}
                                                                                  >
                                                                                      <span
                                                                                          className={
                                                                                              styles[
                                                                                                  "as-metadata-label"
                                                                                              ]
                                                                                          }
                                                                                      >
                                                                                          {
                                                                                              option.text
                                                                                          }
                                                                                      </span>
                                                                                      {option
                                                                                          .children
                                                                                          ?.length ? (
                                                                                          <RightOutlined
                                                                                              style={{
                                                                                                  fontSize:
                                                                                                      "12px",
                                                                                                  margin: "0 10px",
                                                                                                  opacity: 0.45,
                                                                                                  color: "#000000",
                                                                                              }}
                                                                                          />
                                                                                      ) : null}
                                                                                  </div>
                                                                              </li>
                                                                          );
                                                                      }
                                                                  )}
                                                              </ul>
                                                          )
                                                      )}
                                              </div>
                                          </div>
                                      );
                                  }
                        }
                    ></Select>
                );
            }
            return (
                <Select
                    mode="multiple"
                    placeholder="---"
                    allowClear
                    showSearch={false}
                    popupClassName={styles["metadata-select"]}
                    value={value}
                    onChange={(val: string[]) => changeValue(val)}
                >
                    {(attr as TemplateEntriesFieldOptionBaseInfo).options?.map(
                        (item) => (
                            <Select.Option
                                key={item.key}
                                value={item.key}
                                title={item.key}
                            >
                                {item.key}
                            </Select.Option>
                        )
                    )}
                </Select>
            );
        }

        case AttrType.STRING: {
            const getStringConfig = (check?: string): object => {
                switch (check) {
                    case StringTypeEnum.PhoneNum:
                        return {
                            placeholder: t(
                                "metadata.placeholder.phoneNumber",
                                "+86"
                            ),
                            prefix: (
                                <TelephoneColored
                                    className={styles["prefix-icon"]}
                                />
                            ),
                        };
                    case StringTypeEnum.Email:
                        return {
                            placeholder: t(
                                "metadata.placeholder.email",
                                "请输入邮箱地址"
                            ),
                            prefix: (
                                <MailColored
                                    className={styles["prefix-icon"]}
                                />
                            ),
                        };
                    case StringTypeEnum.IdCard:
                        return {
                            placeholder: t(
                                "metadata.placeholder.idNum",
                                "请输入身份证号"
                            ),
                            prefix: (
                                <IdcardColored
                                    className={styles["prefix-icon"]}
                                />
                            ),
                        };
                    default:
                        return {
                            placeholder: t(
                                "metadata.stringLimit",
                                `最多可输入${STRING_MAX_LENGTH}字`,
                                {
                                    limit: STRING_MAX_LENGTH,
                                }
                            ),
                            maxLength: STRING_MAX_LENGTH,
                        };
                }
            };

            if (
                (attr as TemplateEntriesFieldBaseInfoString)?.check &&
                (attr as TemplateEntriesFieldBaseInfoString).check !==
                    "not_check"
            ) {
                return (
                    <Input
                        className={styles["metaData-input"]}
                        value={value}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            changeValue(e.target.value);
                        }}
                        onBlur={() => {
                            shouldValidateChange.current = true;
                            form.validateFields([attr.key]);
                        }}
                        {...getStringConfig(
                            (attr as TemplateEntriesFieldBaseInfoString)?.check
                        )}
                    />
                );
            }

            return (
                <Input.TextArea
                    className={clsx(
                        styles["metaData-input"],
                        styles["textarea"]
                    )}
                    value={value}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                        changeValue(e.target.value);
                    }}
                    placeholder={t(
                        "metadata.stringLimit",
                        `最多可输入${STRING_MAX_LENGTH}字`,
                        {
                            limit: STRING_MAX_LENGTH,
                        }
                    )}
                    maxLength={STRING_MAX_LENGTH}
                />
            );
        }

        case AttrType.LONG_STRING:
            return (
                <Input.TextArea
                    className={clsx(
                        styles["metaData-input"],
                        styles["textarea"]
                    )}
                    value={value}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                        changeValue(e.target.value);
                    }}
                    placeholder={t(
                        "metadata.stringLimit",
                        `最多可输入${LONG_STRING_MAX_LENGTH}字`,
                        {
                            limit: LONG_STRING_MAX_LENGTH,
                        }
                    )}
                    maxLength={LONG_STRING_MAX_LENGTH}
                />
            );

        case AttrType.INT:
            return (
                <Input
                    placeholder={t(
                        "metadata.inputPlaceholder.int",
                        "请输入整数"
                    )}
                    className={styles["metaData-input"]}
                    maxLength={15}
                    value={value}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setInt(e.target.value);
                    }}
                />
            );

        case AttrType.FLOAT:
            return (
                <Input
                    placeholder={t(
                        "metadata.inputPlaceholder.float",
                        "请输入小数"
                    )}
                    className={styles["metaData-input"]}
                    maxLength={15}
                    value={value}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setFloat(e.target.value);
                    }}
                />
            );

        case AttrType.DATE:
            return (
                <AntDatePicker
                    className={styles["metaData-date"]}
                    popupClassName="automate-oem-primary"
                    format="YYYY/MM/DD HH:mm"
                    showTime={{ format: "HH:mm" }}
                    placeholder="---"
                    value={value && moment(value)}
                    onOk={(value: DatePickerProps["value"]) => {
                        changeValue(value?.toISOString());
                    }}
                    onChange={(value: moment.Moment | null) => {
                        if (value !== null) {
                            changeValue(value?.toISOString());
                        } else {
                            changeValue("");
                        }
                    }}
                />
            );

        case AttrType.DURATION:
            return <TimeStampItem t={t} value={value} onChange={changeValue} />;

        case AttrType.PERSONNEL:
            return (
                <UserSelect
                    multiple
                    value={value}
                    onChange={(val) => {
                        changeValue(val);
                    }}
                    title={t("selected", "已选：")}
                    placeholder={t(
                        "metadata.selectReceivers.placeholder",
                        "请选择人员"
                    )}
                    className={styles.asUserSelect}
                />
            );

        default:
            return null;
    }
};

interface TimeStampItemProps {
    value: number | "";
    onChange: (val: number | "") => void;
    t: TranslateFn;
}
// 时长类型
const TimeStampItem = ({ t, value, onChange }: TimeStampItemProps) => {
    const [hours, setHours] = useState("");
    const [minutes, setMinutes] = useState("");
    const [seconds, setSeconds] = useState("");

    const getTime = (e: any, type: string) => {
        const { value } = e.target;
        const reg = /^\d*$/;
        if (reg.test(value) || value === "") {
            if (type === DurationTypeEnum.HOURS) {
                setHours(value);
                onChange(
                    Number(value || 0) * 3600 +
                        Number(minutes || 0) * 60 +
                        Number(seconds || 0)
                );
            }
            if (Number(value) < 60 && type === DurationTypeEnum.MINUTES) {
                setMinutes(value);
                onChange(
                    Number(hours || 0) * 3600 +
                        Number(value || 0) * 60 +
                        Number(seconds || 0)
                );
            }
            if (Number(value) < 60 && type === DurationTypeEnum.SECONDS) {
                setSeconds(value);
                onChange(
                    Number(hours || 0) * 3600 +
                        Number(minutes || 0) * 60 +
                        Number(value || 0)
                );
            }
        }
    };

    // 仅初始化时赋值
    useEffect(() => {
        if (value) {
            const hours = Math.floor(value / 3600);
            const minutes = Math.floor((value - hours * 3600) / 60);
            const seconds = value - hours * 3600 - minutes * 60;
            setHours(String(hours) || "");
            setMinutes(String(minutes) || "");
            setSeconds(String(seconds) || "");
        }
    }, []);

    return (
        <div className={styles["duration"]}>
            <Input
                className={styles["metadata-duration"]}
                maxLength={6}
                onChange={(val) => {
                    getTime(val, DurationTypeEnum.HOURS);
                }}
                value={hours}
                placeholder="---"
            />
            <label className={styles["time-unit"]}>
                {t("metadata.hours", "时")}
            </label>
            <Input
                className={styles["metadata-duration"]}
                maxLength={2}
                onChange={(val) => {
                    getTime(val, DurationTypeEnum.MINUTES);
                }}
                value={minutes}
                placeholder="---"
            />
            <label className={styles["time-unit"]}>
                {t("metadata.minute", "分")}
            </label>
            <Input
                className={styles["metadata-duration"]}
                maxLength={2}
                onChange={(val) => {
                    getTime(val, DurationTypeEnum.SECONDS);
                }}
                value={seconds}
                placeholder="---"
            />
            <label className={styles["time-unit"]}>
                {t("metadata.second", "秒")}
            </label>
        </div>
    );
};

//时间格式计算
export const formatSeconds = (value: string) => {
    let result: string | number = parseInt(value);
    const hour = Math.floor(result / 3600);
    const h = hour < 10 ? "0" + hour : hour;

    const minute = Math.floor((result / 60) % 60);
    const m = minute < 10 ? "0" + minute : minute;

    const second = Math.floor(result % 60);
    const s = second < 10 ? "0" + second : second;
    result = `${h}:${m}:${s}`;
    return result;
};

export const AttrValue = ({
    type,
    value,
    useDict,
    dicts,
}: {
    type: string;
    value: any;
    useDict?: boolean;
    dicts?: Record<string, any>;
}) => {
    const { prefixUrl } = useContext(MicroAppContext);
    const [userNames, setUserNames] = useState<string[]>([]);

    useEffect(() => {
        async function getNames() {
            try {
                const { data } = await API.axios.post(
                    `${prefixUrl}/api/workflow-rest/v1/user-management/names?type=user`,
                    value
                );

                setUserNames(data?.map((i: any) => i?.name));
            } catch (error) {
                console.error(error);
            }
        }
        if (type === AttrType.PERSONNEL && value?.length) {
            getNames();
        }
    }, [type]);

    if (value === "" || value === undefined || value === null) {
        return <div>---</div>;
    }

    switch (type) {
        case AttrType.ENUM: {
            const itemVal = useDict
                ? dicts?.[value]?.text || "-"
                : value || "---";
            return (
                <div className={styles["wrap"]} title={itemVal}>
                    {itemVal}
                </div>
            );
        }

        //多选
        case AttrType.MULTISELECT: {
            let itemVal = value[0] ? value.join(" | ") : "---";
            if (useDict && value[0]) {
                itemVal = value
                    .map((i: string) => dicts?.[i]?.text || "-")
                    .join(" | ");
            }
            return (
                <div
                    className={clsx(styles["multiselect"], styles["wrap"])}
                    title={itemVal}
                >
                    {itemVal}
                </div>
            );
        }
        //人员
        case AttrType.PERSONNEL:
            return (
                <div
                    className={clsx(styles["multiselect"], styles["wrap"])}
                    title={value[0] ? userNames.join(", ") : ""}
                >
                    {value[0] ? userNames.join(", ") : "---"}
                </div>
            );

        // 日期类型
        case AttrType.DATE:
            return (
                <div title={moment(value).format("YYYY/MM/DD HH:mm")}>
                    {moment(value).format("YYYY/MM/DD HH:mm")}
                </div>
            );

        //时长类型
        case AttrType.DURATION:
            return (
                <div title={value === 0 ? "" : formatSeconds(value)}>
                    {value === 0 ? "---" : formatSeconds(value)}
                </div>
            );
        //其他
        default:
            return (
                <div className={styles["wrap"]} title={value}>
                    {value}
                </div>
            );
    }
};

export const ItemView = ({
    type,
    value,
    dicts,
    useDict,
}: {
    type: string;
    value: any;
    dicts?: Record<string, any>;
    useDict?: boolean;
}) => {
    const { step } = useContext(StepConfigContext);
    const { stepNodes, stepOutputs } = useContext(EditorContext);
    const [variableVal, setVariableVal] = useState<any>();

    const [isVariable, stepNode, stepOutput] = useMemo<
        [
            boolean,
            (TriggerStepNode | ExecutorStepNode | DataSourceStepNode)?,
            Output?
        ]
    >(() => {
        if (typeof value === "string") {
            const result = /^\{\{(__(\w+).*)\}\}$/.exec(value);
            if (result) {
                const [, key, id] = result;
                const newID = !isNaN(Number(id)) ? id : "1000"; //处理全局变量的情况
                // 找到最精确的匹配项（最长的匹配前缀）
                let bestMatch: any = null;
                
                Object.entries(stepOutputs).forEach(([id, val]) => {
                if (key.startsWith(id)) {
                    const differentPart = key.substring(id.length);
                    // 检查是否比当前最佳匹配更精确（匹配长度更长）
                    if (!bestMatch || id.length > bestMatch.id.length) {
                    bestMatch = {
                        id,
                        value: val,
                        differentPart: differentPart.startsWith(".") ? differentPart.substring(1) : differentPart
                    };
                    }
                }
                });

                const outputsNew = bestMatch ? [{
                key,
                value: bestMatch.value,
                differentPart: bestMatch.differentPart
                }] : [];

                setVariableVal({
                    ...variableVal,
                    addVal: outputsNew[0]?.differentPart,
                });
                return [
                    true,
                    stepNodes[newID] as
                        | TriggerStepNode
                        | ExecutorStepNode
                        | DataSourceStepNode,
                    stepOutputs[key] || outputsNew[0]?.value,
                ];
            }
        }
        return [false];
    }, [value, stepNodes, stepOutputs]);

    if (isVariable) {
        return (
            <div
                className={clsx(styles["variableInput-wrapper"], {
                    [styles["invalid"]]:
                        !stepOutput ||
                        !isAccessable(
                            (step && stepNodes[step.id]?.path) || [],
                            stepNode!.path
                        ) && !isLoopVarAccessible((step && stepNodes[step.id]?.path) || [], stepNode!.path, stepNode?.step?.operator === LoopOperator)
                })}
            >
                <VariableInput
                    scope={(step && stepNodes[step.id]?.path) || []}
                    stepNode={stepNode}
                    stepOutput={stepOutput}
                    value={value}
                    variableVal={variableVal}
                />
            </div>
        );
    }

    return (
        <AttrValue type={type} value={value} dicts={dicts} useDict={useDict} />
    );
};
