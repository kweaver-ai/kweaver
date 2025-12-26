import aishuSvg from '@/assets/images/model-icon/aishu.svg';
import qwenSvg from '@/assets/images/model-icon/qwen.svg';
import openaiSvg from '@/assets/images/model-icon/openai.svg';
import internSvg from '@/assets/images/model-icon/intern.svg';
import deepseekSvg from '@/assets/images/model-icon/deepseek.svg';
import qianxunSvg from '@/assets/images/model-icon/qianxun.svg';
import claudeSvg from '@/assets/images/model-icon/claude.svg';
import chatglmSvg from '@/assets/images/model-icon/chatglm.svg';
import llamaSvg from '@/assets/images/model-icon/llama.svg';
import baiduSvg from '@/assets/images/model-icon/baidu.svg';
import otherSvg from '@/assets/images/model-icon/other.svg';

const MODEL_ICON_LIST = [
  { value: 'tome', label: 'Tome', icon: aishuSvg },
  { value: 'qwen', label: '通义千问', icon: qwenSvg },
  { value: 'openai', label: 'OpenAI', icon: openaiSvg },
  { value: 'internlm', label: '书生浦语(InternLM)', icon: internSvg },
  { value: 'deepseek', label: 'deepseek', icon: deepseekSvg },
  { value: 'qianxun', label: '千循', icon: qianxunSvg },
  { value: 'claude', label: 'Claude', icon: claudeSvg },
  { value: 'chatglm', label: 'ChatgLm', icon: chatglmSvg },
  { value: 'llama', label: 'Llama', icon: llamaSvg },
  { value: 'baidu', label: 'baidu', icon: baiduSvg },
  { value: 'others', label: '其他', icon: otherSvg },
];

export default MODEL_ICON_LIST;
