/**
 * 对Antd的message的全局代理
 * Antd的message推荐使用[messageApi, messageContextHolder] = message.useMessage()
 * 在无组件的ts文件中无法使用，所以将messageApi初始化到全局对象，方便使用
 */

let messageInstance: any = null;

export const initMessage = (instance: any) => {
  messageInstance = instance;
};

interface Message {
  /**
   * 显示成功消息
   * @param content - 要显示的消息内容
   */
  success: (content: string) => void;
  /**
   * 显示错误消息
   * @param content - 要显示的消息内容
   */
  error: (content: string) => void;
  /**
   * 显示消息
   * @param content - 要显示的消息内容
   */
  info: (content: string) => void;
  /**
   * 显示警告消息
   * @param content - 要显示的消息内容
   */
  warning: (content: string) => void;
  /**
   * 显示loading消息
   * @param content - 要显示的消息内容
   */
  loading: (content: string) => void;
}

export const message: Message = {
  success: (content: string) => messageInstance?.success(content),
  error: (content: string) => messageInstance?.error(content),
  info: (content: string) => messageInstance?.error(content),
  warning: (content: string) => messageInstance?.warning(content),
  loading: (content: string) => messageInstance?.warning(content),
};
