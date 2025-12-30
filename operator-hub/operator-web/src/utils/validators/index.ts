// 校验名称是否符合要求
export function validateName(name: string, allowNumberStart: boolean = false) {
  if (allowNumberStart) {
    // 模式2：仅支持中英文、数字、下划线，所有的都可以开头
    // ^[a-zA-Z0-9_\u4e00-\u9fa5]+$ - 可以以字母、数字、下划线或中文开头和结尾
    const regex = /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/;
    return regex.test(name);
  } else {
    // 模式1（默认）：仅支持中英文、数字及下划线，且不能以数字开头
    // ^[a-zA-Z_\u4e00-\u9fa5] - 以字母、下划线或中文开头
    // [a-zA-Z0-9_\u4e00-\u9fa5]*$ - 后续可以是字母、数字、下划线或中文
    const regex = /^[a-zA-Z_\u4e00-\u9fa5][a-zA-Z0-9_\u4e00-\u9fa5]*$/;
    return regex.test(name);
  }
}

// 校验参数名称是否符合要求：只能包含字母、数字和下划线，且必须以字母开头
export function validateParamName(name: string) {
  // ^[a-zA-Z] - 以字母开头
  // [a-zA-Z0-9_]*$ - 后续可以是字母、数字或下划线
  const regex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
  return regex.test(name);
}
