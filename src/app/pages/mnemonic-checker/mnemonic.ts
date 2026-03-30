import * as bip39 from 'bip39';
import * as nacl from 'tweetnacl';
import { blake2bInit, blake2bUpdate, blake2bFinal } from 'blakejs';
import { WalletGen } from '../paper-wallet/wallet-gen';

export interface WordResult {
    word: string;
    valid: boolean; // true = recognised BIP39 English word
}

export interface CheckResult {
    words: WordResult[];
    wordCount: number;
    checksumValid: boolean; // true only when count 12/24, all words valid, checksum passes
    address: string | null; // derived kshs_ address at index 0; null if mnemonic invalid
    seed: string | null;    // hex seed (raw entropy padded to 32 bytes); null if invalid
}

function deriveSecretKey(seedBytes: Uint8Array, index: number): Uint8Array {
    const indexBuffer = new ArrayBuffer(4);
    const indexView = new DataView(indexBuffer);
    indexView.setUint32(0, index);
    const indexBytes = new Uint8Array(indexBuffer);
    const context = blake2bInit(32);
    blake2bUpdate(context, seedBytes);
    blake2bUpdate(context, indexBytes);
    return blake2bFinal(context) as Uint8Array;
}

function hexToUint8(hex: string): Uint8Array {
    const u8 = new Uint8Array(hex.length / 2);
    for (let i = 0; i < u8.length; i++) {
        u8[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return u8;
}

export class MnemonicChecker {
    static check(phrase: string): CheckResult {
        const normalised = phrase.trim().toLowerCase().replace(/\s+/g, ' ');
        const rawWords = normalised ? normalised.split(' ') : [];
        const wordCount = rawWords.length;
        const wordlist: string[] = bip39.wordlists['english'];

        const words: WordResult[] = rawWords.map((word) => ({
            word,
            valid: wordlist.includes(word),
        }));

        const allValid = words.every((w) => w.valid);
        const countOk = wordCount === 12 || wordCount === 24;
        const checksumValid = countOk && allValid && bip39.validateMnemonic(normalised);

        if (!checksumValid) {
            return { words, wordCount, checksumValid: false, address: null, seed: null };
        }

        // mnemonicToEntropy returns lowercase hex: 32 chars for 12 words, 64 chars for 24 words
        const entropyHex = bip39.mnemonicToEntropy(normalised);
        // Pad to 64 hex chars (32 bytes) — 12-word mnemonics produce 16-byte entropy
        const paddedHex = entropyHex.padEnd(64, '0');
        const seedBytes = hexToUint8(paddedHex);

        const privateKey = deriveSecretKey(seedBytes, 0);
        const publicKey = nacl.sign.keyPair.fromSeed(privateKey).publicKey;
        const address = WalletGen.getAddressFromPublic(publicKey);

        return { words, wordCount, checksumValid: true, address, seed: paddedHex };
    }
}
