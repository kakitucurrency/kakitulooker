import { Component } from '@angular/core';
import { MnemonicChecker, CheckResult } from './mnemonic';

@Component({
    selector: 'app-mnemonic-checker',
    templateUrl: 'mnemonic-checker.component.html',
    styleUrls: ['mnemonic-checker.component.scss'],
})
export class MnemonicCheckerComponent {
    phrase = '';
    expectedAddress = '';
    result: CheckResult | null = null;
    copied = false;

    onPhraseChange(): void {
        this.result = this.phrase.trim() ? MnemonicChecker.check(this.phrase) : null;
    }

    get matchStatus(): 'match' | 'mismatch' | 'none' {
        if (!this.expectedAddress.trim() || !this.result?.address) return 'none';
        return this.result.address === this.expectedAddress.trim() ? 'match' : 'mismatch';
    }

    copyAddress(): void {
        if (!this.result?.address) return;
        navigator.clipboard.writeText(this.result.address).then(() => {
            this.copied = true;
            setTimeout(() => (this.copied = false), 2000);
        }).catch(() => {});
    }

    openExplorer(): void {
        if (!this.result?.address) return;
        window.open(`/account/${this.result.address}`, '_blank');
    }

    wordCountLabel(): string {
        if (!this.result) return '';
        const target = this.result.wordCount <= 12 ? 12 : 24;
        return `${this.result.wordCount} / ${target} words`;
    }
}
