// Python 代码补全提供程序

// Python 关键词列表
const PYTHON_KEYWORDS = [
  'False',
  'None',
  'True',
  'and',
  'as',
  'assert',
  'async',
  'await',
  'break',
  'case',
  'class',
  'continue',
  'def',
  'del',
  'elif',
  'else',
  'except',
  'finally',
  'for',
  'from',
  'global',
  'if',
  'import',
  'in',
  'is',
  'lambda',
  'match',
  'nonlocal',
  'not',
  'or',
  'pass',
  'raise',
  'return',
  'try',
  'while',
  'with',
  'yield',
];

// Python 内置函数列表
const PYTHON_BUILTIN_FUNCTIONS = [
  'abs',
  'all',
  'any',
  'ascii',
  'bin',
  'bool',
  'breakpoint',
  'bytearray',
  'bytes',
  'callable',
  'chr',
  'classmethod',
  'compile',
  'complex',
  'delattr',
  'dict',
  'dir',
  'divmod',
  'enumerate',
  'eval',
  'exec',
  'filter',
  'float',
  'format',
  'frozenset',
  'getattr',
  'globals',
  'hasattr',
  'hash',
  'help',
  'hex',
  'id',
  'input',
  'int',
  'isinstance',
  'issubclass',
  'iter',
  'len',
  'list',
  'locals',
  'map',
  'max',
  'memoryview',
  'min',
  'next',
  'object',
  'oct',
  'open',
  'ord',
  'pow',
  'print',
  'property',
  'range',
  'repr',
  'reversed',
  'round',
  'set',
  'setattr',
  'slice',
  'sorted',
  'staticmethod',
  'str',
  'sum',
  'super',
  'tuple',
  'type',
  'vars',
  'zip',
  '__import__',
  'aiter',
  'anext',
  'copyright',
  'credits',
  'exit',
  'license',
  'quit',
];

// Python 内置库列表
const PYTHON_BUILTIN_LIBRARIES = [
  'os',
  'sys',
  'math',
  'datetime',
  'time',
  'random',
  'json',
  're',
  'collections',
  'itertools',
  'io',
  'csv',
  'pickle',
  'sqlite3',
  'urllib',
  'socket',
  'email',
  'http',
  'zipfile',
  'gzip',
  'tarfile',
  'threading',
  'multiprocessing',
  'asyncio',
  'argparse',
  'logging',
  'unittest',
  'hashlib',
  'base64',
];

