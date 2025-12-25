import { generate } from '@ant-design/colors'

/**
 * 添加workflow全局OEM样式
 * @param {string} styleId  指定style标签的id
 * @param {string} theme 控制台主题色，如“#126ee3”
 */
export function addOemStyle(styleId = 'workflow_oem', theme = '#126ee3') {
  let style = document.getElementById(styleId)
  if (!style) {
    style = document.createElement('style')
    style.setAttribute('type', 'text/css')
    style.id = styleId
    style.textContent = getStyleContent(theme)

    document.head.appendChild(style)
  } else {
    style.textContent = getStyleContent(theme)
  }
}

/**
 * 移除workflow全局OEM样式
 * @param {string} styleId 待移除style标签的id
 */
export function removeOemStyle(styleId = 'workflow_oem') {
  const element = document.getElementById(styleId)
  if (element) {
    document.head.removeChild(element)
  }
}

export function getStyleContent(theme = '#126ee3') {
  // 根据主题色生成色板
  const colorPalette = generate(theme)
  const oemConfig = {
    normal: colorPalette[5],
    hover: colorPalette[4],
    active: colorPalette[6],
    disabled: colorPalette[3]
  }

  return `
    .el-button--primary {
      background: ${oemConfig.normal} !important;
      color: #ffffff !important;
      border-color: transparent !important;
    }
    .el-button--primary:hover {
        background: ${oemConfig.hover} !important;
    }
    .el-button--primary:active {
        background: ${oemConfig.active} !important;
    }

    .el-button--primary.is-disabled,
    .el-button--primary.is-disabled:active,
    .el-button--primary.is-disabled:focus,
    .el-button--primary.is-disabled:hover {
        background: ${oemConfig.disabled} !important;
        color: #ffffff !important;
        -webkit-text-fill-color: #ffffff;
    }

    .el-tabs__header .el-tabs__active-bar {
      background-color: ${oemConfig.normal} !important;
    }

    .el-tabs__nav .el-tabs__item:hover,
    .el-step__title:hover {
      color: ${oemConfig.hover} !important;
    }
    .el-tabs__nav .el-tabs__item:active,
    .el-step__title:active {
      color: ${oemConfig.active} !important;
    } 
    .el-tabs__nav .el-tabs__item.is-active,
    .el-step__title.is-process {
      color: ${oemConfig.normal} !important;
      border-bottom-color: ${oemConfig.normal} !important;
    }
  `
}
