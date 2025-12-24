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
import { ExtensionProvider } from "./components/extension-provider/extension-provider";
import { TaskPanel } from "./pages/task-panel";
import { LogPanel } from "./pages/log-panel";
import { EditorPanel } from "./pages/editor-panel";
import { AuthCallBack } from "./pages/auth-callback";
import { OemConfigProvider } from "./components/oem-provider";
import { ServiceConfigProvider } from "./components/config-provider";
import { GuidePage } from "./pages/guide";
import { TagExtract } from "./components/tag-extract";
import { DisablePage } from "./pages/disable-page";
import { TextExtract } from "./components/text-extract";
import { CustomModelDetails } from "./components/custom-model-details";
import { ExecutorDetails } from "./pages/executor-details/executor-details";
import { ExecutorNew } from "./pages/executor-new/executor-new";
import { PythonPackages } from "./pages/python-packages";
import AuditTemplate from "./pages/home/audit-template";
import AuditAgency from "./pages/home/audit-agency";

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
        <ExtensionProvider>
            <ServiceConfigProvider>
                <OemConfigProvider>
                    <Router basename={basename} initialEntries={initialEntries}>
                        <Routes>
                            <Route path="/" element={<Home />}></Route>
                            <Route path="/nav/*" element={<Home />}></Route>
                            <Route path="/new" element={<EditorPanel />} />
                            <Route path="/pythonPackages" element={<PythonPackages />} />
                            <Route path="/edit/:id" element={<EditorPanel />} />
                            <Route
                                path="/details/:id"
                                element={<TaskPanel />}
                            />
                            <Route
                                path="/details/:id/log/:recordId"
                                element={<LogPanel />}
                            />
                            <Route
                                path="/model/tagExtract/new"
                                element={<TagExtract />}
                            />
                            <Route
                                path="/model/tagExtract/edit/:id"
                                element={<TagExtract />}
                            />
                            <Route
                                path="/model/textExtract/new"
                                element={<TextExtract />}
                            />
                            <Route
                                path="/model/textExtract/edit/:id"
                                element={<TextExtract />}
                            />
                            <Route
                                path="/model/details/:id"
                                element={<CustomModelDetails />}
                            />
                            <Route path="/disable" element={<DisablePage />} />
                            <Route path="/guide" element={<GuidePage />} />

                            <Route
                                path="/executors/new"
                                element={<ExecutorNew />}
                            />

                            <Route
                                path="/executors/:executorId"
                                element={<ExecutorDetails />}
                            />
                           <Route path="/workflow-manage-client" element={<AuditTemplate />}></Route>
                           <Route path="/doc-audit-client" element={<AuditAgency />}></Route>
                           <Route path="*" element={<AuthCallBack />} />
                        </Routes>
                    </Router>
                </OemConfigProvider>
            </ServiceConfigProvider>
        </ExtensionProvider>
    );
}

export default App;
