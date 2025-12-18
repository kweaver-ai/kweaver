import { Tag } from "antd";
import { VariableItem } from "./variable-item";
import { LexicalEditor } from "lexical";
import { useContext, useEffect, useState } from "react";
import { EditorContext } from "../../components/editor/editor-context";
import Tooltip from "antd/es/tooltip";

interface Variable {
  name?: string;
  key?: string;
  [key: string]: any;
}

export const TagNodeComponent: React.FC<{
  variable: Variable;
  nodeKey: string;
  editor: LexicalEditor;
  onRemove: () => void;
}> = ({ variable, nodeKey, editor, onRemove }) => {
  const [variableVal, setVariableVal] = useState(variable);
  const { stepNodes, stepOutputs } = useContext(EditorContext);

  useEffect(() => {
    const value = variable.value;
    if (value) {
        // 找到最精确的匹配项（最长的匹配前缀）
        let bestMatch: any = null;
        
        Object.entries(stepOutputs).forEach(([id, val]) => {
          if (value.startsWith(id)) {
            const differentPart = value.substring(id.length);
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
          key: bestMatch?.id,
          value: bestMatch.value,
          differentPart: bestMatch.differentPart
        }] : [];

      setVariableVal({
        ...outputsNew[0]?.value,
      });;
    }
  }, [stepNodes, stepOutputs, variable]);

  const handleClick = (e: React.MouseEvent) => {
    const type = variableVal?.type;
    if (!(typeof type === "string" && ["array", "object", "any"].includes(type)))
      return false;
    e.preventDefault();
    e.stopPropagation();

    // 获取点击元素的位置
    const rect = e.currentTarget.getBoundingClientRect();

    // 触发自定义事件
    const event = new CustomEvent("tag-edit-click", {
      detail: {
        variable,
        nodeKey,
        editor,
        position: {
          top: rect.bottom + window.scrollY + 10,
          left: rect.left + window.scrollX,
        },
      },
    });
    document.dispatchEvent(event);
  };

  return (
    <Tooltip
      placement="bottom"
      title={
        typeof variableVal?.type === "string" &&
        ["array", "object", "any"].includes(variableVal?.type) &&
        "点击可进入变量编辑"
      }
    >
      <Tag
        color="blue"
        closable
        onClose={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove();
        }}
        onClick={handleClick}
        style={{
          display: "flex",
          cursor: "pointer",
          alignItems: "center",
          border: "none",
        }}
        className="editor-tag-node"
      >
        <VariableItem
          value={`{{${variable.value}}}`}
          variable={variable}
        />
      </Tag>
    </Tooltip>
  )
}
