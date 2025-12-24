import { createContext } from "react";
import { IStep } from "./expr";

export const StepsContext = createContext<{ steps: IStep[]; depth: number; }>({
    steps: [],
    depth: 0,
});
