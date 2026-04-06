import { Component, ViewChild, ViewEncapsulation, OnInit } from '@angular/core';
import { UtilService } from '@app/services/util/util.service';
import { ViewportService } from '@app/services/viewport/viewport.service';
import { ThemeService } from '@app/services/theme/theme.service';
import { ApiService } from '@app/services/api/api.service';
import { APP_NAV_ITEMS } from '../../navigation/nav-items';
import { SearchBarComponent } from '../../navigation/search-bar/search-bar.component';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class HomeComponent implements OnInit {
    @ViewChild('searchBar') searchBar: SearchBarComponent;

    showHint = false;
    routes = APP_NAV_ITEMS;

    tokenStats: any = null;
    recentTransfers: any[] = [];
    loading = true;

    constructor(
        public vp: ViewportService,
        private readonly _themeService: ThemeService,
        private readonly _util: UtilService,
        private readonly _api: ApiService
    ) {}

    ngOnInit(): void {
        Promise.all([
            this._api.fetchTokenStats(),
            this._api.fetchRecentTransfers(),
        ])
            .then(([stats, transfers]) => {
                this.tokenStats = stats;
                this.recentTransfers = transfers?.transfers || [];
                this.loading = false;
            })
            .catch((err) => {
                console.error(err);
                this.loading = false;
            });
    }

    isDarkTheme(): boolean {
        return this._themeService.isDarkMode();
    }

    search(e: MouseEvent): void {
        this.searchBar.searchCurrentValue(e.ctrlKey);
    }

    formatNumber(n: string | number): string {
        return this._util.numberWithCommas(String(n));
    }

    shortAddress(addr: string): string {
        if (!addr || addr.length < 10) return addr;
        return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
    }

    transferLabel(t: any): string {
        const from = (t.from || '').toLowerCase();
        const zero = '0x0000000000000000000000000000000000000000';
        if (from === zero) return 'Mint';
        const to = (t.to || '').toLowerCase();
        if (to === zero) return 'Burn';
        return 'Transfer';
    }
}
