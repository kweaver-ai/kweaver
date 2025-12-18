import { FC, useMemo } from "react";
import { Tag } from "antd";
import { ShareOrganizationOutlined, UserOutlined } from "@applet/icons";
import styles from "./styles/workflow-plugin-file-tags.module.less";

interface Accessor {
    id: string;
    name: string;
    type: string;
}

interface WorkflowPluginAccessorsProps {
    accessors: Accessor[];
    type: "user" | "department";
}

export const WorkflowPluginAccessors: FC<WorkflowPluginAccessorsProps> = ({
    accessors,
    type,
}) => {
    const parseData: Accessor[] = useMemo(() => {
        if (typeof accessors === "string") {
            try {
                return JSON.parse(accessors);
            } catch (error) {
                return accessors;
            }
        }
        return accessors;
    }, [accessors]);

    return (
        <div className={styles["accessors-container"]}>
            {parseData?.map((item: Accessor) => (
                <Tag
                    icon={
                        type === "department" ? (
                            <ShareOrganizationOutlined
                                style={{ fontSize: "13px" }}
                            />
                        ) : (
                            <UserOutlined style={{ fontSize: "13px" }} />
                        )
                    }
                    className={styles["tag"]}
                    title={item.name}
                >
                    {item.name}
                </Tag>
            ))}
        </div>
    );
};
