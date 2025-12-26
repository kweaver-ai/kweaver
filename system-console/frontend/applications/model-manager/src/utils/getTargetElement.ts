const getTargetElement = (target: any, defaultElement = document.body) => {
  if (!target) {
    return defaultElement;
  }

  let targetElement: any;

  if (typeof target === 'function') {
    targetElement = target();
  } else if ('current' in target) {
    if (target.current) {
      targetElement = target.current;
    } else {
      return defaultElement;
    }
  } else {
    targetElement = target;
  }

  return targetElement;
};

export default getTargetElement;
