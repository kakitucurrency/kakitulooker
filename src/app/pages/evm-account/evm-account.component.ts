import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, ViewEncapsulation } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { EvmService, EvmTransfer } from '@app/services/evm/evm.service';
import { ViewportService } from '@app/services/viewport/viewport.service';

@Component({
    selector: 'app-evm-account',
    templateUrl: './evm-account.component.html',
    styleUrls: ['./evm-account.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
})
export class EvmAccountComponent implements OnDestroy {
    address: string;
    balance: string;
    transfers: EvmTransfer[] = [];
    loading = true;
    error = false;
    errorMsg = '';

    readonly basescanAccountUrl = () =>
        this.address ? `https://basescan.org/token/${this._evmService['contract']}?a=${this.address}` : '';

    private readonly _routeListener: Subscription;

    constructor(
        public vp: ViewportService,
        private readonly _router: Router,
        private readonly _evmService: EvmService,
        private readonly _ref: ChangeDetectorRef
    ) {
        this._routeListener = this._router.events.subscribe((event) => {
            if (event instanceof NavigationEnd) {
                const parts = this._router.url.split('/');
                this._load(parts[parts.length - 1]);
            }
        });
    }

    ngOnDestroy(): void {
        this._routeListener.unsubscribe();
    }

    private _load(address: string): void {
        this.address = address;
        this.loading = true;
        this.error = false;
        this.transfers = [];
        this._ref.detectChanges();

        Promise.all([
            this._evmService.getKshsBalance(address),
            this._evmService.getTransfers(address),
        ])
            .then(([balance, transfers]) => {
                this.balance = balance;
                this.transfers = transfers;
                this.loading = false;
                this._ref.detectChanges();
            })
            .catch((err) => {
                console.error(err);
                this.errorMsg = err?.message ?? 'Failed to load account data.';
                this.error = true;
                this.loading = false;
                this._ref.detectChanges();
            });
    }

    shortAddress(addr: string): string {
        if (!addr || addr.length < 12) return addr;
        return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
    }

    navigateTo(address: string): void {
        void this._router.navigate([`evm-account/${address}`]);
    }
}
