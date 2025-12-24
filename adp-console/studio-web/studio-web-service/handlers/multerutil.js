import * as fs from "fs";
import multer from "multer";
import * as path from "path";

const createFolder = function (folder) {
    try {
        fs.accessSync(folder);
    } catch (e) {
        fs.mkdirSync(folder);
    }
};

const uploadFolder = path.resolve("/AnyShare/tmp", "../tmp");
createFolder(uploadFolder);

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         // 保存的路径
//         const folder = path.resolve(__dirname, uploadFolder, Date.now().toString())
//         createFolder(folder)
//         cb(null, folder);
//     },
//     filename: (req, file, cb) => {
//         // 保存的名字
//         cb(null, file.originalname);
//     }
// });

const storage = multer.memoryStorage();

// 通过 storage 选项来对 上传行为 进行定制化
export const multerUtil = multer({ storage });
