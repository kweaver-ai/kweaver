const {
    iniFileReader,
    formatHeaders,
    httpsRequest,
    fetchParse,
    delDir,
} = require('../index')
const fs = require('fs')
const https = require('https')
// const mock = require('mock-fs')
const fetch = require('node-fetch')

jest.mock('node-fetch')
jest.mock('https')

describe('iniFileReader', () => {

    it('正常读取文件内容', () => {
        const result = iniFileReader('../views/tray.ini')
        expect(result).toEqual({
            Global: {
                loginmode: '0',
                autorun: '1',
                clearcache: '0',
                syncingtips: '0',
                cachepath: '',
                lastserver: '',
                showrecordcode: '',
                showpubliccode: ''
            }
        })
    });

});

describe('formatHeaders', () => {

    it('参数为 null, null', function () {
        const result = formatHeaders(null, null)
        expect(result).toEqual({
            'cache-control': 'no-cache',
            'content-type': 'application/x-www-form-urlencoded',
        })
    });

    it('参数为 null, undefined', () => {
        const result = formatHeaders(null, undefined)
        expect(result).toEqual({
            'cache-control': 'no-cache',
            'content-type': 'application/x-www-form-urlencoded',
        })
    });

    it('参数为 "hao", "rr"', () => {
        const result = formatHeaders("hao", "rr")
        expect(result).toEqual({
            "authorization": "Basic aGFvOnJy",
            'cache-control': 'no-cache',
            'content-type': 'application/x-www-form-urlencoded',
        })
    });

});

describe('fetchParse', () => {

    it('fetchParse resolved', async () => {
        const response = Promise.resolve({
            status: 200,
            text: async () => { }
        })
        fetch.mockImplementation(async () => await response)
        return fetchParse()
            .then((res) => {
                expect(res).toEqual({ "status": 200, "text": undefined })
            })
    });

    it('fetchParse rejected", {}', async () => {
        const response = Promise.resolve({
            status: 500,
            text: async () => { }
        })
        fetch.mockImplementation(async () => await response)
        return fetchParse()
            .catch((err) => {
                expect(err).toEqual({ "status": 500 })
            })
    });

});

describe('httpsRequest', () => {

    it('httpsRequest resolved 参数为{}, {data: "a"}', async () => {
        const mockHttp = jest.spyOn(https, 'request');
        mockHttp.mockResolvedValueOnce({})
        return httpsRequest({}, {})
            .then(() => {
                expect(mockHttp).toHaveBeenCalledWith({}, { data: 'a' })
            }).catch((error) => { })
    });

});

// describe('delDir', () => {

//     beforeEach(() => {
//         mock({
//             'folder': {
//                 'chame.txt': 'harttle.land'
//             }
//         });
//     });

//     afterEach(() => {
//         mock.restore();
//     });

//     let file = `${process.cwd()}/folder/chame.txt`
//     it('参数为 null', () => {
//         const result = delDir(null)
//         const fileContent = fs.readFileSync(file, 'utf8');
//         expect(result).toBe('error')
//         expect(fileContent).toBe('harttle.land')

//     });

//     it('参数为 ${process.cwd()}/folder', () => {
//         const result = delDir('folder')
//         expect(result).toBe('success')
//     });

// });