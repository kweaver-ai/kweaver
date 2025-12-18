import { Typography, Space } from 'antd';
import styles from './create-mode-step.module.less';
import createEmpty from '../assets/create-empty.svg';
import templateCreate from '../assets/template-create.svg';
import { useTranslate } from '@applet/common';

const { Text } = Typography;

export enum CreateMode {
    Template = 'template',
    Blank = 'blank',
}

interface ISelectCreateModeProps {
    onSelectMode: (mode: CreateMode) => void;
    onNext: () => void;
}

export const SelectCreateMode = ({ onSelectMode, onNext }: ISelectCreateModeProps) => {
    const t = useTranslate();
    return (
        <div className={styles['create-mode-content']}>
        <Text className={styles['create-mode-title']}>{t("datastudio.create.selectMode", "请选择新建的方式")}</Text>
        <Space direction="vertical" size={16} className={styles['create-mode-options']}>
            <div 
                className={styles['create-mode-option']}
                onClick={onNext}
            >
                <img src={templateCreate} alt="从模板新建" className={styles['create-mode-icon']} />
                <div className={styles['create-mode-content']}>
                    <Text className={styles['title']}>{t("datastudio.create.fromTemplate", "从模板新建")}</Text>
                    <Text className={styles['description']}>
                        {t("datastudio.create.templateDesc", "基于特定场景，一键新建与之相关的数据处理流程")}
                    </Text>
                </div>
            </div>
            <div 
                className={styles['create-mode-option']}
                onClick={() => onSelectMode(CreateMode.Blank)}
            >
                <img src={createEmpty} alt="从空白新建" className={styles['create-mode-icon']} />
                <div className={styles['create-mode-content']}>
                    <Text className={styles['title']}>{t("datastudio.create.fromBlank", "从空白新建")}</Text>
                    <Text className={styles['description']}>
                        {t("datastudio.create.blankDesc", "基于业务新建自定义的数据处理流程")}
                    </Text>
                </div>
            </div>
        </Space>
    </div>
    );
}

export default SelectCreateMode;