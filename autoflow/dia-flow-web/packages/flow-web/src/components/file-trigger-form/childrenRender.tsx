import { AsUserSelectChildProps } from "@applet/common";
import { Space, Tag, Button } from "antd";
import styles from "./styles/childrenRender.module.less";
import { FormAddOutlined } from "@applet/icons";

export function AsUserSelectChildRender({
    t,
    items = [],
    onAdd,
    removeItem,
}: AsUserSelectChildProps) {
    return (
        <>
            <Space
                size={[0, 8]}
                wrap
                hidden={items.length === 0}
                style={{ marginBottom: "16px" }}
            >
                {items.map((item) => {
                    const name =
                        item.name +
                        (item.type === "department"
                            ? " " + t("tag.department", "部门")
                            : "");
                    return (
                        <Tag
                            key={item.id}
                            title={name}
                            closable
                            onClose={() => removeItem(item)}
                            className={styles["tag"]}
                        >
                            {name}
                        </Tag>
                    );
                })}
            </Space>
            <div>
                <Button
                    type="default"
                    style={{ minWidth: "60px" }}
                    onClick={onAdd}
                    className={styles["add-btn"]}
                    icon={<FormAddOutlined style={{ fontSize: "13px" }} />}
                >
                    {t("select", "选择")}
                </Button>
            </div>
        </>
    );
}
