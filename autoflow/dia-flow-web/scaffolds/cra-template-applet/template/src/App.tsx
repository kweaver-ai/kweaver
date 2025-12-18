import React, { useContext, useMemo } from "react";
import {
    BrowserRouter,
    Route,
    Routes,
    HashRouter,
    MemoryRouter,
} from "react-router-dom";
import { MicroAppContext } from "@applet/common";
import { Home } from "./pages/home";

function App() {
    const { microWidgetProps } = useContext(MicroAppContext);

    const [Router, basename, initialEntries] = useMemo(() => {
        const basePath = microWidgetProps?.history?.getBasePath as string;
        if (microWidgetProps?.config?.systemInfo?.isDialogMode) {
            return [
                MemoryRouter,
                "/",
                [microWidgetProps.config.systemInfo.homepage] as string[],
            ] as const;
        }
        if (microWidgetProps?.config?.systemInfo?.platform === "electron") {
            return [HashRouter, basePath.split("#")[1]] as const;
        }
        return [BrowserRouter, basePath] as const;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [microWidgetProps?.config?.systemInfo?.platform]);

    return (
        <Router basename={basename} initialEntries={initialEntries}>
            <Routes>
                <Route path="/" element={<Home />}></Route>
            </Routes>
        </Router>
    );
}

export default App;
