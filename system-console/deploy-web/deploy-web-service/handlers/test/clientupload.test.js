import { res } from '../mockPath/db.mock';
import { clientUpload } from '../clientupload';
const fetch = require('node-fetch');
const fs = require('fs');

jest.mock('node-fetch')

const req = {
    files: [
        {
            path: './upload',
            destination: 'am'
        }
    ],
    body: {
        file_type: 'a',
        file_name: 'b',
        task: 'c',
        chunk: 'd'
    }
}

describe('clientUpload', () => {

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('参数为 req, res, readFile失败', () => {

        fs.readFile = jest.fn((path, callback) => {
            return callback('error', JSON.stringify('error'));
        });
        clientUpload(req, res)
        expect(res.json.mock.calls[0][0]).toBe('error')
    });

    it('参数为 req, res, readFile成功, fetch成功', () => {

        fs.readFile = jest.fn((path, callback) => {
            return callback(null, JSON.stringify('mockData'));
        });
        const response = Promise.resolve({
            status: 200
        })
        fetch.mockImplementation(async () => await response)
        clientUpload(req, res)

    });

    it('参数为 req, res, readFile成功, fetch失败', () => {

        fs.readFile = jest.fn((path, callback) => {
            return callback(null, JSON.stringify('mockData'));
        });
        const response = Promise.reject({
            status: 500
        })
        fetch.mockImplementation(async () => await response)
        clientUpload(req, res)

    });

});
