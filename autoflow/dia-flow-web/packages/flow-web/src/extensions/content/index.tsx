import { Extension } from "../../components/extension";
import ContentSVG from "./assets/content.svg";
import OcrNewSVG from "./assets/ocr-new.svg";
import AudioTransferSVG from "./assets/audio-transfer.svg";
import DocFormatConvertSVG from "./assets/doc-format-convert.svg";
import ContentFileParseSVG from "./assets/content-file-parse.svg";
// import { ContentAbstractConfig } from "./content-abstract-config";
// import { ContentFulltextConfig } from "./content-fulltext-config";
// import { ContentEntityConfig } from "./content-entity-config";
import zhCN from "./locales/zh-cn.json";
import zhTW from "./locales/zh-tw.json";
import enUS from "./locales/en-us.json";
import viVN from "./locales/vi-vn.json";
import { ContentpipelineFullTextConfig } from "./contentpipeline-full-text-config";
import { OcrNewConfig } from "./ocr-new-config";
import { AudioTransferConfig } from "./audio-transfer-config";
import { DocFormatConvertConfig } from "./doc-format-convert-config";
import {
  ContentFileParseConfig,
  SliceVectorEnum,
} from "./content-file-parse-config";

const ContentExtension: Extension = {
  name: "Content",
  executors: [
    {
      name: "Content",
      description: "ContentDescription",
      icon: ContentSVG,
      actions: [
        // {
        //   name: "ContentAbstract",
        //   description: "ContentAbstractDescription",
        //   icon: ContentSVG,
        //   operator: "@content/abstract",
        //   outputs: [
        //     {
        //       name: "ContentAbstractStatus",
        //       key: ".status",
        //       type: "string",
        //     },
        //     {
        //       name: "ContentAbstractVersion",
        //       key: ".version",
        //       type: "string",
        //     },
        //     {
        //       name: "ContentAbstractData",
        //       key: ".data",
        //       type: "string",
        //     },
        //   ],
        //   components: {
        //     Config: ContentAbstractConfig,
        //   },
        // },
        // {
        //   name: "ContentFulltext",
        //   description: "ContentFulltextDescription",
        //   icon: ContentSVG,
        //   operator: "@content/fulltext",
        //   outputs: [
        //     {
        //       name: "ContentFulltextStatus",
        //       key: ".status",
        //       type: "string",
        //     },
        //     {
        //       name: "ContentFulltextVersion",
        //       key: ".version",
        //       type: "string",
        //     },
        //     {
        //       name: "ContentFulltextUrl",
        //       key: ".url",
        //       type: "string",
        //     },
        //   ],
        //   components: {
        //     Config: ContentFulltextConfig,
        //   },
        // },
        // {
        //   name: "ContentEntity",
        //   description: "ContentEntityDescription",
        //   icon: ContentSVG,
        //   operator: "@content/entity",
        //   outputs: [
        //     {
        //       name: "ContentEntityStatus",
        //       key: ".status",
        //       type: "string",
        //     },
        //     {
        //       name: "ContentEntityVersion",
        //       key: ".rev",
        //       type: "string",
        //     },
        //     {
        //       name: "ContentEntityData",
        //       key: ".data",
        //       type: "string",
        //     },
        //     {
        //       name: "ContentEntityValue",
        //       key: ".releation_map.{{entity}}._vid",
        //       type: "entity_edges_vid",
        //     },
        //   ],
        //   components: {
        //     Config: ContentEntityConfig,
        //   },
        // },
        {
          name: "ContentpipelineFullText",
          description: "ContentpipelineFullTextDescription",
          icon: ContentSVG,
          operator: "@contentpipeline/full_text",
          outputs: [
            {
              name: "ContentpipelineFullTextOutputText",
              key: ".text",
              type: "string",
            },
            {
              name: "ContentpipelineFullTextOutputUrl",
              key: ".url",
              type: "string",
            },
          ],
          components: {
            Config: ContentpipelineFullTextConfig,
          },
        },
        {
          name: "OcrNew",
          description: "OcrNewDescription",
          icon: OcrNewSVG,
          operator: "@anyshare/ocr/new",
          outputs: [
            {
              name: "OcrNewOutputText",
              key: ".text",
              type: "string",
            },
          ],
          components: {
            Config: OcrNewConfig,
          },
        },
        {
          name: "AudioTransfer",
          description: "AudioTransferDescription",
          icon: AudioTransferSVG,
          operator: "@audio/transfer",
          outputs: [
            {
              name: "AudioTransferOutputResult",
              key: ".result",
              type: "string",
            },
          ],
          components: {
            Config: AudioTransferConfig,
          },
        },
        {
          name: "DocFormatConvert",
          description: "DocFormatConvertDescription",
          icon: DocFormatConvertSVG,
          operator: "@contentpipeline/doc_format_convert",
          outputs: [
            {
              name: "DocFormatConvertOutputUrl",
              key: ".url",
              type: "string",
            },
          ],
          components: {
            Config: DocFormatConvertConfig,
          },
        },
        {
          name: "ContentFileParse",
          description: "ContentFileParseDescription",
          icon: ContentFileParseSVG,
          operator: "@content/file_parse",
          outputs: (step: any) => {
            const sliceVector = step?.parameters?.slice_vector;

            const chunksOutputs =
              sliceVector === SliceVectorEnum.None
                ? []
                : sliceVector === SliceVectorEnum.Slice
                ? [
                    {
                      name: "ContentFileParseOutputChunksOnlySlice",
                      key: ".chunks",
                      type: "array",
                    },
                  ]
                : [
                    {
                      name: "ContentFileParseOutputChunksBoth",
                      key: ".chunks",
                      type: "array",
                    },
                  ];

            return [
              {
                name: "ContentFileParseOutputContentList",
                key: ".content_list",
                type: "array",
              },
              {
                name: "ContentFileParseOutputMarkdownContent",
                key: ".md_content",
                type: "string",
              },
              ...chunksOutputs,
            ];
          },
          components: {
            Config: ContentFileParseConfig,
          },
        },
      ],
    },
  ],
  translations: {
    zhCN,
    zhTW,
    enUS,
    viVN,
  },
};

export default ContentExtension;
