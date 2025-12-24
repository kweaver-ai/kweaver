import { Event } from "./index";
const e = new Event();

const fn = jest.fn();
e.registry("test", fn);

test("renders learn react link", () => {
    e.trigger("test");
    expect(fn).toBeCalled();
});
