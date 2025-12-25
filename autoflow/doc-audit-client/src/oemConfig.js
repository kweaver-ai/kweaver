/**
 * 添加workflow全局OEM样式
 * @param {string} styleId  指定style标签的id
 * @param {*} microWidgetProps 客户端插件依赖
 */
export function addOemStyle(styleId = 'workflow_oem', microWidgetProps) {
  // 设置页面图标
  const commonOEMConfig = localStorage.getItem('commonOEMConfig')
  if (commonOEMConfig) {
    const icon = JSON.parse(commonOEMConfig)['favicon.ico']
    let favicon = document.querySelector('link[rel="icon"]')
    if (favicon) {
      favicon.href = `data:image/png;base64,${icon}`
    }
  }
  let oemConfig
  if (microWidgetProps) {
    const { normal, hover, active, disabled } = microWidgetProps.config.getTheme
    oemConfig = {
      normal,
      hover,
      active,
      disabled
    }
  } else {
    oemConfig = {
      normal: '#126ee3',
      hover: '#3a8ff0',
      active: '#064fbd',
      disabled: '#65b1fc'
    }
  }

  const styleContent = `
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

  let style = document.getElementById(styleId)

  if (!style) {
    style = document.createElement('style')
    style.setAttribute('type', 'text/css')
    style.id = styleId
    style.textContent = styleContent

    document.head.appendChild(style)
  } else {
    style.textContent = styleContent
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
