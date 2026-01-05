import { RSAKey, hex2b64 } from "rsa.min";

export function rsaEncrypt(input: string, publicKey: string) {
    let rsaKey = new RSAKey();

    rsaKey.setPublic(publicKey, "10001");

    return hex2b64(rsaKey.encrypt(input)).replace(/(.{64})/g, function (match) {
        return (match += "\n");
    });
}
