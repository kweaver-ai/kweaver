import React, { useState } from "react";
import { FileTriggerForm } from "./file-trigger-form";
import { FileTriggerList } from "./file-trigger-list";

export const FileTriggerPage = () => {
    const [taskId, setTaskId] = useState("");

    const handleSelect = (id: string) => {
        setTaskId(id);
    };

    const handleBack = () => {
        setTaskId("");
    };
    return taskId.length > 0 ? (
        <FileTriggerForm taskId={taskId} onBack={handleBack} />
    ) : (
        <FileTriggerList onSelect={handleSelect} />
    );
};
