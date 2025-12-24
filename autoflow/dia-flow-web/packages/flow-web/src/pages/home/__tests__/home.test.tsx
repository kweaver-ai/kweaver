import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { API, MicroAppProvider } from "@applet/common";
import zhCN from "../../../locales/zh-cn.json";
import zhTW from "../../../locales/zh-tw.json";
import enUS from "../../../locales/en-us.json";
import viVN from "../../../locales/vi-vn.json";
import "../../../matchMedia.mock";
import { Home } from "../home";
import { Modal } from "antd";

const translations = {
    "zh-cn": zhCN,
    "zh-tw": zhTW,
    "en-us": enUS,
    "vi-vn": viVN
};

// jest.mock("../../../components/template-select-modal", () => ({
//     TemplateSelectModal() {
//         return <div>template-select-modal</div>;
//     },
// }));

// jest.mock("../../../components/task-card", () => ({
//     Card({ task, refresh, onChange }: any) {
//         return (
//             <div>
//                 <div>task-card</div>
//                 <div>{task?.title}</div>
//                 <button data-testid="refresh" onClick={refresh}>
//                     refresh
//                 </button>
//                 <button
//                     data-testid="switch"
//                     onClick={() =>
//                         onChange("435928181568988672", "switch", "stopped")
//                     }
//                 >
//                     switch
//                 </button>
//                 <button
//                     data-testid="delete"
//                     onClick={() => onChange("435928181568988672", "delete")}
//                 >
//                     delete
//                 </button>
//             </div>
//         );
//     },
// }));

// jest.mock("../../../components/table-empty", () => {
//     return {
//         Empty() {
//             return <div>mockEmpty</div>;
//         },
//         getLoadStatus(isLoading: boolean, error: any, data: any) {
//             return error ? "error" : "empty";
//         },
//     };
// });

// jest.mock("../../../components/auth-expiration", () => ({
//     AuthExpiration() {
//         return <div>mock-auth-expiration</div>;
//     },
// }));

const renders = (children: any) =>
    render(
        <MicroAppProvider
            microWidgetProps={{}}
            container={document.body}
            translations={translations}
            prefixCls="CONTENT_AUTOMATION_NEW-ant"
            iconPrefixCls="CONTENT_AUTOMATION_NEW-anticon"
        >
            {children}
        </MicroAppProvider>
    );

describe("Home", () => {
    it("渲染Home", async () => {
        renders(
            <MemoryRouter initialEntries={["/"]}>
                <Routes>
                    <Route path="/" element={<Home />} />
                </Routes>
            </MemoryRouter>
        );
    });
});

// describe("Home", () => {
//     beforeEach(() => {
//         jest.clearAllMocks();
//         jest.resetAllMocks();
//     });

//     afterEach(() => {
//         jest.restoreAllMocks();
//     });

//     it("渲染Home", async () => {
//         jest.spyOn(API.automation, "dagsGet").mockImplementation(() =>
//             Promise.resolve({
//                 data: {
//                     dags: [
//                         {
//                             id: "435928181568988672",
//                             title: "文件夹标签",
//                             actions: [
//                                 "@trigger/manual",
//                                 "@anyshare/folder/create",
//                                 "@anyshare/folder/addtag",
//                             ],
//                             created_at: 1669363044,
//                             updated_at: 1669692230,
//                             status: "normal",
//                         },
//                         {
//                             id: "435928181568988612",
//                             title: "文件夹标签2",
//                             actions: [
//                                 "@trigger/manual",
//                                 "@anyshare/folder/create",
//                                 "@anyshare/folder/addtag",
//                             ],
//                             created_at: 1669363044,
//                             updated_at: 1669692230,
//                             status: "normal",
//                         },
//                     ],
//                     total: 1,
//                     page: 0,
//                     limit:20
//                 },
//                 status: 200,
//                 statusText: "OK",
//             } as any)
//         );
//         renders(
//             <MemoryRouter initialEntries={["/"]}>
//                 <Routes>
//                     <Route path="/" element={<Home />} />
//                 </Routes>
//             </MemoryRouter>
//         );
//         expect(screen.getByText("全部自动任务")).toBeInTheDocument();
//         expect(screen.getByPlaceholderText("搜索任务名称")).toBeInTheDocument();
//         expect(screen.getByText("mock-auth-expiration")).toBeInTheDocument();
//         expect(await screen.findAllByText("task-card")).toHaveLength(2);
//         await userEvent.click(screen.getAllByTestId("switch")[0]);
//         await userEvent.click(screen.getAllByTestId("delete")[0]);
//         expect(await screen.findByText("task-card")).toBeInTheDocument();
//         await userEvent.click(screen.getByTestId("refresh"));
//     });

