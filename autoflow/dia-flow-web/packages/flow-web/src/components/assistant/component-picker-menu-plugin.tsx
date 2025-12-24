import { MicroAppContext, useEvent, useTranslate } from "@applet/common";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LexicalTypeaheadMenuPlugin, MenuOption, useBasicTypeaheadTriggerMatch } from "@lexical/react/LexicalTypeaheadMenuPlugin";
import { Menu } from "antd";
import { useContext, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./component-picker-menu-plugin.module.less";
import clsx from "clsx";
import { $getSelection, INSERT_PARAGRAPH_COMMAND, TextNode } from "lexical";
import Fuse from "fuse.js";
import useSWR from "swr";

class ComponentPickerOption extends MenuOption {
  // What shows up in the editor
  title: string;
  // Icon for display
  icon?: JSX.Element;
  // For extra searching.
  keywords: Array<string>;
  // TBD
  keyboardShortcut?: string;
  // What happens when you select this option?
  onSelect: (queryString: string) => void;

  constructor(
    title: string,
    options: {
      icon?: JSX.Element;
      keywords?: Array<string>;
      keyboardShortcut?: string;
      onSelect: (queryString: string) => void;
    }
  ) {
    super(title);
    this.title = title;
    this.keywords = options.keywords || [];
    this.icon = options.icon;
    this.keyboardShortcut = options.keyboardShortcut;
    this.onSelect = options.onSelect.bind(this);
  }
}

export function ComponentPickerMenuPlugin() {
  const { container } = useContext(MicroAppContext);
  const [editor] = useLexicalComposerContext();
  const [queryString, setQueryString] = useState<string | null>(null);
  const t = useTranslate("assistant");

  const templates = useMemo(() => {
    return [
      {
        title: t("template.manualTrigger", "手动触发"),
        keywords: [t("keyword.manual", "手动触发"), t("keyword.click", "点击")],
        content: t("template.manualTriggerContent", "手动触发；数据源(可选): 文件列表, 文件夹列表, 获取 ... 文件夹下的文件, 获取 ... 文件夹下的子文件夹"),
      },
      {
        title: t("template.dailyTrigger", "每天触发"),
        keywords: [t("keyword.scheduled", "定时触发"), t("keyword.daily", "每天")],
        content: t("template.dailyTriggerContent", "触发方式：每天触发，时间: 10:00；数据源(可选): 文件列表, 文件夹列表, 获取 ... 文件夹下的文件, 获取 ... 文件夹下的子文件夹"),
      },
      {
        title: t("template.weeklyTrigger", "每周触发"),
        keywords: [t("keyword.scheduled", "定时触发"), t("keyword.weekly", "每周")],
        content: t("template.weeklyTriggerContent", "触发方式：每周触发，时间: 周一 10:00；数据源(可选): 文件列表, 文件夹列表, 获取 ... 文件夹下的文件, 获取 ... 文件夹下的子文件夹"),
      },
      {
        title: t("template.monthlyTrigger", "每月触发"),
        keywords: [t("keyword.scheduled", "定时触发"), t("keyword.monthly", "每月")],
        content: t("template.monthlyTriggerContent", "触发方式：每月触发，时间: 1号 10:00；数据源(可选): 文件列表, 文件夹列表, 获取 ... 文件夹下的文件, 获取 ... 文件夹下的子文件夹"),
      },
      {
        title: t("template.formTrigger", "表单触发"),
        keywords: [t("keyword.manual", "手动触发"), t("keyword.form", "提交表单"), t("keyword.collect", "收集")],
        content: t("template.formTriggerContent", "触发方式：表单触发，表单项：标题1、标题2"),
      },
      {
        title: t("template.selectedFileTrigger", "选中文件触发"),
        keywords: [t("keyword.fileTrigger", "文件触发"), t("keyword.manual", "手动触发")],
        content: t("template.selectedFileTriggerContent", "触发方式：特定文件夹范围下选中的文件, 文件夹范围: 文件夹 1, 文件夹 2... 表单项(可选): 字段 1, 字段 2..."),
      },
      {
        title: t("template.selectedFolderTrigger", "选中文件夹触发"),
        keywords: [t("keyword.folderTrigger", "文件夹触发"), t("keyword.manual", "手动触发")],
        content: t("template.selectedFolderTriggerContent", "触发方式：特定文件夹范围下选中的子文件夹, 文件夹范围: 文件夹 1, 文件夹 2... 表单项(可选): 字段 1, 字段 2..."),
      },

      {
        title: t("template.uploadFileTrigger", "上传文件时触发"),
        keywords: [t("keyword.fileTrigger", "文件触发"), t("keyword.autoTrigger", "自动触发")],
        content: t("template.uploadFileTriggerContent", "触发方式：上传文件时触发, 触发文件夹: 文件夹 1, 文件夹 2..."),
      },
      {
        title: t("template.copyFileTrigger", "复制文件时触发"),
        keywords: [t("keyword.fileTrigger", "文件触发"), t("keyword.autoTrigger", "自动触发")],
        content: t("template.copyFileTriggerContent", "触发方式：复制文件时触发, 触发文件夹: 文件夹 1, 文件夹 2..."),
      },
      {
        title: t("template.moveFileTrigger", "移动文件时触发"),
        keywords: [t("keyword.fileTrigger", "文件触发"), t("keyword.autoTrigger", "自动触发")],
        content: t("template.moveFileTriggerContent", "触发方式：移动文件时触发, 触发文件夹: 文件夹 1, 文件夹 2..."),
      },
      {
        title: t("template.deleteFileTrigger", "删除文件时触发"),
        keywords: [t("keyword.fileTrigger", "文件触发"), t("keyword.autoTrigger", "自动触发")],
        content: t("template.deleteFileTriggerContent", "触发方式：删除文件时触发, 触发文件夹: 文件夹 1, 文件夹 2..."),
      },
      {
        title: t("template.createFolderTrigger", "新建文件夹时触发"),
        keywords: [t("keyword.folderTrigger", "文件夹触发"), t("keyword.autoTrigger", "自动触发")],
        content: t("template.createFolderTriggerContent", "触发方式：新建文件夹时触发, 触发文件夹: 文件夹 1, 文件夹 2..."),
      },
      {
        title: t("template.copyFolderTrigger", "复制文件夹时触发"),
        keywords: [t("keyword.folderTrigger", "文件夹触发"), t("keyword.autoTrigger", "自动触发")],
        content: t("template.copyFolderTriggerContent", "触发方式：复制文件夹时触发, 触发文件夹: 文件夹 1, 文件夹 2..."),
      },
      {
        title: t("template.moveFolderTrigger", "移动文件夹时触发"),
        keywords: [t("keyword.folderTrigger", "文件夹触发"), t("keyword.autoTrigger", "自动触发")],
        content: t("template.moveFolderTriggerContent", "触发方式：移动文件夹时触发, 触发文件夹: 文件夹 1, 文件夹 2..."),
      },
      {
        title: t("template.deleteFolderTrigger", "删除文件夹时触发"),
        keywords: [t("keyword.folderTrigger", "文件夹触发"), t("keyword.autoTrigger", "自动触发")],
        content: t("template.deleteFolderTriggerContent", "触发方式：删除文件夹时触发, 触发文件夹: 文件夹 1, 文件夹 2..."),
      },
      {
        title: t("template.branch", "分支"),
        keywords: [t("keyword.branch", "分支"), t("keyword.condition", "条件"), t("keyword.if", "如果")],
        content: t("template.branchContent", "如果 ( 条件 1 且 条件 2 ) 或 条件 3, 则:\n\n  1. 操作1\n\n否则:\n\n  2. 操作2"),
      },
      {
        title: t("template.mergeText", "合并文本"),
        keywords: [t("keyword.text", "文本"), t("keyword.merge", "合并"), t("keyword.concatenate", "拼接")],
        content: t("template.mergeTextContent", "合并文本：文本1、文本2..."),
      },
      {
        title: t("template.textExtraction", "文本提取"),
        keywords: [t("keyword.number", "数字"), t("keyword.phone", "电话"), t("keyword.bankCard", "银行卡号")],
        content: t("template.textExtractionContent", "从文本中提取身份证, 数字, 电话号码, 银行卡号"),
      },
      {
        title: t("template.copyFile", "复制文件"),
        keywords: [],
        content: t("template.copyFileContent", "复制文件 “文件” 到文件夹 “文件夹”, 重名时 自动重命名/覆盖/终止流程"),
      },
      {
        title: t("template.moveFile", "移动文件"),
        keywords: [],
        content: t("template.moveFileContent", "移动文件 “文件” 到文件夹 “文件夹”, 重名时 自动重命名/覆盖/终止流程"),
      },
      {
        title: t("template.deleteFile", "删除文件"),
        keywords: [],
        content: t("template.deleteFileContent", "删除文件 “文件”"),
      },
      {
        title: t("template.renameFile", "重命名文件"),
        keywords: [],
        content: t("template.renameFileContent", "重命名文件 “文件” 为 “新文件名”, 重名时 自动重命名/终止流程"),
      },
      {
        title: t("template.addFileTag", "添加文件标签"),
        keywords: [],
        content: t("template.addFileTagContent", "给文件 “文件” 添加标签 “标签 1” “标签 2” ..."),
      },
      {
        title: t("template.getFilePath", "获取文件路径"),
        keywords: [],
        content: t("template.getFilePathContent", "获取文件 “文件” 的路径"),
      },
      {
        title: t("template.setFilePermissions", "设置文件权限"),
        keywords: [t("keyword.permissions", "权限"), t("keyword.share", "分享")],
        content: t("template.setFilePermissionsContent", "设置文件 “文件” 的权限, “用户 A” 权限为 ... “用户 B” 权限为 ..."),
      },
      {
        title: t("template.copyFolder", "复制文件夹"),
        keywords: [],
        content: t("template.copyFolderContent", "复制文件夹 “文件夹” 到文件夹 “目标文件夹”, 重名时 自动重命名/覆盖/终止流程"),
      },
      {
        title: t("template.moveFolder", "移动文件夹"),
        keywords: [],
        content: t("template.moveFolderContent", "移动文件夹 “文件夹” 到文件夹 “目标文件夹”, 重名时 自动重命名/覆盖/终止流程"),
      },
      {
        title: t("template.deleteFolder", "删除文件夹"),
        keywords: [],
        content: t("template.deleteFolderContent", "删除文件夹 “文件夹”"),
      },
      {
        title: t("template.renameFolder", "重命名文件夹"),
        keywords: [],
        content: t("template.renameFolderContent", "重命名文件夹 “文件夹” 为 “新文件夹名”, 重名时 自动重命名/终止流程"),
      },
      {
        title: t("template.addFolderTag", "添加文件夹标签"),
        keywords: [],
        content: t("template.addFolderTagContent", "给文件夹 “文件夹” 添加标签 “标签 1” “标签 2” ..."),
      },
      {
        title: t("template.getFolderPath", "获取文件夹路径"),
        keywords: [],
        content: t("template.getFolderPathContent", "获取文件夹 “文件夹” 的路径"),
      },
      {
        title: t("template.setFolderPermissions", "设置文件夹权限"),
        keywords: [t("keyword.permissions", "权限"), t("keyword.share", "分享")],
        content: t("template.setFolderPermissionsContent", "设置文件夹 “文件夹” 的权限, “用户 A” 权限为 ... “用户 B” 权限为 ..."),
      },
      {
        title: t("template.createFolder", "创建文件夹"),
        keywords: [],
        content: t("template.createFolderContent", "创建文件夹 “文件夹名称”"),
      },
      {
        title: t("template.createWordDocument", "创建 Word 文档"),
        keywords: [],
        content: t("template.createWordDocumentContent", "创建 Word 文档 “文件名称(不需要后缀)”"),
      },
      {
        title: t("template.createExcelSheet", "创建 Excel 表格"),
        keywords: [],
        content: t("template.createExcelSheetContent", "创建 Excel 表格 “文件名称(不需要后缀)”"),
      },
      {
        title: t("template.getFile", "获取文件"),
        keywords: [],
        content: t("template.getFileContent", "在文件夹 “文件夹” 中获取名称为 “文件名” 的文件"),
      },
      {
        title: t("template.updateWordDocument", "更新 Word 文档内容"),
        keywords: [t("keyword.word", "Word"), t("keyword.document", "文档"), t("keyword.update", "更新")],
        content: t("template.updateWordDocumentContent", "更新 Word 文档内容，更新方式：新增/覆盖，内容为：..."),
      },
      {
        title: t("template.updateExcelSheet", "更新 Excel 表格内容"),
        keywords: [t("keyword.excel", "Excel"), t("keyword.sheet", "表格"), t("keyword.update", "更新")],
        content: t("template.updateExcelSheetContent", "更新 Excel 表格内容，更新方式：新增/插入/覆盖，行号/列号为 ...，内容为：..."),
      },
      {
        title: t("template.initiateReviewProcess", "发起审核流程"),
        keywords: [t("keyword.review", "审核"), t("keyword.process", "流程")],
        content: t("template.initiateReviewProcessContent", "发起审核流程，审核内容为文件/文件夹/文本/日期/数字"),
      },
      {
        title: t("template.getCurrentDate", "获取当前日期"),
        keywords: [t("keyword.date", "日期"), t("keyword.current", "当前")],
        content: t("template.getCurrentDateContent", "获取当前日期"),
      },
      {
        title: t("template.getRelativeDate", "获取相对日期"),
        keywords: [t("keyword.date", "日期"), t("keyword.relative", "相对")],
        content: t("template.getRelativeDateContent", "获取相对日期，相对基准：... 计算方式：加/减，相对值：..."),
      },
    ];
  }, [t]);

  const fuse = useMemo(() => {
    return new Fuse(templates, {
      keys: ["title", "keywords", "content"],
      isCaseSensitive: false,
    });
  }, [templates]);

  const filtered = useMemo(() => {
    const query = (queryString && queryString.trim()) || "";
    if (!query) return templates;
    const items = fuse.search(query);

    return items.map((item) => item.item);
  }, [templates, fuse, queryString]);

  const options = useMemo(() => {
    return filtered.map(
      (template) =>
        new ComponentPickerOption(template.title, {
          keywords: template.keywords,
          onSelect() {
            editor.update(() => {
              const selection = $getSelection();
              selection?.insertRawText(template.content);
            });
          },
        })
    );
  }, [filtered]);

  const onSelectOption = useEvent((selectedOption: ComponentPickerOption, nodeToRemove: TextNode | null, closeMenu: () => void, matchingString: string) => {
    editor.update(() => {
      nodeToRemove?.remove();
      selectedOption.onSelect(matchingString);
      closeMenu();
    });
  });

  const checkForTriggerMatch = useBasicTypeaheadTriggerMatch("/", {
    minLength: 0,
  });

  const menuContainerRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <div ref={menuContainerRef} className={styles.MenuContainer}></div>
      <LexicalTypeaheadMenuPlugin<ComponentPickerOption>
        parent={menuContainerRef.current!}
        options={options}
        onQueryChange={setQueryString}
        triggerFn={checkForTriggerMatch}
        onSelectOption={onSelectOption}
        menuRenderFn={(anchorElementRef, { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }) => {
          if (anchorElementRef.current && options.length) {
            return createPortal(
              <div className={styles.Menu}>
                <ul className={styles.MenuList}>
                  {options.map((option, i) => {
                    const isSelected = selectedIndex === i;
                    return (
                      <li
                        className={clsx(styles.MenuItem, isSelected && styles.MenuItemSelected)}
                        key={option.key}
                        ref={option.setRefElement}
                        onClick={() => {
                          setHighlightedIndex(i);
                          selectOptionAndCleanUp(option);
                        }}
                        onMouseEnter={() => {
                          setHighlightedIndex(i);
                        }}
                      >
                        {option.title}
                      </li>
                    );
                  })}
                </ul>
              </div>,
              anchorElementRef.current
            );
          }
          return null;
        }}
      />
    </>
  );
}
