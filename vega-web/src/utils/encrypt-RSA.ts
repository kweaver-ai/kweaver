import JSEncrypt from 'jsencrypt'; // 引入加密库

// 公钥（通常由后端提供，PEM格式）
const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA22GOSQ1jeDhpdzxhJddS
f+U10F4Ivut7giYhchFAIJgRonMamDT86MSqQUc8DdTFdPGLm7M3GUKcsG1qbC3S
qk4XJ9NjmQXbs7IMWyWEWQrN7Iv7S2QjDYJI+ppvIN03I0Km3WKsmnrle2bLzT/V
G8e72YX69dfXAeiX6uDhht1va/JxZVFMIV3pHa6AQQ9gn5SAUTX2akEhRfe1bPJj
fVyoM+dfNtvgdfaraqV1rOhVDEqd0NlOWt2RHwETQwU8gIJib2baj2MtyIAY+fQw
KlKWxUs1GcFbECnhVPiVN6BEhXD7OhRt9QE/cuYl5v4a6ypugGaMBK6VKOqFHDvf
mwIDAQAB
-----END PUBLIC KEY-----`;

// 加密方法
export const encryptData = (data: string) => {
  const encryptor = new JSEncrypt(); // 创建加密实例
  encryptor.setPublicKey(PUBLIC_KEY); // 设置公钥
  return encryptor.encrypt(data); // 加密数据（返回base64编码的字符串）
};