// 提取已导入的变量名
const extractImportedVariables = (model: any): string[] => {
  const imports: string[] = [];
  const lines = model.getValue().split('\n');

  for (const line of lines) {
    // 匹配 import module_name 语句
    const importMatch = line.match(/^\s*import\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
    if (importMatch) {
      imports.push(importMatch[1]);
    }

    // 匹配 from module_name import item1, item2 语句
    const fromImportMatch = line.match(/^\s*from\s+([a-zA-Z_][a-zA-Z0-9_.]*)\s+import\s+([a-zA-Z_][a-zA-Z0-9_,\s]*)/);
    if (fromImportMatch) {
      const importItems = fromImportMatch[2].split(',').map(item => item.trim());
      imports.push(...importItems);
    }
  }

  return imports;
};

// 检查是否应该触发补全
const shouldTriggerCompletion = (model: any, position: any): boolean => {
  const lineContent = model.getLineContent(position.lineNumber);
  const textBeforeCursor = lineContent.substring(0, position.column - 1);

  // 避免在点号后立即触发补全（如 .p）
  const isAfterDotWithoutSpace = /\.[^\s]*$/.test(textBeforeCursor);

  // 检查是否在import语句中（支持 import math, r 这种格式）
  const isInImportStatement = /^\s*(?:import|from)\s+[a-zA-Z_][a-zA-Z0-9_]*(?:\s*,\s*[a-zA-Z_][a-zA-Z0-9_]*)*$/.test(
    textBeforeCursor.trim()
  );

  // 在import语句中或不在点号后时触发补全
  return isInImportStatement || !isAfterDotWithoutSpace;
};

// 生成关键词补全建议
const generateKeywordSuggestions = (monaco: any, range: any) => {
  return PYTHON_KEYWORDS.map(keyword => ({
    label: keyword,
    kind: monaco.languages.CompletionItemKind.Keyword,
    insertText: keyword,
    range,
    // detail: `Python 关键词: ${keyword}`,
  }));
};

// 生成内置函数补全建议
const generateBuiltinFunctionSuggestions = (monaco: any, range: any) => {
  return PYTHON_BUILTIN_FUNCTIONS.map(func => ({
    label: func,
    kind: monaco.languages.CompletionItemKind.Function,
    insertText: func,
    range,
    // detail: `Python 内置函数: ${func}`,
  }));
};

// 生成导入变量补全建议
const generateImportSuggestions = (monaco: any, model: any, range: any) => {
  const importedVariables = extractImportedVariables(model);
  return importedVariables.map(variable => ({
    label: variable,
    kind: monaco.languages.CompletionItemKind.Variable,
    insertText: variable,
    range,
    // detail: `已导入的变量: ${variable}`,
  }));
};

// 生成import语句补全建议
const generateImportSuggestionsForImportStatement = (monaco: any, model: any, position: any, range: any) => {
  const lineContent = model.getLineContent(position.lineNumber);
  const textBeforeCursor = lineContent.substring(0, position.column - 1);

  // 检查是否在import语句中（支持 import requests, m 这种格式）
  const importMatch = textBeforeCursor.match(
    /^\s*(?:import|from)\s+(?:[a-zA-Z_][a-zA-Z0-9_]*(?:\s*,\s*[a-zA-Z_][a-zA-Z0-9_]*)*)?$/
  );
  if (importMatch) {
    // 返回内置库补全建议
    return PYTHON_BUILTIN_LIBRARIES.map(libName => ({
      label: libName,
      kind: monaco.languages.CompletionItemKind.Module,
      insertText: libName,
      range,
      // detail: `Python 内置库: ${libName}`,
    }));
  }

  return [];
};

// 生成自定义补全建议（未来扩展用）
const generateCustomSuggestions = (monaco: any, model: any, position: any, range: any) => {
  const lineContent = model.getLineContent(position.lineNumber);
  const textBeforeCursor = lineContent.substring(0, position.column - 1);

  // 示例：当输入 / 时触发特定补全（未来扩展）
  if (textBeforeCursor.endsWith('/')) {
    // 这里可以添加路径相关的补全建议
    return [];
  }

  return [];
};

// 主补全提供程序
const createPythonCompletionProvider = (monaco: any) => {
  return {
    provideCompletionItems: (model: any, position: any) => {
      // 检查是否应该触发补全
      if (!shouldTriggerCompletion(model, position)) {
        return { suggestions: [] };
      }

      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      // 检查是否在import语句中（支持 import math, r 这种格式）
      const lineContent = model.getLineContent(position.lineNumber);
      const textBeforeCursor = lineContent.substring(0, position.column - 1);
      const isInImportStatement =
        /^\s*(?:import|from)\s+[a-zA-Z_][a-zA-Z0-9_]*(?:\s*,\s*[a-zA-Z_][a-zA-Z0-9_]*)*$/.test(textBeforeCursor.trim());

      // 收集补全建议
      let suggestions = [];

      if (isInImportStatement) {
        // 在import语句中，只显示库名补全
        suggestions = [...generateImportSuggestionsForImportStatement(monaco, model, position, range)];
      } else {
        // 不在import语句中，显示所有补全建议
        suggestions = [
          ...generateKeywordSuggestions(monaco, range),
          ...generateBuiltinFunctionSuggestions(monaco, range),
          ...generateImportSuggestions(monaco, model, range),
          ...generateCustomSuggestions(monaco, model, position, range),
        ];
      }

      return { suggestions };
    },
  };
};

// 注册 Python 补全提供程序
let isPythonCompletionRegistered = false;
export const registerPythonCompletion = (monaco: typeof import('monaco-editor')) => {
  if (!isPythonCompletionRegistered) {
    isPythonCompletionRegistered = true;
    monaco.languages.registerCompletionItemProvider('python', createPythonCompletionProvider(monaco));
  }
};
