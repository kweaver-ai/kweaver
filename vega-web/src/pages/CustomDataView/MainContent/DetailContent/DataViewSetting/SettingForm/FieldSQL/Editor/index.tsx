import { useCallback, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { snippet } from '@codemirror/autocomplete';
import { sql } from '@codemirror/lang-sql';
import { vscodeLight } from '@uiw/codemirror-theme-vscode';
import ReactCodeMirror, { EditorView, ReactCodeMirrorProps, ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { Modal } from 'antd';
import { format } from 'sql-formatter';
import { placeholdersPlugin } from './plugin/placeholders';

export const getFormatSql = (text?: string) => {
  if (!text) return '';
  let result = text;
  try {
    result = format(text, {
      language: 'sql',
      // tabWidth: 2,
      // keywordCase: 'lower',
      // linesBetweenQueries: 2
      paramTypes: {
        custom: [
          {
            regex: String.raw`\{\{.+?\}\}`,
          },
        ],
      },
    });
  } catch (error) {}
  return result;
};

interface IEditor extends ReactCodeMirrorProps {
  ref?: any;
  prevNodeMap?: any;
}

function Editor(props: IEditor, ref: any) {
  const { value, onChange, readOnly, prevNodeMap = {}, ...reset } = props;
  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const insertText = useCallback((text: string, isTemplate?: boolean) => {
    const { view } = editorRef.current!;
    if (!view) return;

    const { state } = view;
    if (!state) return;

    const [range] = state?.selection?.ranges || [];

    view.focus();

    if (isTemplate) {
      snippet(text)(
        {
          state,
          dispatch: view.dispatch,
        },
        {
          label: text,
          detail: text,
        },
        range.from,
        range.to
      );
    } else {
      view.dispatch({
        changes: {
          from: range.from,
          to: range.to,
          insert: text,
        },
        selection: {
          anchor: range.from + text.length,
        },
      });
    }
  }, []);

  const clearText = useCallback(() => {
    const { view } = editorRef.current!;
    if (!view) return;
    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: '',
      },
      selection: {
        anchor: 0,
      },
    });
    view.focus();
  }, []);

  useImperativeHandle(ref, () => {
    return {
      insertText,
      clearText,
      originEditorRef: editorRef,
    };
  }, [insertText, clearText]);

  const [open, setOpen] = useState(false);
  const [textName, setTextName] = useState('');
  const [styleObj, setStyleObj] = useState({});
  const [modalContent, setModalContent] = useState('');

  const showModal = (modalStyle: any, text: string) => {
    const tmp = text.slice(2, -1);
    setTextName(tmp);
    setStyleObj(modalStyle);
    let modalText = prevNodeMap[tmp];
    try {
      modalText = format(prevNodeMap[tmp], {
        language: 'mysql',
        tabWidth: 2,
        keywordCase: 'upper',
        linesBetweenQueries: 2,
      });
      setModalContent(modalText);
    } catch (e) {
      setModalContent(modalText);
    }
    setOpen(true);
  };

  const handleOk = () => {
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <div>
      <ReactCodeMirror
        ref={editorRef}
        value={value}
        theme={vscodeLight}
        extensions={[
          sql(),
          placeholdersPlugin(
            {
              FFF: {
                textColor: 'rgba(18, 110, 227, 1)',
                backgroudColor: 'rgba(236, 244, 253, 1)',
                borderColor: 'rgba(236, 244, 253, 1)',
              },
            },
            (modalStyle, text) => {
              showModal(modalStyle, text);
            },
            'name'
          ),
          EditorView.lineWrapping,
        ]}
        onChange={onChange}
        {...reset}
      />
      {prevNodeMap[textName] && (
        <Modal
          open={open}
          title={textName}
          onOk={handleOk}
          onCancel={handleCancel}
          footer={null}
          mask={false}
          getContainer={false}
          style={{
            ...styleObj,
          }}
          bodyStyle={{
            maxHeight: 400,
            padding: 0,
            overflow: 'hidden',
          }}
        >
          <pre
            style={{
              marginBottom: 0,
              padding: 16,
              maxHeight: 400,
            }}
          >
            {modalContent}
          </pre>
        </Modal>
      )}
    </div>
  );
}
export default forwardRef(Editor);
