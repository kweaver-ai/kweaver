import React from "react";
import {
    FileAiColored,
    FileArchiveColored,
    FileAudioColored,
    FileCadColored,
    FileExcelColored,
    FileExeColored,
    FileHtmlColored,
    FileImageColored,
    FilePdfColored,
    FilePhotoshopColored,
    FilePptColored,
    FileTextColored,
    FileUnknownColored,
    FileVideoColored,
    FileWordColored,
    FolderArchivedColored,
    FolderGroupColored,
    FolderMediaColored,
    FolderSharedColored,
    // FolderStarredColored,
    FolderUnsyncedColored,
    FolderUserColored,
    FolderColored,
    FolderCustomColored,
    FolderLibraryColored,
    FoldfavoritesColored,
    FolderKcColored,
    FileDrawioColored,
} from "@applet/icons";
import { IFileIcons } from "./fileIconTypes";

export const FILE_ICONS: IFileIcons = {
    ".7z": FileArchiveColored,
    ".ai": FileAiColored,
    ".bmp": FileImageColored,
    ".dmg": FileArchiveColored,
    ".doc": FileWordColored,
    ".docm": FileWordColored,
    ".docx": FileWordColored,
    ".dotm": FileWordColored,
    ".dotx": FileWordColored,
    ".dwg": FileCadColored,
    ".et": FileExcelColored,
    ".exe": FileExeColored,
    ".gif": FileImageColored,
    ".gz": FileArchiveColored,
    ".html": FileHtmlColored,
    ".jpg": FileImageColored,
    ".jpeg": FileImageColored,
    ".mp3": FileAudioColored,
    ".aac": FileAudioColored,
    ".wav": FileAudioColored,
    ".wma": FileAudioColored,
    ".flac": FileAudioColored,
    ".m4a": FileAudioColored,
    ".ape": FileAudioColored,
    ".ogg": FileAudioColored,
    ".mp4": FileVideoColored,
    ".ods": FileExcelColored,
    ".odt": FileWordColored,
    ".pdf": FilePdfColored,
    ".png": FileImageColored,
    ".ppt": FilePptColored,
    ".pptx": FilePptColored,
    ".psd": FilePhotoshopColored,
    ".psb": FilePhotoshopColored,
    ".rar": FileArchiveColored,
    ".txt": FileTextColored,
    ".tif": FileImageColored,
    ".wps": FileWordColored,
    ".xls": FileExcelColored,
    ".xlsb": FileExcelColored,
    ".xlsm": FileExcelColored,
    ".xlsx": FileExcelColored,
    ".zip": FileArchiveColored,
    ".drawio": FileDrawioColored,
    "*": FileUnknownColored,
    archived: FolderArchivedColored,
    folder: FolderColored,
    group: FolderGroupColored,
    media: FolderMediaColored,
    starred: FoldfavoritesColored,
    shared_user: FolderSharedColored,
    department: FolderGroupColored,
    user: FolderUserColored,
    unsynced: FolderUnsyncedColored,
    custom: FolderCustomColored,
    lib: FolderLibraryColored,
    root: FolderColored,
    knowledge: FolderKcColored,
};

const getExt = (filename: string) => {
    var idx = filename.lastIndexOf(".");
    // 处理文件名没有扩展名（如“ .env”和“ filename”）的情况
    return idx < 1 ? "" : filename.slice(idx);
};

const getFileType = (size: number, extension: string) => {
    if (size === -1) {
        return "folder";
    }
    return extension || "*";
};

export const getFileIcon = (name: string, size: number) => {
    const type = getFileType(size, getExt(name));

    return FILE_ICONS[type] || FILE_ICONS["*"];
};

export const FileIcon = ({
    name,
    size,
    className = "",
}: {
    name: string;
    size: number;
    className?: string;
}) => {
    const Icon = getFileIcon(name, size);
    return <Icon className={className} />;
};
