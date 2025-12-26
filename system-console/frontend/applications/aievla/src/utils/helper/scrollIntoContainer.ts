const scrollIntoContainer = (container: HTMLElement, element: HTMLElement) => {
  const containerRect = container.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();

  const relativeTop = elementRect.top - containerRect.top;

  // 计算滚动位置，使元素居中
  const scrollTop = container.scrollTop + relativeTop - (containerRect.height - elementRect.height) / 2;

  // 平滑滚动到计算的位置
  container.scrollTo({
    top: scrollTop,
    behavior: 'smooth',
  });
};
export default scrollIntoContainer;
