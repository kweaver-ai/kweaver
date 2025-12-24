export const queryMock = jest.fn();
export const escapeMock = jest.fn();
export const releaseMock = jest.fn();

export const res = {
    json: jest.fn(() => res),
    status: jest.fn(() => res),
    set: jest.fn(() => res),
    end: jest.fn(() => res),
    clearCookie: jest.fn(() => res),
    redirect: jest.fn(() => res),
    cookie: jest.fn(() => res),
    send: jest.fn(() => res),
};

jest.mock("../../common/db", () => {
    return {
        deploy: {
            getConnection: async () => {
                return {
                    query: queryMock,
                    escape: escapeMock,
                    release: releaseMock,
                };
            },
        },
    };
});
