import { blake2b, blake2bFinal, blake2bInit, blake2bUpdate } from 'blakejs';
import * as nacl from 'tweetnacl';

export interface GeneratedWallet {
    seed: string;
    address: string;
}

export class WalletGen {
    static async genWallet(): Promise<GeneratedWallet> {
        const seed = nacl.randomBytes(32);
        const privateKey = WalletGen.deriveSecretKey(seed, 0);
        // fromSeed takes 32-byte scalar; fromSecretKey requires 64-byte expanded key
        const publicKey = nacl.sign.keyPair.fromSeed(privateKey).publicKey;
        const address = WalletGen.getAddressFromPublic(publicKey);
        return { seed: WalletGen.uint8ToHex(seed), address };
    }

    private static deriveSecretKey(seedBytes: Uint8Array, index: number): Uint8Array {
        const indexBuffer = new ArrayBuffer(4);
        const indexView = new DataView(indexBuffer);
        indexView.setUint32(0, index);
        const indexBytes = new Uint8Array(indexBuffer);
        const context = blake2bInit(32);
        blake2bUpdate(context, seedBytes);
        blake2bUpdate(context, indexBytes);
        return blake2bFinal(context) as Uint8Array;
    }

    static getAddressFromPublic(publicKeyBytes: Uint8Array, prefix = 'kshs'): string {
        const accountHex = WalletGen.uint8ToHex(publicKeyBytes);
        const keyBytes = WalletGen.uint4ToUint8(WalletGen.hexToUint4(accountHex));
        const checksumBytes = blake2b(keyBytes, null, 5) as Uint8Array;
        checksumBytes.reverse();
        const checksum = WalletGen.uint5ToString(
            WalletGen.uint4ToUint5(WalletGen.uint8ToUint4(checksumBytes))
        );
        const account = WalletGen.uint5ToString(WalletGen.uint4ToUint5(WalletGen.hexToUint4(`0${accountHex}`)));
        return `${prefix}_${account}${checksum}`;
    }

    private static hexToUint4(hex: string): Uint8Array {
        const u = new Uint8Array(hex.length);
        for (let i = 0; i < hex.length; i++) u[i] = parseInt(hex.substr(i, 1), 16);
        return u;
    }

    private static uint8ToUint4(u8: Uint8Array): Uint8Array {
        const u4 = new Uint8Array(u8.length * 2);
        for (let i = 0; i < u8.length; i++) { u4[i * 2] = (u8[i] / 16) | 0; u4[i * 2 + 1] = u8[i] % 16; }
        return u4;
    }

    static uint8ToHex(u8: Uint8Array): string {
        return Array.from(u8).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join('');
    }

    private static uint4ToUint8(u4: Uint8Array): Uint8Array {
        const u8 = new Uint8Array(u4.length / 2);
        for (let i = 0; i < u8.length; i++) u8[i] = u4[i * 2] * 16 + u4[i * 2 + 1];
        return u8;
    }

    private static uint4ToUint5(u4: Uint8Array): Uint8Array {
        const len = (u4.length / 5) * 4;
        const u5 = new Uint8Array(len);
        for (let i = 1; i <= len; i++) {
            const n = i - 1, m = i % 4, z = n + (i - m) / 4;
            const right = u4[z] << m;
            const left = (len - i) % 4 === 0 ? u4[z - 1] << 4 : u4[z + 1] >> (4 - m);
            u5[n] = (left + right) % 32;
        }
        return u5;
    }

    private static uint5ToString(u5: Uint8Array): string {
        const chars = '13456789abcdefghijkmnopqrstuwxyz';
        return Array.from(u5).map(v => chars[v]).join('');
    }
}
