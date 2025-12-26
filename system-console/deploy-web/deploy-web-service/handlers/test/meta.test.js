import { res } from '../mockPath/db.mock';
import { meta } from '../meta'

const req = {
    headers: {
        'x-real-ip': '10.2.3.3'
    }
}

describe('meta', () => {

    it('参数为 {}, res', async () => {
        await meta({}, res)
        expect(res.status.mock.calls[0][0]).toBe(500)
    });

    it('参数为 req, res', async () => {
        await meta(req, res)
        expect(res.status.mock.calls[0][0]).toBe(200)
    });

});