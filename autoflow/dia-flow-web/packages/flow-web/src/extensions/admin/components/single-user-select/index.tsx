import {
    AsUserSelect,
    AsUserSelectChildProps,
    useTranslate,
} from "@applet/common";
import { Button, Input } from "antd";
import styles from "./index.module.less";

interface SingleUserSelectProps {
    value?: any;
    onChange?: (user: any) => void;
}

export const SingleUserSelect = (props: SingleUserSelectProps) => {
    const { value, onChange } = props
    const handleChange = (val: any) => {
        if (onChange) {
            onChange(val[0])
        }
    }
    return (
        <AsUserSelect
            selectPermission={2}
            multiple={false}
            groupOptions={{
                select: 3,
                drillDown: 1,
            }}
            value={[value]}
            onChange={handleChange}
            isBlockContact
            children={SingleUserSelectChildRender}
        />
    );
};

function SingleUserSelectChildRender({
    items = [],
    onAdd,
}: AsUserSelectChildProps) {
    const t = useTranslate()
    return (
        <div className={styles["render-item"]}>
            <Input
                className={styles["input"]}
                placeholder={t("select.placeholder")}
                readOnly
                value={items[0]?.name}
            />
            <Button onClick={onAdd}>{t("select")}</Button>
        </div>
    );
}
