import {
    getHue,
    editIni,
    getValue,
    rgbToHsv,
    hsvToRgb,
    forbidden,
    editOemOem,
    editOemXml,
    colorPalette,
    base64ToImage,
    getSaturation
} from '../personalization'
import { xml2jsInfo } from '../mockPath/oem/oemoem';
import * as xml2js from 'xml2js'
import * as path from 'path'
import * as fs from 'fs'

const config = [
    {
        cachePath: 'a',
        host: 'b',
        showRecordNumber: 'c',
        showPublicCode: 'd'
    },
    {
        productName: 'a',
        primaryColor: 'b',
        recordNumber: 'c',
        pucliccode: 'd'
    }
]

const result = {
    AppNameSettings: {
        appname: '',
        color: '',
        recordcode: '',
        pucliccode: ''
    }
}

describe('rgbToHsv', () => {

    jest.useFakeTimers()
    afterEach(() => {
        jest.clearAllMocks()
    })

    it('参数为 255,255,255', async () => {
        const ret = await rgbToHsv(255, 255, 255)
        expect(ret).toEqual([0, 0, 1])
    });

    it('参数为 255,25,25', async () => {
        const ret = await rgbToHsv(255, 25, 25)
        expect(ret).toEqual([0, 0.9019607843137255, 1])
    });

    it('参数为 25,255,25', async () => {
        const ret = await rgbToHsv(25, 255, 25)
        expect(ret).toEqual([0.3333333333333333, 0.9019607843137255, 1])
    });

    it('参数为 25,25,255', async () => {
        const ret = await rgbToHsv(25, 25, 255)
        expect(ret).toEqual([0.6666666666666666, 0.9019607843137255, 1])
    });

    it('参数为 0,0,0', async () => {
        const ret = await rgbToHsv(0, 0, 0)
        expect(ret).toEqual([0, 0, 0])
    });

});

describe('hsvToRgb', () => {

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('参数为 1,1,1', async () => {
        const ret = await hsvToRgb(1, 1, 1)
        expect(ret).toEqual([1, 0, 0])
    });

    it('参数为 1.2, 9, 9', async () => {
        const ret = await hsvToRgb(1.2, 9, 9)
        expect(ret).toEqual([-7.1999999999999424, 9, -72])
    });

    it('参数为 1.4, 9, 9', async () => {
        const ret = await hsvToRgb(1.4, 9, 9)
        expect(ret).toEqual([-72, 9, -39.600000000000115])
    });

    it('参数为 1.5, 9, 9', async () => {
        const ret = await hsvToRgb(1.5, 9, 9)
        expect(ret).toEqual([-72, 9, 9])
    });

    it('参数为 1.7, 9, 9', async () => {
        const ret = await hsvToRgb(1.7, 9, 9)
        expect(ret).toEqual([-55.800000000000054, -72, 9])
    });

    it('参数为 1.9, 9, 9', async () => {
        const ret = await hsvToRgb(1.9, 9, 9)
        expect(ret).toEqual([9, -72, -23.399999999999885])
    });

});

describe('getHue', () => {

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('参数为 61,9,true', async () => {
        const ret = getHue(61, 9, true)
        expect(ret).toBe(43)
    });

    it('参数为 365,9,true', async () => {
        const ret = getHue(365, 9, true)
        expect(ret).toBe(23)
    });

});

describe('getSaturation', () => {

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('参数为 1.1, 5, true', async () => {
        const ret = await getSaturation(1.1, 5, true)
        expect(ret).toBe(10)
    });

    it('参数为 365,4,false', async () => {
        const ret = await getSaturation(365, 4, false)
        expect(ret).toBe(100)
    });

    it('参数为 365,5,false', async () => {
        const ret = await getSaturation(365, 5, false)
        expect(ret).toBe(100)
    });

    it('参数为 2,50,true', async () => {
        const ret = await getSaturation(2, 50, true)
        expect(ret).toBe(6)
    });

});

