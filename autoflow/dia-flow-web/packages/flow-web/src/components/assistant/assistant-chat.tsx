import { LoadingOutlined } from "@ant-design/icons";
import { DagDetail } from "@applet/api/lib/content-automation";
import { API, FileIcon, MicroAppContext, toItem, useEvent, useTranslate } from "@applet/common";
import { AsDepartmentsColored, AsUsersColored, FileBatchColored, PlusOutlined } from "@applet/icons";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { Button, Dropdown, Menu, Space, Tag } from "antd";
import { $createParagraphNode, $createTextNode, $getRoot } from "lexical";
import { clamp } from "lodash";
import { createContext, forwardRef, useContext, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Agent, ExtractReferenceItem, callAgent, getAgentAnswerText, parseJSON } from "../../utils/agents";
import { IDocItem } from "../as-file-preview";
import styles from "./assistant-chat.module.less";
import { searchAccessors } from "./utils";
import { ComponentPickerMenuPlugin } from "./component-picker-menu-plugin";
import { useSecurityLevel } from "../log-card";

const theme = {
  code: styles.EditorCode,
  heading: {
    h1: styles.EditorHeadingH1,
    h2: styles.EditorHeadingH2,
    h3: styles.EditorHeadingH3,
    h4: styles.EditorHeadingH4,
    h5: styles.EditorHeadingH5,
  },
  image: styles.EditorImage,
  link: styles.EditorLink,
  list: {
    listitem: styles.EditorListitem,
    nested: {
      listitem: styles.EditorNestedListitem,
    },
    ol: styles.EditorListOl,
    ul: styles.EditorListUl,
  },
  ltr: styles.EditorLTR,
  paragraph: styles.EditorParagraph,
  placeholder: styles.EditorPlaceholder,
  quote: styles.EditorQuote,
  rtl: styles.EDITORRTL,
  text: {
    bold: styles.EditorTextBold,
    code: styles.EditorTextCode,
    hashtag: styles.EditorTextHashtag,
    italic: styles.EditorTextItalic,
    overflowed: styles.EditorTextOverflowed,
    strikethrough: styles.EditorTextStrikethrough,
    underline: styles.EditorTextUnderline,
    underlineStrikethrough: styles.EditorTextUnderlineStrikethrough,
  },
};

function onError(error: any) {
  console.error(error);
}

const initialConfig = {
  namespace: "AssistantChat",
  theme,
  onError,
};

export interface AssistantChatRef {
  clearInput(): void;
}

interface AssistantChatProps {
  agentIds: Record<Agent, string>;
  dag?: DagDetail;
  selectedItems?: IDocItem[];
  onDagChange?(dag: DagDetail): void;
}

interface Attachment {
  type: "file" | "folder" | "user" | "department" | "contactor" | "group";
  [key: string]: any;
}

interface AssistantChatContextValue {
  dag?: DagDetail;
  selectedItems?: IDocItem[];
  attachments: Attachment[];
  setAttachments: (attachments: Attachment[]) => void;
  onDagChange?(dag: DagDetail): void;
}

const AssistantChatContext = createContext<AssistantChatContextValue>({
  selectedItems: [],
  attachments: [],
  setAttachments() {},
  onDagChange() {},
});

