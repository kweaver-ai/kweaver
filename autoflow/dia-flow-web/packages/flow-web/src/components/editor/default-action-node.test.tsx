import { render, screen } from "@testing-library/react";
import { DefaultActionNode } from "./default-action-node";

describe("DefaultActionNode", () => {
    it("render DefaultActionNode", async () => {
        const t = jest.fn().mockImplementation((id: string) => id);

        const action = {
            name: "action",
            icon: "data:image/png;base64,",
            operator: "fake-action",
        };

        render(<DefaultActionNode t={t} action={action} />);

        const img = await screen.findByAltText(action.name);
        expect(img).toBeInTheDocument();
        expect(img.getAttribute("src")).toBe(action.icon);

        const actionName = await screen.findByText(action.name);
        expect(actionName).toBeInTheDocument();
    });
});
