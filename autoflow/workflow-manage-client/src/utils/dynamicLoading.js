export function loadingCss(path){
  if(!path || path.length === 0){
    throw new Error('argument "path" is required !')
  }
  let entranceDom = document.getElementsByName('workflow-manage-client-entrance')[0]
  let link = document.createElement('link')
  link.href = path
  link.rel = 'stylesheet'
  link.type = 'text/css'
  entranceDom.appendChild(link)
}
