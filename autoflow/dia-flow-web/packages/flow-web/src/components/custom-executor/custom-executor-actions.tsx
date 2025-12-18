import { useTranslate } from "@applet/common";
import {
    ExecutorActionDto,
    ExecutorActionDtoTypeEnum,
} from "../../models/executor-action-dto";
import { List } from "antd";
import {
    CustomExecutorActionCard,
    NewCustomExecutorActionCard,
} from "./custom-executor-action-card";
import { useMemo } from "react";
import { Empty, getLoadStatus } from "../table-empty";

interface CustomExecutorActionsProps {
    isAccessible?: boolean;
    actions: ExecutorActionDto[];
    onAdd(): void;
    onEdit(action: ExecutorActionDto): void;
    onRemove(action: ExecutorActionDto): void;
}

const NewAction: ExecutorActionDto = {
    id: "NewAction",
    name: "",
    type: ExecutorActionDtoTypeEnum.Python,
};

export function CustomExecutorActions({
    isAccessible,
    actions,
    onAdd,
    onEdit,
    onRemove,
}: CustomExecutorActionsProps) {
    const t = useTranslate("customExecutor");

    const items = useMemo(
        () => (isAccessible ? [NewAction, ...actions] : actions),
        [actions]
    );

    return (
        <List
            grid={{
                gutter: 24,
                xs: 2,
                sm: 2,
                md: 2,
                lg: 3,
                xl: 3,
                xxl: 4,
            }}
            dataSource={items}
            renderItem={(item) => {
                if (item === NewAction) {
                    return (
                        <List.Item key={item.id}>
                            <NewCustomExecutorActionCard onClick={onAdd} />
                        </List.Item>
                    );
                }

                return (
                    <List.Item key={item.id}>
                        <CustomExecutorActionCard
                            isAccessible={isAccessible}
                            action={item}
                            onEdit={() => onEdit(item)}
                            onRemove={() => onRemove(item)}
                        />
                    </List.Item>
                );
            }}
            locale={{
                emptyText: (
                    <Empty
                        loadStatus={getLoadStatus({
                            isLoading: false,
                            data: [],
                        })}
                        height={24}
                        emptyText={t("empty", "列表为空")}
                    />
                ),
            }}
        ></List>
    );
}
