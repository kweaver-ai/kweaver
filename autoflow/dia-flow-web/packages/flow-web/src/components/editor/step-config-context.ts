import { createContext } from "react";
import { IStep } from "./expr";

export interface StepConfigContextType {
    step?: IStep;
}

export const StepConfigContext = createContext<StepConfigContextType>({});
