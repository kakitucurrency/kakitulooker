# Mnemonic Seed Crosschecker — Design Spec

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a "Mnemonic Checker" page to the Kakitu explorer that validates a BIP39 mnemonic phrase and derives the corresponding `kshs_` address, letting users cross-check their backup against a known wallet address.

**Architecture:** New Angular page (`mnemonic-checker`) following the paper-wallet module pattern. A `mnemonic.ts` utility class encapsulates all BIP39 and key-derivation logic; the component is a thin UI layer. The `bip39` npm package provides wordlist validation and entropy extraction. Key derivation reuses the existing `WalletGen` class.

**Tech Stack:** Angular 13, `bip39` (new dependency), `blakejs`, `tweetnacl`, Angular Material

---

## 1. File Structure

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `src/app/pages/mnemonic-checker/mnemonic.ts` | BIP39 validation + address derivation logic |
| Create | `src/app/pages/mnemonic-checker/mnemonic-checker.component.ts` | Component — wires UI to `MnemonicChecker` |
| Create | `src/app/pages/mnemonic-checker/mnemonic-checker.component.html` | Template — paste area, word chips, result panel |
| Create | `src/app/pages/mnemonic-checker/mnemonic-checker.component.scss` | Styles |
| Create | `src/app/pages/mnemonic-checker/mnemonic-checker.module.ts` | NgModule — declares component, imports Material modules |
| Modify | `src/app/navigation/nav-items.ts` | Add `mnemonicCheckerNavItem`, add to `TOOLS_NAV_GROUP` and `APP_NAV_ITEMS` |
| Modify | `src/app/navigation/navigation.component.ts` | Add route case `mnemonic-checker` for toolbar title + meta |
| Modify | `src/app/app.routing.ts` | Add route `mnemonic-checker → MnemonicCheckerComponent` |
| Modify | `src/app/app.module.ts` | Import `MnemonicCheckerModule` |

---

## 2. `mnemonic.ts` — Utility Class

```typescript
import { wordlists, validateMnemonic, mnemonicToEntropy } from 'bip39';
import * as nacl from 'tweetnacl';
import { blake2b, blake2bInit, blake2bUpdate, blake2bFinal } from 'blakejs';
import { WalletGen } from '../paper-wallet/wallet-gen';

export interface WordResult {
  word: string;
  valid: boolean;   // true = in BIP39 English wordlist
}

export interface CheckResult {
  words: WordResult[];
  wordCount: number;
  checksumValid: boolean;   // true when count is 12/24, all words valid, checksum passes
  address: string | null;   // derived kshs_ address at index 0; null if mnemonic invalid
  seed: string | null;      // 64-char hex seed (raw entropy); null if invalid
}
```

### `MnemonicChecker.check(phrase: string): CheckResult`

1. Normalise: `phrase.trim().toLowerCase().replace(/\s+/g, ' ')`
2. Split on single space → `rawWords: string[]`
3. For each word: `{ word, valid: wordlists.english.includes(word) }`
4. `checksumValid = (count === 12 || count === 24) && allValid && validateMnemonic(normalised)`
5. If `checksumValid`:
   - `seed = mnemonicToEntropy(normalised)` → 64-char hex string (32 bytes for 24 words)
   - `seedBytes = hexToUint8(seed)`
   - `privateKey = deriveSecretKey(seedBytes, 0)` (Blake2b of seed + index, same as `WalletGen`)
   - `publicKey = nacl.sign.keyPair.fromSeed(privateKey).publicKey`
   - `address = WalletGen.getAddressFromPublic(publicKey)`
6. Return `CheckResult`

`deriveSecretKey` is identical to the private method in `WalletGen` — copy it into `mnemonic.ts` as a module-level private function to avoid making it public on `WalletGen`.

---

## 3. Component

```typescript
@Component({ selector: 'app-mnemonic-checker', ... })
export class MnemonicCheckerComponent {
  phrase = '';           // bound to textarea
  expectedAddress = '';  // bound to cross-check field
  result: CheckResult | null = null;
  copied = false;

  onPhraseChange(): void {
    this.result = this.phrase.trim() ? MnemonicChecker.check(this.phrase) : null;
  }

  get matchStatus(): 'match' | 'mismatch' | 'none' {
    if (!this.expectedAddress || !this.result?.address) return 'none';
    return this.result.address === this.expectedAddress.trim() ? 'match' : 'mismatch';
  }

  copyAddress(): void { ... clipboard ... }
  openExplorer(): void { window.open(`/account/${this.result.address}`) }
}
```

---

## 4. Template Sections

### Warning banner (always visible)
```
🔒 This tool runs entirely in your browser. Your seed phrase is never sent to any server.
```

### Paste area
- `<textarea>` bound to `phrase`, `(input)="onPhraseChange()"`, placeholder "Enter your 12 or 24 word mnemonic phrase..."
- Full width, ~4 rows

### Word chips
- `*ngFor` over `result.words`
- CSS class `chip-valid` (green border) / `chip-invalid` (red border) / `chip-neutral` (gray, while `result.wordCount < 12`)
- Word counter: `{{ result.wordCount }} / {{ result.wordCount <= 12 ? 12 : 24 }} words`
- Checksum indicator: shown only when count is 12 or 24 — `✅ Valid checksum` or `❌ Invalid checksum`

### Derived address panel (`*ngIf="result?.address"`)
- Label "Derived Address (index 0)"
- Address in monospace, full width
- Copy button + "View in Explorer" link button

### Cross-check field
- `<input>` bound to `expectedAddress`, `(input)` triggers `matchStatus` recompute
- Below input: `✅ Address matches` (green) or `❌ Address does not match` (red), hidden when `matchStatus === 'none'`

---

## 5. Nav & Routing

`nav-items.ts`:
```typescript
const mnemonicCheckerNavItem: NavItem = {
  title: 'Mnemonic Checker',
  route: 'mnemonic-checker',
  icon: 'fact_check',
};
export const TOOLS_NAV_GROUP = [paperWalletNavItem, mnemonicCheckerNavItem];
```

Route: `{ path: 'mnemonic-checker', component: MnemonicCheckerComponent }`

---

## 6. Security Note

The `bip39` library and all derivation happen synchronously in the browser JS sandbox. No network calls are made by this page. The derived address only appears after a valid checksum — no partial/invalid seeds are ever fed into the key derivation.
