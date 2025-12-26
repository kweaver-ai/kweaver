/**
 * 根据文件后缀名显示文件对应的图标
 */

import IconFont from '@/components/IconFont';
import { getPostfix } from '@/utils/handleFunction';
import { aiList, audioList, cadList, compressList, excelList, exeList, imgList, pptList, psList, txtList, videoList, wordList } from '@/enums';

type IconType = {
  size: number;
};

const DirIcon = ({ size }: IconType) => <IconFont type='icon-Folder' style={{ fontSize: size }} />; // 根文件夹
const ChildDirIcon = ({ size }: IconType) => <IconFont type='icon-putongwenjianjia' style={{ fontSize: size }} />; // 子文件夹
const SheetIcon = ({ size }: IconType) => <IconFont type='icon-DataSheet' style={{ fontSize: size }} />; // 数据库表
const SqlIcon = ({ size }: IconType) => <IconFont type='icon-SQL' style={{ fontSize: size }} />; // sql 文件

const WordArIcon = ({ size }: IconType) => <IconFont type='icon-shitushuju' style={{ fontSize: size }} />;
const WordIcon = ({ size }: IconType) => <IconFont type='icon-word' style={{ fontSize: size }} />; // word文件
const CsvIcon = ({ size }: IconType) => <IconFont type='icon-csv' style={{ fontSize: size }} />; // csv文件
const JsonIcon = ({ size }: IconType) => <IconFont type='icon-json' style={{ fontSize: size }} />; // json文件
const XlsIcon = ({ size }: IconType) => <IconFont type='icon-xls' style={{ fontSize: size }} />; // excel文件
const TextIcon = ({ size }: IconType) => <IconFont type='icon-txt' style={{ fontSize: size }} />; // txt文件
const PdfIcon = ({ size }: IconType) => <IconFont type='icon-pdf' style={{ fontSize: size }} />; // pdf文件
const PptIcon = ({ size }: IconType) => <IconFont type='icon-ppt' style={{ fontSize: size }} />; // ppt文件
const HtmlIcon = ({ size }: IconType) => <IconFont type='icon-html' style={{ fontSize: size }} />; // html文件
const VideoIcon = ({ size }: IconType) => <IconFont type='icon-shipin' style={{ fontSize: size }} />; // 视频
const AudioIcon = ({ size }: IconType) => <IconFont type='icon-yinpin' style={{ fontSize: size }} />; // 音频
const AiIcon = ({ size }: IconType) => <IconFont type='icon-ai' style={{ fontSize: size }} />; // ai文件
const ImgIcon = ({ size }: IconType) => <IconFont type='icon-tupian' style={{ fontSize: size }} />; // 图片
const ExeIcon = ({ size }: IconType) => <IconFont type='icon-exechengxu' style={{ fontSize: size }} />; // 程序
const PsIcon = ({ size }: IconType) => <IconFont type='icon-ps' style={{ fontSize: size }} />; // ps文件
const PressIcon = ({ size }: IconType) => <IconFont type='icon-yasuo' style={{ fontSize: size }} />; // 压缩文件
const CadIcon = ({ size }: IconType) => <IconFont type='icon-cad' style={{ fontSize: size }} />; // cad文件
const ParquetIcon = ({ size }: IconType) => <IconFont type='icon-parquet' style={{ fontSize: size }} />; // parquet文件
const UnknownIcon = ({ size }: IconType) => <IconFont type='icon-file-unknown' style={{ fontSize: size }} />; // 未知文件
UnknownIcon.displayName = 'UnknownIcon';

/**
 * 根据文件后缀显示图标
 * @param {String} type 文件夹'dir', 数据表'sheet', 文件'file'
 * @param {String} fileName 带文件后缀的文件名
 * @param {Number} size 图标大小, 即font-size, 默认20px
 */
const switchIcon = (type = 'file', fileName = '', size = 20) => {
  if (type === 'dir') return <DirIcon size={size} />;
  if (type === 'childDir') return <ChildDirIcon size={size} />;
  if (type === 'sheet') return <SheetIcon size={size} />;
  if (type === 'anyRobot') return <WordArIcon size={size} />;

  if (type === 'sql') return <SqlIcon size={size} />;

  if (type === 'file') {
    const postfix = getPostfix(fileName);

    if (wordList.includes(postfix)) return <WordIcon size={size} />;
    if (postfix === 'csv') return <CsvIcon size={size} />;
    if (postfix === 'json') return <JsonIcon size={size} />;
    if (txtList.includes(postfix)) return <TextIcon size={size} />;
    if (excelList.includes(postfix)) return <XlsIcon size={size} />;
    if (postfix === 'pdf') return <PdfIcon size={size} />;
    if (pptList.includes(postfix)) return <PptIcon size={size} />;
    if (postfix.includes('htm')) return <HtmlIcon size={size} />;
    if (videoList.includes(postfix)) return <VideoIcon size={size} />;
    if (audioList.includes(postfix)) return <AudioIcon size={size} />;
    if (aiList.includes(postfix)) return <AiIcon size={size} />;
    if (imgList.includes(postfix)) return <ImgIcon size={size} />;
    if (psList.includes(postfix)) return <PsIcon size={size} />;
    if (compressList.includes(postfix)) return <PressIcon size={size} />;
    if (cadList.includes(postfix)) return <CadIcon size={size} />;
    if (exeList.includes(postfix)) return <ExeIcon size={size} />;
    if (postfix === 'sql') return <SheetIcon size={size} />;
    if (postfix === 'parquet') return <ParquetIcon size={size} />;
  }

  return <UnknownIcon size={size} />;
};

export { switchIcon };
