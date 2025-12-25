export function isShowTooltip(e) {
  let result = false
  let clientWidth = e.target.clientWidth,
    scrollWidth = e.target.scrollWidth,
    arrList = Array.from(e.target.classList)
  if(scrollWidth > clientWidth){
    result = false
    if(!arrList.includes('hover-blue')){
      e.target.classList.add('hover-blue')
    }
  } else {
    result = true
    e.target.classList.remove('hover-blue')
  }
  return result
}
