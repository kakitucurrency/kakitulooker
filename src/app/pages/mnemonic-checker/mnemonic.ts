import * as bip39 from 'bip39';
import * as nacl from 'tweetnacl';
import { WalletGen } from '../paper-wallet/wallet-gen';

export interface WordResult {
    word: string;
    valid: boolean; // true = recognised BIP39 English word
}

export interface CheckResult {
    words: WordResult[];
    wordCount: number;
    checksumValid: boolean; // true only when count is 24, all words valid, checksum passes
    address: string | null; // derived kshs_ address at index 0; null if mnemonic invalid
    seed: string | null;    // 64-char hex seed (raw entropy from 24-word mnemonic); null if invalid
}

function hexToUint8(hex: string): Uint8Array {
    const u8 = new Uint8Array(hex.length / 2);
    for (let i = 0; i < u8.length; i++) {
        u8[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    return u8;
}

export class MnemonicChecker {
    static check(phrase: string): CheckResult {
        const normalised = phrase.trim().toLowerCase().replace(/\s+/g, ' ');
        const rawWords = normalised ? normalised.split(' ') : [];
        const wordCount = rawWords.length;
        const wordlist: string[] = bip39.wordlists.english;

        const words: WordResult[] = rawWords.map((word) => ({
            word,
            valid: wordlist.includes(word),
        }));

        const allValid = words.every((w) => w.valid);
        const countOk = wordCount === 24;
        const checksumValid = countOk && allValid && bip39.validateMnemonic(normalised);

        if (!checksumValid) {
            return { words, wordCount, checksumValid: false, address: null, seed: null };
        }

        // 24-word mnemonic → 256-bit entropy = 64 hex chars = 32-byte Kakitu seed
        const entropyHex = bip39.mnemonicToEntropy(normalised);
        const seedBytes = hexToUint8(entropyHex);

        const privateKey = WalletGen.deriveSecretKey(seedBytes, 0);
        const publicKey = nacl.sign.keyPair.fromSeed(privateKey).publicKey;
        const address = WalletGen.getAddressFromPublic(publicKey);

        return { words, wordCount, checksumValid: true, address, seed: entropyHex };
    }
}