//     it("新建空白任务", async () => {
//         jest.spyOn(API.automation, "dagsGet").mockImplementation(() =>
//             Promise.resolve({
//                 data: { dags: [], total: 0, page: 0 },
//                 status: 200,
//                 statusText: "OK",
//             } as any)
//         );
//         renders(
//             <MemoryRouter initialEntries={["/"]}>
//                 <Routes>
//                     <Route path="/" element={<Home />} />
//                     <Route path="/new" element={<div>new</div>} />
//                 </Routes>
//             </MemoryRouter>
//         );
//         expect(await screen.findByText("mockEmpty")).toBeInTheDocument();
//         const button = screen.getByText("新建自动任务");
//         await userEvent.hover(button);
//         const newBtn = await screen.findByText("新建空白任务");
//         expect(newBtn).toBeInTheDocument();
//         await userEvent.click(newBtn);
//         expect(await screen.findByText("new")).toBeInTheDocument();
//     });

//     it("新建模板任务", async () => {
//         jest.spyOn(API.automation, "dagsGet").mockImplementation(() =>
//             Promise.resolve({
//                 data: { dags: [], total: 0, page: 0 },
//                 status: 200,
//                 statusText: "OK",
//             } as any)
//         );
//         renders(
//             <MemoryRouter initialEntries={["/"]}>
//                 <Routes>
//                     <Route path="/" element={<Home />} />
//                     <Route path="/new" element={<div>new</div>} />
//                 </Routes>
//             </MemoryRouter>
//         );
//         expect(await screen.findByText("mockEmpty")).toBeInTheDocument();
//         const button = screen.getByText("新建自动任务");
//         await userEvent.hover(button);
//         const newBtn = await screen.findByText("从模板新建...");
//         expect(newBtn).toBeInTheDocument();
//         await userEvent.click(newBtn);
//         expect(
//             await screen.findByText("template-select-modal")
//         ).toBeInTheDocument();
//     });

//     it("排序", async () => {
//         jest.spyOn(API.automation, "dagsGet").mockImplementation(() =>
//             Promise.resolve({
//                 data: {
//                     dags: [
//                         {
//                             id: "435928181568988672",
//                             title: "文件夹标签",
//                             actions: [
//                                 "@trigger/manual",
//                                 "@anyshare/folder/create",
//                                 "@anyshare/folder/addtag",
//                             ],
//                             created_at: 1669363044,
//                             updated_at: 1669692230,
//                             status: "normal",
//                         },
//                         {
//                             id: "435928181568988612",
//                             title: "文件夹标签2",
//                             actions: [
//                                 "@trigger/manual",
//                                 "@anyshare/folder/create",
//                                 "@anyshare/folder/addtag",
//                             ],
//                             created_at: 1669363044,
//                             updated_at: 1669692230,
//                             status: "normal",
//                         },
//                     ],
//                     total: 1,
//                     page: 0,
//                 },
//                 status: 200,
//                 statusText: "OK",
//             } as any)
//         );
//         renders(
//             <MemoryRouter initialEntries={["/"]}>
//                 <Routes>
//                     <Route path="/" element={<Home />} />
//                 </Routes>
//             </MemoryRouter>
//         );
//         const sorter = screen.getByTestId("sorter")
//         await userEvent.click(sorter);
//         expect(await screen.findByText("按任务名称排序")).toBeInTheDocument();
//         const update = await screen.findByText("按创建时间排序");
//         expect(update).toBeInTheDocument();
//         await userEvent.click(update);
//     });

//     it("再次排序", async () => {
//         jest.spyOn(API.automation, "dagsGet").mockImplementation(() =>
//             Promise.resolve({
//                 data: {
//                     dags: [
//                         {
//                             id: "435928181568988672",
//                             title: "文件夹标签",
//                             actions: [
//                                 "@trigger/manual",
//                                 "@anyshare/folder/create",
//                                 "@anyshare/folder/addtag",
//                             ],
//                             created_at: 1669363044,
//                             updated_at: 1669692230,
//                             status: "normal",
//                         },
//                         {
//                             id: "435928181568988612",
//                             title: "文件夹标签2",
//                             actions: [
//                                 "@trigger/manual",
//                                 "@anyshare/folder/create",
//                                 "@anyshare/folder/addtag",
//                             ],
//                             created_at: 1669363044,
//                             updated_at: 1669692230,
//                             status: "normal",
//                         },
//                     ],
//                     total: 1,
//                     page: 0,
//                 },
//                 status: 200,
//                 statusText: "OK",
//             } as any)
//         );
//         renders(
//             <MemoryRouter initialEntries={["/home?order=asc&sortby=name"]}>
//                 <Routes>
//                     <Route path="/home" element={<Home />} />
//                 </Routes>
//             </MemoryRouter>
//         );
//         const sorter = screen.getByTestId("sorter")
//         await userEvent.click(sorter);
//         expect(await screen.findByText("按创建时间排序")).toBeInTheDocument();
//         const update = await screen.findByText("按任务名称排序");
//         expect(update).toBeInTheDocument();
//         await userEvent.click(update);
//     });

