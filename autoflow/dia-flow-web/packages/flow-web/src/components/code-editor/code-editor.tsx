import {
    forwardRef,
    useContext,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from "react";
import clsx from "clsx";
import { debounce } from "lodash";
import CodeMirror from "codemirror";
import { FullscreenOutlined, FullscreenExitOutlined } from "@applet/icons";
import "codemirror/lib/codemirror.css";
// 主题色
import "codemirror/theme/ayu-dark.css";
// 高亮行功能
import "codemirror/addon/selection/active-line";
import "codemirror/addon/selection/selection-pointer";
// 自动括号匹配功能
import "codemirror/addon/edit/matchbrackets";
import "codemirror/addon/edit/closebrackets";
import "codemirror/keymap/sublime";
import "codemirror/addon/hint/show-hint";
import "codemirror/addon/hint/show-hint.css";
// 语言模式资源
import "codemirror/mode/python/python";
import styles from "./code-editor.module.less";
import { MicroAppContext } from "@applet/common";

interface CodeEditorProps {
    value?: any;
    onChange?: (val: string) => void;
    options?: CMOptions;
    onInitEditor?: (cm: CodeMirror.EditorFromTextArea) => void;
}

interface CMOptions extends CodeMirror.EditorConfiguration {
    autoCloseBrackets?: boolean;
}

export interface CodeEditorInstance {
    cm?: CodeMirror.EditorFromTextArea;
}

export const CodeEditor = forwardRef<CodeEditorInstance, CodeEditorProps>(
    (props: CodeEditorProps, ref) => {
        const { value, onChange, options, onInitEditor } = props;
        const [isFullScreen, setFullScreen] = useState(false);
        const containerRef = useRef<any>(null);
        const editorRef = useRef<CodeMirror.EditorFromTextArea>();
        const { platform } = useContext(MicroAppContext);

        const handleChange = debounce((editor: CodeMirror.Editor) => {
            onChange && onChange(editor.getValue());
        }, 500);

        const toggleFullScreen = () => {
            setFullScreen((pre) => !pre);
            const container = document.getElementById("code-editor");

            if (container && container.scrollIntoView) {
                setTimeout(() => {
                    container.scrollIntoView();
                    editorRef.current && editorRef.current.focus();
                }, 0);
            }
        };

        useImperativeHandle(ref, () => {
            return {
                cm: editorRef.current,
            };
        });

        useEffect(() => {
            if (containerRef.current) {
                editorRef.current = CodeMirror.fromTextArea(
                    containerRef.current,
                    options
                        ? options
                        : ({
                              mode: {
                                  name: "python",
                                  version: 3,
                              },
                              tabSize: 4,
                              theme: "ayu-dark",
                              keyMap: "sublime",
                              lineNumbers: true,
                              indentUnit: 4,
                              hintOptions: {
                                  completeSingle: false,
                                  container: document.getElementById(
                                      "content-automation-root"
                                  ),
                              },
                              extraKeys: {
                                  F11: toggleFullScreen,
                              },
                              matchBrackets: true,
                              autoCloseBrackets: true,
                              styleActiveLine: true,
                              selectionPointer: true,
                          } as CMOptions)
                );

                if (typeof onInitEditor === "function") {
                    onInitEditor(editorRef.current);
                } else {
                    editorRef.current.setSize("auto", "320px");
                    editorRef.current.setValue(value || "");
                    editorRef.current.on("change", handleChange);
                    // 代码补全
                    editorRef.current.on(
                        "inputRead",
                        function onChange(editor, input) {
                            if (
                                input.text[0] === ";" ||
                                input.text[0] === " " ||
                                input.text[0] === ":"
                            ) {
                                return;
                            }

                            editor.showHint({
                                hint: (CodeMirror as any).pythonHint,
                            });
                        }
                    );
                }
            }
        }, []);

        useEffect(() => {
            const handleResize = () => {
                if (editorRef.current) {
                    editorRef.current.setSize("auto", window.innerHeight - 52);
                }
            };
            const handleEsc = (event: KeyboardEvent) => {
                if (event.key === "Escape") {
                    event.stopPropagation();
                    event.preventDefault();
                    setFullScreen(false);
                    const container = document.getElementById("code-editor");
                    if (container && container.scrollIntoView) {
                        setTimeout(() => {
                            container.scrollIntoView();
                            editorRef.current && editorRef.current.focus();
                        }, 0);
                    }
                }
            };
            if (editorRef.current) {
                if (isFullScreen) {
                    handleResize();
                    window.addEventListener("resize", handleResize);
                    window.addEventListener("keydown", handleEsc, true);
                } else {
                    editorRef.current.setSize("auto", "320px");
                }
            }
            return () => {
                window.removeEventListener("resize", handleResize);
                window.removeEventListener("keydown", handleEsc, true);
            };
        }, [isFullScreen]);

        return (
            <div
                className={clsx(
                    styles["fullscreen-container"],
                    {
                        [styles["fullscreen-fixed"]]: isFullScreen,
                    },
                    {
                        [styles["full"]]: platform === "console",
                    }
                )}
            >
                <div id="code-editor" className={styles["editor-container"]}>
                    {isFullScreen ? (
                        <FullscreenExitOutlined
                            onClick={toggleFullScreen}
                            className={styles["fullscreen-btn"]}
                        />
                    ) : (
                        <FullscreenOutlined
                            onClick={toggleFullScreen}
                            className={styles["fullscreen-btn"]}
                        />
                    )}
                    <textarea ref={containerRef} name="code"></textarea>
                </div>
            </div>
        );
    }
);
