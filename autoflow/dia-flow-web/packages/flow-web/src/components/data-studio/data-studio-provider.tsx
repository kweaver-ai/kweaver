import React, { createContext, useContext, useState, ReactNode } from 'react';
import moment from 'moment';

interface TaskDetailState {
    dateRange: [moment.Moment, moment.Moment];
    searchValue: string;
}

interface DataStudioContextType {
    taskDetailState: TaskDetailState;
    setTaskDetailState: (state: TaskDetailState) => void;
}

export const defaultState: TaskDetailState = {
    dateRange: [
        moment().subtract(7, 'days').startOf('day'),
        moment().endOf('day')
    ],
    searchValue: '',
};

const DataStudioContext = createContext<DataStudioContextType>({
    taskDetailState: defaultState,
    setTaskDetailState: () => {},
});

export function DataStudioProvider({ children }: { children: ReactNode }) {
    const [taskDetailState, setTaskDetailState] = useState<TaskDetailState>(defaultState);

    return (
        <DataStudioContext.Provider value={{ taskDetailState, setTaskDetailState }}>
            {children}
        </DataStudioContext.Provider>
    );
}

export function useDataStudio() {
    return useContext(DataStudioContext);
}
