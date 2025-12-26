import * as fs from "fs";
import * as path from "path";
import logger from "../common/logger";

/**
 * 获取默认oem配置
 */
export const getOemconfig = async (req, res) => {
    try {
        const { product, section } = req.query;

        // 验证必需参数
        if (!product || !section) {
            res.status(400);
            res.set("Content-Type", "application/json");
            logger.error("product 和 section 参数都是必需的");
            res.json({
                cause: "缺少必需参数",
                message: "product 和 section 参数都是必需的",
            });
            res.end();
            return;
        }

        // 构建文件路径
        const filePath = path.resolve(
            __dirname,
            "./default-oemconfigs",
            product,
            `${section}.section.json`
        );

        // 检查文件是否存在
        if (!fs.existsSync(filePath)) {
            res.status(404);
            res.set("Content-Type", "application/json");
            logger.error(`找不到文件: ${product}/${section}.section.json`);
            res.json({
                cause: "文件不存在",
                message: `找不到文件: ${product}/${section}.section.json`,
            });
            res.end();
            return;
        }

        // 读取并解析JSON文件
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const jsonData = JSON.parse(fileContent);

        // 返回JSON数据
        res.status(200);
        res.set("Content-Type", "application/json");
        res.json(jsonData);
        res.end();
    } catch (error) {
        // 处理JSON解析错误或其他错误
        res.status(500);
        res.set("Content-Type", "application/json");
        logger.error("内部错误");
        res.json({
            cause: "服务器错误",
            message: error.message || "读取配置文件时发生错误",
        });
        res.end();
    }
};