//     it("搜索", async () => {
//         jest.spyOn(API.automation, "dagsGet").mockImplementation(() =>
//             Promise.resolve({
//                 data: {
//                     dags: [
//                         {
//                             id: "435928181568988672",
//                             title: "文件夹标签",
//                             actions: [
//                                 "@trigger/manual",
//                                 "@anyshare/folder/create",
//                                 "@anyshare/folder/addtag",
//                             ],
//                             created_at: 1669363044,
//                             updated_at: 1669692230,
//                             status: "normal",
//                         },
//                         {
//                             id: "435928181568988612",
//                             title: "文件夹标签2",
//                             actions: [
//                                 "@trigger/manual",
//                                 "@anyshare/folder/create",
//                                 "@anyshare/folder/addtag",
//                             ],
//                             created_at: 1669363044,
//                             updated_at: 1669692230,
//                             status: "normal",
//                         },
//                     ],
//                     total: 1,
//                     page: 0,
//                 },
//                 status: 200,
//                 statusText: "OK",
//             } as any)
//         );
//         renders(
//             <MemoryRouter initialEntries={["/"]}>
//                 <Routes>
//                     <Route path="/" element={<Home />} />
//                 </Routes>
//             </MemoryRouter>
//         );
//         const input = screen.getByPlaceholderText("搜索任务名称");
//         await userEvent.type(input, "test");
//         expect(screen.getByRole("textbox")).toHaveValue("test");
//     });

//     it("搜索后清空搜索", async () => {
//         jest.spyOn(API.automation, "dagsGet").mockImplementation(() =>
//             Promise.resolve({
//                 data: {
//                     dags: [
//                         {
//                             id: "435928181568988672",
//                             title: "文件夹标签",
//                             actions: [
//                                 "@trigger/manual",
//                                 "@anyshare/folder/create",
//                                 "@anyshare/folder/addtag",
//                             ],
//                             created_at: 1669363044,
//                             updated_at: 1669692230,
//                             status: "normal",
//                         },
//                         {
//                             id: "435928181568988612",
//                             title: "文件夹标签2",
//                             actions: [
//                                 "@trigger/manual",
//                                 "@anyshare/folder/create",
//                                 "@anyshare/folder/addtag",
//                             ],
//                             created_at: 1669363044,
//                             updated_at: 1669692230,
//                             status: "normal",
//                         },
//                     ],
//                     total: 1,
//                     page: 0,
//                 },
//                 status: 200,
//                 statusText: "OK",
//             } as any)
//         );
//         renders(
//             <MemoryRouter
//                 initialEntries={[
//                     "/home?keyword=test&order=asc&sortby=created_at",
//                 ]}
//             >
//                 <Routes>
//                     <Route path="/home" element={<Home />} />
//                 </Routes>
//             </MemoryRouter>
//         );
//         const input = screen.getByPlaceholderText("搜索任务名称");
//         await userEvent.type(input, "test");
//         expect(screen.getByRole("textbox")).toHaveValue("testtest");
//         await userEvent.clear(input);
//         expect(screen.getByRole("textbox")).toHaveValue("");
//     });

//     it("请求错误", async () => {
//         jest.spyOn(API.automation, "dagsGet").mockImplementationOnce(() =>
//             Promise.reject({
//                 response: {
//                     data: { code: 500000000, message: "Internal Error" },
//                     status: 500,
//                 },
//                 status: 500,
//                 statusText: "Internal Server Error",
//             } as any)
//         );
//         renders(
//             <MemoryRouter initialEntries={["/"]}>
//                 <Routes>
//                     <Route path="/" element={<Home />} />
//                 </Routes>
//             </MemoryRouter>
//         );
//         expect(await screen.findByText("mockEmpty")).toBeInTheDocument();
//     });

//     it("任务超出50", async () => {
//         jest.spyOn(API.automation, "dagsGet").mockImplementation(() =>
//             Promise.resolve({
//                 data: { dags: [], total: 50, page: 0 },
//                 status: 200,
//                 statusText: "OK",
//             } as any)
//         );
//         renders(
//             <MemoryRouter initialEntries={["/"]}>
//                 <Routes>
//                     <Route path="/" element={<Home />} />
//                     <Route path="/new" element={<div>new</div>} />
//                 </Routes>
//             </MemoryRouter>
//         );
//         await userEvent.hover(screen.getByText("新建自动任务"));
//         const newBtn = await screen.findByText("新建空白任务");
//         expect(newBtn).toBeInTheDocument();
//         await userEvent.click(newBtn);
//         expect(
//             await screen.findByText(
//                 "您新建的自动任务数已达上限。（最多允许新建50个）"
//             )
//         ).toBeInTheDocument();
//     });
// });
