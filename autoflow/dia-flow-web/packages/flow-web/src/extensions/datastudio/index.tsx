import { ExecutorAction, Extension } from "../../components/extension";
import UnStructuredSVG from "./assets/unStructured.svg";
import StructuredSVG from "./assets/structured.svg";
import UserSVG from "./assets/user.svg";
import DepSVG from "./assets/dep.svg";
import TagSVG from "./assets/tag.svg";
import DataBaseSVG from "./assets/database.svg";
import FileSVG from "./assets/file.svg";
import zhCN from "./locales/zh-cn.json";
import zhTW from "./locales/zh-tw.json";
import enUS from "./locales/en-us.json";
import viVN from "./locales/vi-vn.json";
import zhCNAS from "../anyshare/locales/zh-cn.json";
import zhTWAS from "../anyshare/locales/zh-tw.json";
import enUSAS from "../anyshare/locales/en-us.json";
import viVNAS from "../anyshare/locales/vi-vn.json";
import zhCNForm from "../internal/locales/zh-cn.json";
import zhTWForm from "../internal/locales/zh-tw.json";
import enUSForm from "../internal/locales/en-us.json";
import viVNForm from "../internal/locales/vi-vn.json";
import { GraphDataBaseExecutorActions } from "./graph-database";
import { FormTriggerAction } from "../internal/form-trigger";
import FormTriggerSVG from "../internal/assets/form.svg";
import { DataviewTriggerAction } from "./dataview-config";
import TriggerDataviewlSVG from "./assets/dataview.svg";
import { FileCreate } from "../anyshare/file-executors";

const FileSource: ExecutorAction = {
  name: "UnStructured",
  description: "",
  operator: "@trigger/dataflow-doc",
  icon: UnStructuredSVG,
  outputs: [
    {
      key: ".id",
      name: "FileOutputId",
      type: "asFile",
    },
    {
      key: ".docid",
      name: "FileOutputGns",
      type: "string",
    },
    {
      key: ".item_id",
      name: "FileOutputObjectId",
      type: "string",
    },
    {
      key: ".name",
      name: "FileOutputName",
      type: "string",
    },
    {
      key: ".rev",
      name: "FileOutputRev",
      type: "string",
    },
    {
      key: ".create_time",
      name: "FileOutputCreateTime",
      type: "string",
    },
    {
      key: ".modify_time",
      name: "FileOutputModifyTime",
      type: "string",
    },
    {
      key: ".size",
      name: "FileOutputSize",
      type: "int",
    },
    {
      key: ".path",
      name: "FileOutputPath",
      type: "string",
    },
    {
      key: ".csflevel",
      name: "FileOutputCsfLevel",
      type: "int",
    },
    {
      key: ".creator_id",
      name: "FileOutputCreatorId",
      type: "string",
    },
    {
      key: ".editor_id",
      name: "FileOutputEditorId",
      type: "string",
    },
  ],
};

const UserSource: ExecutorAction = {
  name: "User",
  description: "",
  operator: "@trigger/dataflow-user",
  icon: UserSVG,
  outputs: [
    {
      key: ".name",
      name: "UserOutputName",
      type: "string",
    },
    {
      key: ".id",
      name: "UserOutputId",
      type: "string",
    },
    {
      key: ".role",
      name: "UserOutputRole",
      type: "array",
    },
    {
      key: ".csflevel",
      name: "UserOutputCsfLevels",
      type: "string",
    },
    {
      key: ".status",
      name: "UserOutputStatus",
      type: "string",
    },
    {
      key: ".contact",
      name: "UserOutputContact",
      type: "int",
    },
    {
      key: ".email",
      name: "UserOutputEmail",
      type: "string",
    },
    {
      key: ".parent_ids",
      name: "UserOutputParentIds",
      type: "string",
    },
    {
      key: ".tags",
      name: "UserOutputTags",
      type: "string",
    },
    {
      key: ".is_expert",
      name: "UserOutputIsExpert",
      type: "boolean",
    },
    {
      key: ".verification_info",
      name: "UserOutputVerificationInfo",
      type: "string",
    },
    {
      key: ".university",
      name: "UserOutputUniversity",
      type: "string",
    },
    {
      key: ".position",
      name: "UserOutputPosition",
      type: "string",
    },
    {
      key: ".work_at",
      name: "UserOutputWorkAt",
      type: "string",
    },
    {
      key: ".professional",
      name: "UserOutputProfessional",
      type: "string",
    },
    {
      key: ".old_parent_ids",
      name: "UserOutputOldParent",
      type: "array",
    },
  ],
};