describe('getValue', () => {

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('参数为 1.1, 5, true', async () => {
        const ret = await getValue(1.1, 5, true)
        expect(ret).toBe(135)
    });

    it('参数为 1.1, 5, false', async () => {
        const ret = await getValue(1.1, 5, false)
        expect(ret).toBe(35)
    });

});

describe('colorPalette', () => {

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('参数为 #6775CD, 4', async () => {
        const ret = await colorPalette('#6775CD', 4)
        expect(ret).toBe('#bcc4e6')
    });

    it('参数为 #6775CD, 7', async () => {
        const ret = await colorPalette('#6775CD', 7)
        expect(ret).toBe('#424ca6')
    });

});

describe('base64ToImage', () => {
    it('参数为 forbidden', async () => {
        base64ToImage(forbidden)
    });

});

describe('editIni', () => {

    it('参数为 config[0], path', async () => {
        const conf = await editIni(config[0], path.resolve(__dirname, '../views/tray.ini'))
        expect(conf.Global.cachepath).toBe('a')
    });

});

describe('editOemXml', () => {

    it('参数为 config[0], path, newPath, readFile 失败', async () => {

        fs.readFile = jest.fn((path, encode, callback) => {
            return callback('error', JSON.stringify('error'));
        });
        try {
            await editOemXml(
                config[0],
                path.resolve(__dirname, '../views/oemxml.xml'),
                path.resolve(__dirname, '../mockPath')
            )
        } catch (ex) {

        }

    });

    it('参数为 config[0], path, newPath, readFile 成功, xml2js 失败', async () => {

        fs.readFile = jest.fn((path, encode, callback) => {
            return callback(null, JSON.stringify('mockData'));
        });
        xml2js.parseString = jest.fn((ret, xmlCallback) => {
            return xmlCallback('err', 'error')
        })
        try {
            await editOemXml(
                config[0],
                path.resolve(__dirname, '../views/oemxml.xml'),
                path.resolve(__dirname, '../mockPath')
            )
        } catch (ex) {

        }

    });

    it('参数为 config[1], path, newPath, readFile 成功, xml2js 成功', async () => {

        fs.readFile = jest.fn((path, encode, callback) => {
            return callback(null, JSON.stringify('mockData'));
        });
        xml2js.parseString = jest.fn((ret, xmlCallback) => {
            return xmlCallback(null, result)
        })
        await editOemXml(
            config[1],
            path.resolve(__dirname, '../views/oemxml.xml'),
            path.resolve(__dirname, '../mockPath')
        )
    });

});

describe('editOemOem', () => {

    it('参数为 config[0], path, newPath, readFile 失败', async () => {

        fs.readFile = jest.fn((path, encode, callback) => {
            return callback('error', JSON.stringify('error'));
        });
        try {
            await editOemOem(
                config[0],
                path.resolve(__dirname, '../views/oemoem.xml'),
                path.resolve(__dirname, '../mockPath')
            )
        } catch (ex) {

        }

    });

    it('参数为 config[0], path, newPath, readFile 成功, xml2js 失败', async () => {

        fs.readFile = jest.fn((path, encode, callback) => {
            return callback(null, JSON.stringify('mockData'));
        });
        xml2js.parseString = jest.fn((ret, xmlCallback) => {
            return xmlCallback('err', 'error')
        })
        try {
            await editOemOem(
                config[0],
                path.resolve(__dirname, '../views/oemoem.xml'),
                path.resolve(__dirname, '../mockPath')
            )
        } catch (ex) {
        }

    });

    it('参数为 config[2], path, newPath, readFile 成功, xml2js 成功', async () => {

        fs.readFile = jest.fn((path, encode, callback) => {
            return callback(null, JSON.stringify('mockData'));
        });
        xml2js.parseString = jest.fn((ret, xmlCallback) => {
            return xmlCallback(null, xml2jsInfo)
        })
        await editOemOem(
            config[1],
            path.resolve(__dirname, '../views/oemoem.xml'),
            path.resolve(__dirname, '../mockPath')
        )
    });

});


