import { useState, useCallback, useEffect } from 'react';

/**
 * 校验 JSON 字符串合法性的 Hook
 * @param {string} value - 需要校验的 JSON 字符串
 * @returns {boolean} - 是否合法
 */
function useJsonValidator(value: any) {
  const [isValid, setIsValid] = useState(false);

  const validateJson = useCallback((str: any) => {
    if (typeof str !== 'string') {
      return false;
    }

    if (str.trim() === '') {
      return false;
    }

    try {
      const parsed = JSON.parse(str);

      // 数组、字符串、null 不是合法的 JSON 对象
      return typeof parsed === 'object' && !Array.isArray(parsed) && parsed !== null;
    } catch {
      return false;
    }
  }, []);

  // 当 value 变化时自动校验
  useEffect(() => {
    setIsValid(validateJson(value));
  }, [value, validateJson]);

  return isValid;
}

export default useJsonValidator;
