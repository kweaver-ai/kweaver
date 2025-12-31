import { Space, Typography } from "antd";
import styles from "./create-mode-step.module.less";
import atlasTemplates from "../assets/atlas-templates.svg";
import createIndex from "../assets/create-index.svg";
import { useTranslate } from "@applet/common";
import { CreateType } from "./template-flows-data";

const { Text } = Typography;

interface ICreateFromTemplateProps {
  onNext: (type: CreateType) => void;
}

export const CreateFromTemplate = ({ onNext }: ICreateFromTemplateProps) => {
  const t = useTranslate();
  return (
    <Space direction="vertical" size={16} className={styles['create-mode-options']}>
      <div className={styles["create-mode-option"]} onClick={() => onNext(CreateType.UpdateAtlas)}>
        <img
          src={atlasTemplates}
          alt="updateGraph"
          className={styles["create-mode-icon"]}
        />
        <div className={styles["create-mode-content"]}>
          <Text className={styles["title"]}>{t("datastudio.update.fromTemplate", "更新知识网络")}</Text>
          <Text className={styles["description"]}>
            {t("datastudio.create.templateDesc", "提供多种触发方式自动更新知识网络")}
          </Text>
        </div>
      </div>
      {/* <div className={styles["create-mode-option"]} onClick={() => onNext(CreateType.CreateIndex)}>
        <img
          src={createIndex}
          alt="updateGraph"
          className={styles["create-mode-icon"]}
        />
        <div className={styles["create-mode-content"]}>
          <Text className={styles["title"]}>{t("datastudio.create.docIndex", "创建文档索引")}</Text>
          <Text className={styles["description"]}>
            {t("datastudio.create.docIndexDesc", "提供定时和事件触发方式自动创建文档索引")}
          </Text>
        </div>
      </div> */}
      <div className={styles["create-mode-option"]} onClick={() => onNext(CreateType.PdfParse)}>
        <img
          src={createIndex}
          alt="pdfParse"
          className={styles["create-mode-icon"]}
        />
        <div className={styles["create-mode-content"]}>
          <Text className={styles["title"]}>{t("datastudio.create.pdfParse", "PDF文档智能解析")}</Text>
          <Text className={styles["description"]}>
            {t("datastudio.create.pdfParseDesc", "支持对PDF文档多维度的内容提取与结构化输出")}
          </Text>
        </div>
      </div>
    </Space>
  );
};
