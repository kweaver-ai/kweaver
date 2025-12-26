/* eslint-disable */
const fs = require('fs');
const path = require('path');

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];

function getAllImagePaths(dir, baseDir) {
	let results = [];
	const files = fs.readdirSync(dir);

	files.forEach((file) => {
		const fullPath = path.join(dir, file);
		const stat = fs.statSync(fullPath);

		if (stat.isDirectory()) {
			results = results.concat(getAllImagePaths(fullPath, baseDir));
		} else {
			// 只处理图片文件（根据扩展名判断）
			const ext = path.extname(file).toLowerCase();
			if (IMAGE_EXTENSIONS.includes(ext)) {
				// 获取相对于 baseDir 的相对路径
				const relativePath = path.relative(baseDir, fullPath);
				// 转换为 Unix 风格的路径并添加前导斜杠
				const formattedPath = relativePath.replace(/\\/g, '/');
				results.push(formattedPath);
			}
		}
	});

	return results;
}

function generateImageDataFile(imagePaths) {
	const outputDir = path.join(__dirname, 'data.js');
	const content = `const images = ${JSON.stringify(imagePaths, null, 2)};`;

	fs.writeFileSync(outputDir, content, 'utf-8');
	console.log(`已生成 data.ts 文件，包含 ${imagePaths.length} 个图片路径`);
}

// 主执行逻辑
function main() {
	const imagesDir = path.join(__dirname, '../images'); // 指向 images 目录
	const imagePaths = getAllImagePaths(imagesDir, imagesDir);

	// 按字母顺序排序
	// imagePaths.sort();

	generateImageDataFile(imagePaths);
}

main();