const DepSource: ExecutorAction = {
  name: "Dep",
  description: "",
  operator: "@trigger/dataflow-dept",
  icon: DepSVG,
  outputs: [
    {
      key: ".name",
      name: "DepName",
      type: "string",
    },
    {
      key: ".id",
      name: "DepId",
      type: "string",
    },
    {
      key: ".parent_id",
      name: "DepParentId",
      type: "string",
    },
    {
      key: ".parent",
      name: "DepParentName",
      type: "string",
    },
    {
      key: ".email",
      name: "DepEmail",
      type: "string",
    },
  ],
};

const TagSource: ExecutorAction = {
  name: "Tag",
  description: "",
  operator: "@trigger/dataflow-tag",
  icon: TagSVG,
  outputs: [
    {
      key: ".name",
      name: "TagName",
      type: "string",
    },
    {
      key: ".id",
      name: "TagId",
      type: "string",
    },
    {
      key: ".parent_id",
      name: "TagParentId",
      type: "string",
    },
    {
      key: ".path",
      name: "TagPath",
      type: "string",
    },
    {
      key: ".version",
      name: "TagVersion",
      type: "string",
    },
  ],
};

export const getDataSourceType: Record<string, string> = {
  [FileSource.operator]: "UnStructured",
  [TagSource.operator]: "Structured",
  [UserSource.operator]: "Structured",
  [DepSource.operator]: "Structured",
};

export default {
  name: "dataStudio",
  types: [],
  triggers: [
    {
      name: "UnStructured",
      description: "UnStructuredDescription",
      icon: UnStructuredSVG,
      actions: [FileSource] as any,
    },
    {
      name: "Structured",
      description: "StructuredDescription",
      icon: StructuredSVG,
      actions: [
        UserSource,
        DepSource,
        // TagSource
      ] as any,
    },
    {
      name: "MdlDataDataview",
      description: "MdlDataDataviewDes",
      operator: "@trigger/dataview",
      icon: TriggerDataviewlSVG,
      actions: [DataviewTriggerAction],
    },
    // {
    //   name: "TAForm",
    //   description: "TAFormDescription",
    //   operator: "@trigger/form",
    //   icon: FormTriggerSVG,
    //   actions: [FormTriggerAction],
    // },
  ],
  executors: [
    {
      name: "db.graphDatabase",
      description: "db.graphDatabaseDescription",
      icon: DataBaseSVG,
      groups: [
        {
          group: "BuildIn",
          name: "db.group.in",
        },
        {
          group: "Custom",
          name: "db.group.custom",
        },
      ],
      actions: [...GraphDataBaseExecutorActions],
    },
    {
      name: "WriteFile",
      icon: FileSVG,
      description: "WriteFile",
      groups: [
        {
          group: "file",
          name: "EGFile",
        },
        {
          group: "folder",
          name: "EGFolder",
        },
      ],
      actions: [...FileCreate],
    },
    // ...EcoConfigExecutorActions
  ] as any,
  translations: {
    zhCN: {
      ...zhCN,
      ...zhCNAS,
      ...zhCNForm,
    },
    zhTW: {
      ...zhTW,
      ...zhTWAS,
      ...zhTWForm,
    },
    enUS: {
      ...enUS,
      ...enUSAS,
      ...enUSForm,
    },
    viVN: {
      ...viVN,
      ...viVNAS,
      ...viVNForm,
    },
  },
} as Extension;
