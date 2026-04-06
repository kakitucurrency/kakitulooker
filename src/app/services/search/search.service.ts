import { Injectable } from '@angular/core';
import { UtilService } from '@app/services/util/util.service';
import { Observable, Subject } from 'rxjs';
import { APP_NAV_ITEMS } from '../../navigation/nav-items';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root',
})
export class SearchService {
    search$ = new Subject<{ search: string; openInNewWindow: boolean }>();

    constructor(router: Router, private readonly _utilService: UtilService) {
        this.searchEvents().subscribe((data: { search: string; openInNewWindow: boolean }) => {
            const isAddress = this.isValidAddress(data.search);
            const route = isAddress
                ? `${APP_NAV_ITEMS.account.route}/${data.search}`
                : `${APP_NAV_ITEMS.hash.route}/${data.search}`;
            if (data.openInNewWindow) {
                window.open(`${window.location.origin}/${route}`, '_blank');
            } else {
                void router.navigate([route]);
            }
        });
    }

    searchEvents(): Observable<{ search: string; openInNewWindow: boolean }> {
        return this.search$;
    }

    emitSearch(search: string, openInNewWindow = true): void {
        if (!search) {
            return;
        }
        const trimmed = search.trim();
        this.search$.next({ search: trimmed, openInNewWindow });
    }

    // Ethereum 0x address: 0x + 40 hex chars = 42 chars total
    isValidAddress(address: string): boolean {
        return /^0x[0-9a-fA-F]{40}$/.test(address);
    }

    // Ethereum tx hash: 0x + 64 hex chars = 66 chars total
    isValidBlock(block: string): boolean {
        return /^0x[0-9a-fA-F]{64}$/.test(block);
    }

    isValidBNSDomain(bns: string): boolean {
        return false; // BNS not used in Kakitu
    }
}
