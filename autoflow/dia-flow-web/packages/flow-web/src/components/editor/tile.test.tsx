import { Tile } from "./tile";
import { fireEvent, render, screen } from "@testing-library/react";

describe("Tile", () => {
    it("渲染 Tile", async () => {
        const props = {
            name: "a",
            description: "a description",
            icon: "tile-icon.png",
            selected: true,
            onClick: jest.fn(),
        };
        render(<Tile {...props} />);

        const span = await screen.findByText(props.name);
        expect(span).toBeInTheDocument();
        expect(span.className).toBe("name");

        fireEvent.click(span);
        expect(props.onClick).toBeCalled();
        expect(span.innerHTML).toBe(props.name);

        const description = await screen.findByText(props.description);
        expect(description).toBeInTheDocument();
        expect(description.title).toBe(props.description);
    });
});
