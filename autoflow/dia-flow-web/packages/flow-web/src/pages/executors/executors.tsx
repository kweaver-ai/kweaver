import { API, MicroAppContext, useTranslate } from "@applet/common";
import { List } from "antd";
import { useContext, useMemo } from "react";
import { useNavigate } from "react-router";
import useSWR from "swr";
import {
    CustomExecutorCard,
    NewCustomExecutonCard,
} from "../../components/custom-executor";
import { ExtensionContext } from "../../components/extension-provider";
import { ExecutorDto } from "../../models/executor-dto";
import { useCustomExecutorAccessible } from "../../utils/hooks";
import styles from "./executors.module.less";
import { Empty, getLoadStatus } from "../../components/table-empty";
import { useCustomExecutorErrorHandler } from "../../components/custom-executor/errors";

const NewExecutor: ExecutorDto = {
    id: "NewExecutor",
    name: "",
    status: 0,
};

export function Executors() {
    const { modal } = useContext(MicroAppContext);
    const t = useTranslate("customExecutor");
    const navigate = useNavigate();
    const handleError = useCustomExecutorErrorHandler();

    const { data, mutate } = useSWR(
        `/api/automation/v1/executors`,
        async (url) => {
            const { data } = await API.axios.get<ExecutorDto[]>(url);
            return data;
        },
        {
            onError(e) {
                handleError(e);
            },
        }
    );

    const isAccessible = useCustomExecutorAccessible();

    const executors = useMemo(
        () => (isAccessible ? [NewExecutor, ...(data || [])] : data),
        [data, isAccessible]
    );

    return (
        <div className={styles.Container}>
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
                dataSource={executors}
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
                renderItem={(item) => {
                    if (item === NewExecutor) {
                        return (
                            <List.Item key={item.id}>
                                <NewCustomExecutonCard
                                    onClick={() => navigate("/executors/new")}
                                />
                            </List.Item>
                        );
                    }

                    return (
                        <List.Item key={item.id}>
                            <CustomExecutorCard
                                isAccessible={isAccessible}
                                executor={item}
                                onOpen={() => navigate(`/executors/${item.id}`)}
                                onRemove={() => {
                                    modal.confirm({
                                        className: styles.ConfirmModal,
                                        title: t(
                                            `removeExecutorTitle`,
                                            `确定要删除此自定义节点吗？`
                                        ),
                                        content: t(
                                            `removeExecutorContent`,
                                            `删除后，包含此节点的工作流程将不可用。`
                                        ),
                                        transitionName: "",
                                        async onOk() {
                                            try {
                                                await API.axios.delete(
                                                    `/api/automation/v1/executors/${item.id}`
                                                );
                                            } catch (e) {
                                                handleError(e);
                                            }
                                            mutate();
                                        },
                                    });
                                }}
                            />
                        </List.Item>
                    );
                }}
            ></List>
        </div>
    );
}
