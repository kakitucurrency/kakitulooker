import { Component, OnInit } from '@angular/core';
import * as QRCode from 'qrcode';
import { WalletGen, GeneratedWallet } from './wallet-gen';

interface WalletCard extends GeneratedWallet {
    addressQr: string;
    seedQr: string;
}

@Component({
    selector: 'app-paper-wallet',
    templateUrl: 'paper-wallet.component.html',
    styleUrls: ['paper-wallet.component.scss'],
})
export class PaperWalletComponent implements OnInit {
    wallets: WalletCard[] = [];
    quantity = 1;
    generating = false;
    copied = false;

    ngOnInit(): void {}

    async generate(): Promise<void> {
        this.generating = true;
        this.wallets = [];
        for (let i = 0; i < this.quantity; i++) {
            const w = await WalletGen.genWallet();
            const addressQr = await QRCode.toDataURL(w.address, {
                width: 160,
                margin: 1,
                color: { dark: '#000000', light: '#ffffff' },
            });
            const seedQr = await QRCode.toDataURL(w.seed, {
                width: 160,
                margin: 1,
                color: { dark: '#000000', light: '#ffffff' },
            });
            this.wallets.push({ ...w, addressQr, seedQr });
        }
        this.generating = false;
    }

    print(): void {
        window.print();
    }

    copyAll(): void {
        const text = this.wallets.map((w) => `Address: ${w.address}\nSeed: ${w.seed}`).join('\n\n');
        navigator.clipboard.writeText(text);
        this.copied = true;
        setTimeout(() => (this.copied = false), 2000);
    }
}