export const AssistantChat = forwardRef<AssistantChatRef, AssistantChatProps>(({ dag, agentIds, selectedItems, onDagChange }, ref) => {
  const t = useTranslate();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const footerRef = useRef<AssistantChatFooterPluginRef>(null);
  const selectedItemIds = useRef<string[]>([]);

  const clearInput = useEvent(() => {
    footerRef.current?.clearInput();
    setAttachments([]);
  });

  useEffect(() => {
    const newSelectedItemIds = selectedItems?.map((item) => item.docid) || [];
    if (selectedItemIds.current.length && newSelectedItemIds.every((id) => !selectedItemIds.current.includes(id))) {
      clearInput();
    }

    selectedItemIds.current = newSelectedItemIds;
  }, [selectedItems]);

  useImperativeHandle(
    ref,
    () => {
      return {
        clearInput,
      };
    },
    []
  );

  return (
    <AssistantChatContext.Provider
      value={{
        dag,
        selectedItems,
        attachments,
        setAttachments,
        onDagChange,
      }}
    >
      <LexicalComposer initialConfig={initialConfig}>
        <div className={styles.EditorContainer}>
          <AssistantChatHeaderPlugin />
          <div className={styles.EditorInner}>
            <RichTextPlugin
              contentEditable={<ContentEditable className={styles.EditorInput} />}
              placeholder={
                <div className={styles.EditorPlaceholder}>
                  <span>{t("assistant.placeholder", "请描述要执行的操作，如：上传文件到选中的文件夹时，给部门添加权限")}</span>
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <AutoFocusPlugin />
          </div>

          <ComponentPickerMenuPlugin />
          <AssistantChatFooterPlugin agentIds={agentIds} ref={footerRef} />
        </div>
      </LexicalComposer>
    </AssistantChatContext.Provider>
  );
});

interface AttachmentTagProps {
  attachment: Attachment;
  onClose(attachment: Attachment): void;
}

function AttachmentTag({ attachment, onClose }: AttachmentTagProps) {
  const [title, setTitle] = useState(attachment.name);

  switch (attachment.type) {
    case "file":
    case "folder":
      return (
        <Tag className={styles.Tag} title={title} data-closable closable onClose={() => onClose(attachment)}>
          <FileIcon name={attachment.name} size={attachment.size} />
          <span className={styles.Text}>{attachment.name}</span>
        </Tag>
      );
    case "user":
      return (
        <Tag className={styles.Tag} title={title} data-closable closable onClose={() => onClose(attachment)}>
          <AsUsersColored />
          <span className={styles.Text}>{attachment.name}</span>
        </Tag>
      );
    case "department":
    case "contactor":
    case "group":
      return (
        <Tag className={styles.Tag} title={title} closable data-closable onClose={() => onClose(attachment)}>
          <AsDepartmentsColored />
          <span className={styles.Text}>{attachment.name}</span>
        </Tag>
      );
    default:
      return null;
  }
}

function AssistantChatHeaderPlugin() {
  const { microWidgetProps, functionid } = useContext(MicroAppContext);
  const { selectedItems, attachments, setAttachments } = useContext(AssistantChatContext);
  const t = useTranslate();

  const addAccessors = useEvent(async () => {
    try {
      const accessors = await microWidgetProps?.contextMenu?.addAccessorFn({
        functionid,
        multiple: true,
        title: t("select", "选择"),
        selectedVisitorsCustomLabel: t("selected", "已选："),
        containerOptions: {
          height: clamp(window.innerHeight, 400, 584),
        },
      });
      const exists = new Set(attachments.filter((item) => item.type === "contactor" || item.type === "group" || item.type === "department" || item.type === "user").map((item) => item.id));

      const newAttachments = [...attachments];

      if (accessors) {
        for (const accessor of accessors) {
          const item = toItem(accessor as any);
          if (!exists.has(item.id)) {
            newAttachments.push(item);
          }
        }
      }
      setAttachments(newAttachments);
    } catch (e) {}
  });

  const addDocuments = useEvent(async () => {
    let docs = await microWidgetProps?.contextMenu?.selectFn({
      functionid,
      multiple: true,
      selectType: 3,
      title: t("select", "选择"),
      containerOptions: {
        height: clamp(window.innerHeight, 400, 600),
      },
    });

    if (!docs) return;

    if (!Array.isArray(docs)) {
      docs = [docs];
    }

    if (!docs.length) return;
    const newAttachments = [...attachments];

    const exists = new Set(attachments.filter((item) => item.type === "file" || item.type === "folder").map((item) => item.docid));

    for (const doc of docs as any) {
      const docid = doc.docid || doc.id;
      if (docid && !exists.has(docid)) {
        newAttachments.push({
          docid,
          type: doc.size === -1 ? "folder" : "file",
          name: doc.name,
          size: doc.size,
        });
      }
    }

    setAttachments(newAttachments);
  });

  return (
    <div className={styles.AssistantChatHeader}>
      {selectedItems?.map((item) => (
        <Tag color="blue" className={styles.Tag} title={item.name}>
          <FileIcon name={item.name} size={item.size} />
          <span className={styles.Text}>{item.name}</span>
        </Tag>
      ))}
      {attachments?.map((item) => {
        return (
          <AttachmentTag
            attachment={item}
            onClose={(item) => {
              setAttachments(attachments.filter((attachment) => attachment !== item));
            }}
          />
        );
      })}
      <Dropdown
        overlay={
          <Menu>
            <Menu.Item icon={<AsUsersColored />} onClick={addAccessors}>
              {t("assistant.addAccessor", "用户")}
            </Menu.Item>
            <Menu.Item icon={<FileBatchColored />} onClick={addDocuments}>
              {t("assistant.addDocument", "文档")}
            </Menu.Item>
          </Menu>
        }
      >
        <Tag className={styles.Tag}>
          <PlusOutlined />
        </Tag>
      </Dropdown>
    </div>
  );
}

interface AssistantChatFooterPluginRef {
  clearInput(): void;
}

const AssistantChatFooterPlugin = forwardRef<AssistantChatFooterPluginRef, { agentIds: Record<Agent, string> }>(({ agentIds }, ref) => {
  const { message, microWidgetProps } = useContext(MicroAppContext);
  const { selectedItems, attachments, setAttachments, onDagChange } = useContext(AssistantChatContext);
  const [editor] = useLexicalComposerContext();
  const t = useTranslate();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const ac = useRef<AbortController>();
  const [csflevels] = useSecurityLevel()

  const getEditorContent = useEvent(() => {
    const editorState = editor.getEditorState();
    return editorState.read(() => $getRoot().getTextContent()).trim();
  });

  const getAttachments = useEvent(async () => {
    if (!agentIds[Agent.ExtractReferences]) {
      return attachments;
    }

    try {
      const query = getEditorContent();
      const res = await callAgent(
        agentIds[Agent.ExtractReferences],
        {
          query,
        },
        {
          signal: ac.current?.signal,
        }
      );

      const references = parseJSON<ExtractReferenceItem[]>(getAgentAnswerText(res), []) || [];
      const existFileNames: string[] = [...(selectedItems?.map((item) => item.name) || []), ...attachments.filter((item) => item.type === "file").map((item) => item.name)];
      const existFolderNames: string[] = [...(selectedItems?.map((item) => item.name) || []), ...attachments.filter((item) => item.type === "folder").map((item) => item.name)];
      const existUserNames: string[] = attachments.filter((item) => item.type === "user").map((item) => item.name);
      const existDepartmentNames: string[] = attachments.filter((item) => item.type === "department").map((item) => item.name);

      let missingFiles: string[] = [];
      let missingFolders: string[] = [];
      let missingUsers: string[] = [];
      let missingDepartments: string[] = [];

      for (const reference of references) {
        if (!reference.exists) {
          continue;
        }

        if (reference.type === "file" && !existFileNames.includes(reference.name)) {
          missingFiles.push(reference.name);
        } else if (reference.type === "folder" && !existFolderNames.includes(reference.name)) {
          missingFolders.push(reference.name);
        } else if (reference.type === "user" && !existUserNames.includes(reference.name)) {
          missingUsers.push(reference.name);
        } else if (reference.type === "department" && !existDepartmentNames.includes(reference.name)) {
          missingDepartments.push(reference.name);
        }
      }
      const attachmentIds = new Set(attachments.map((item) => item.id || item.docid));
      const newAttachments: Attachment[] = [];
      const parentDir = microWidgetProps.contextMenu?.dirParentIDocItem;

      if (parentDir && (missingFiles.length || missingFolders.length)) {
        const {
          data: { files, dirs },
        } = await API.efast.efastV1DirListPost(
          {
            docid: parentDir.docid,
            sort: "asc",
            by: "name",
          },
          { signal: ac.current?.signal }
        );

        if (missingFiles.length) {
          for (const item of files) {
            if (missingFiles.includes(item.name) && !attachmentIds.has(item.docid)) {
              missingFiles = missingFiles.filter((name) => name !== item.name);
              newAttachments.push({
                type: "file",
                docid: item.docid,
                name: item.name,
                size: item.size,
              });
              attachmentIds.add(item.docid);
            }
          }
        }

        if (missingFiles.length) {
          const re = new RegExp(`^(${missingFiles.join("|")})`, "i");
          for (const item of files) {
            if (re.test(item.name) && !attachmentIds.has(item.docid)) {
              newAttachments.push({
                type: "file",
                docid: item.docid,
                name: item.name,
                size: item.size,
              });
              attachmentIds.add(item.docid);
            }
          }
        }

        if (missingFolders.length) {
          for (const item of dirs) {
            if (missingFolders.includes(item.name) && !attachmentIds.has(item.docid)) {
              missingFolders = missingFolders.filter((name) => name !== item.name);
              newAttachments.push({
                type: "folder",
                docid: item.docid,
                name: item.name,
                size: item.size,
              });
              attachmentIds.add(item.docid);
            }
          }
        }

        if (missingFolders.length) {
          const re = new RegExp(`^(${missingFolders.join("|")})`, "i");
          for (const item of dirs) {
            if (re.test(item.name) && !attachmentIds.has(item.docid)) {
              missingFolders = missingFolders.filter((name) => name !== item.name);
              newAttachments.push({
                type: "folder",
                docid: item.docid,
                name: item.name,
                size: item.size,
              });
              attachmentIds.add(item.docid);
            }
          }
        }
      }

      if (missingUsers.length || missingDepartments.length) {
        const accessors = await searchAccessors([...missingUsers, ...missingDepartments], {
          signal: ac.current?.signal,
        });

        for (const accessor of accessors) {
          if (accessor.type === "user" && missingUsers.includes(accessor.name)) {
            missingUsers = missingUsers.filter((name) => name !== accessor.name);
            newAttachments.push(accessor);
            attachmentIds.add(accessor.id);
          }

          if (accessor.type === "department" && missingDepartments.includes(accessor.name)) {
            missingDepartments = missingDepartments.filter((name) => name !== accessor.name);
            newAttachments.push(accessor);
            attachmentIds.add(accessor.id);
          }
        }
      }

      if (newAttachments.length) {
        const finalAttachments = [...attachments, ...newAttachments];
        setAttachments(finalAttachments);
        return finalAttachments;
      }

      return attachments;
    } catch (e) {
      return attachments;
    }
  });

  const analysis = useEvent(async () => {
    const editorState = editor.getEditorState();
    const query = editorState.read(() => $getRoot().getTextContent()).trim();

    if (!query) return;

    ac.current?.abort();
    ac.current = new AbortController();
    setIsAnalyzing(true);

    let selections = "";
    let references = "";

    if (selectedItems?.length) {
      selections = JSON.stringify(
        selectedItems.map((item) => ({
          name: item.name,
          docid: item.docid,
          type: item.size === -1 ? "folder" : "file",
          size: item.size,
        }))
      );
    }

    const attachments = await getAttachments();

    if (attachments.length) {
      references = JSON.stringify(attachments);
    }

    try {
      const res = await callAgent(
        agentIds[Agent.Analyzer],
        {
          query,
          selections,
          references,
          csflevels: JSON.stringify(csflevels),
        },
        {
          signal: ac.current?.signal,
        }
      );

      const answerText = getAgentAnswerText(res)

      if (answerText) {
        editor.update(() => {
          const root = $getRoot();
          root.clear();
          root.append($createParagraphNode().append($createTextNode(answerText)));
        });
      }
    } finally {
      setIsAnalyzing(false);
    }
  });

  const fix = useEvent(async (dag: DagDetail) => {
    if (typeof dag.title === "string") {
      dag.title = dag.title.replaceAll(/[/:*?\"<>|]/g, " ").slice(0, 128);
    }

    if (dag.steps.length) {
      const operator = dag.steps[0].operator;
      const parameters: any = dag.steps[0].parameters || {};
      switch (operator) {
        case "@trigger/cron":
          dag.steps[0].parameters = {
            cron: `0 ${parameters.minute || 0} ${parameters.hour || 0} ? * 0`,
          };
          break;
        case "@trigger/cron/week":
          dag.steps[0].parameters = {
            cron: `0 ${parameters.minute || 0} ${parameters.hour || 0} ? * ${parameters.weekday || 1}`,
          };
          break;
        case "@trigger/cron/month":
          dag.steps[0].parameters = {
            cron: `0 ${parameters.minute || 0} ${parameters.hour || 0} ${parameters.day || 1} * ?`,
          };
      }
    }
  });

  const parse = useEvent(async (raw: string): Promise<DagDetail | void> => {
    const dag = parseJSON<DagDetail>(raw);

    if (dag) {
      fix(dag);
    }

    return dag;
  });

  const generate = useEvent(async () => {
    const editorState = editor.getEditorState();
    const query = editorState.read(() => $getRoot().getTextContent()).trim();

    if (!query) return;
    ac.current?.abort();
    ac.current = new AbortController();
    setIsGenerating(true);

    let selections = "";
    let references = "";

    if (selectedItems?.length) {
      selections = JSON.stringify(
        selectedItems.map((item) => ({
          name: item.name,
          docid: item.docid,
          type: item.size === -1 ? "folder" : "file",
          size: item.size,
        }))
      );
    }

    const attachments = await getAttachments();

    if (attachments.length) {
      references = JSON.stringify(attachments);
    }

    try {
      const res = await callAgent(
        agentIds[Agent.Generator],
        {
          query,
          selections,
          references,
          csflevels: JSON.stringify(csflevels),
        },
        {
          signal: ac.current?.signal,
        }
      );

      const generatedDag = await parse(getAgentAnswerText(res));

      if (generatedDag) {
        onDagChange?.(generatedDag);
      } else {
        message.info(t("assistant.generateFailed", "生成流程失败"));
      }
    } catch (e: any) {
      if (e?.message !== "canceled") {
        message.info(t("assistant.generateFailed", "生成流程失败"));
      }
    } finally {
      setIsGenerating(false);
    }
  });

  const clear = useEvent(() => {
    setAttachments([]);
    editor.update(() => $getRoot().clear());
  });

  useImperativeHandle(
    ref,
    () => {
      return {
        clearInput() {
          editor.update(() => $getRoot().clear());
        },
      };
    },
    []
  );

  return (
    <footer className={styles.EditorFooter}>
      <Space size="small">
        {isAnalyzing || isGenerating ? (
          <Button icon={<LoadingOutlined />} size="small" onClick={() => ac.current?.abort()}>
            {t("assistant.cancel", "取消")}
          </Button>
        ) : (
          <>
            <Button size="small" onClick={clear}>
              {t("assistant.clear", "清空")}
            </Button>
            <Button size="small" onClick={analysis}>
              {t("assistant.analysis", "分析")}
            </Button>
            <Button size="small" type="primary" onClick={generate}>
              {t("assistant.generate", "创建流程")}
            </Button>
          </>
        )}
      </Space>
    </footer>
  );
});
