import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ViewportService } from '../services/viewport/viewport.service';
import { DrawerStateService } from '../services/drawer-state/drawer-state.service';
import { APP_NAV_ITEMS, NavItem, EXPLORER_NAV_GROUP, NETWORK_NAV_GROUP, TOOLS_NAV_GROUP } from './nav-items';
import { SearchService } from '@app/services/search/search.service';
import { Meta, Title } from '@angular/platform-browser';

@Component({
    selector: 'app-navigation',
    templateUrl: './navigation.component.html',
    styleUrls: ['./navigation.component.scss'],
})
export class NavigationComponent implements OnInit {
    @ViewChild('searchBar') searchBar: ElementRef;

    appbarSearchText = '';
    toolbarTitle: string;
    toggleSearch = false;
    routeListener: Subscription;

    explorerNavGroup = EXPLORER_NAV_GROUP;
    networkNavGroup = NETWORK_NAV_GROUP;
    toolsNavGroup = TOOLS_NAV_GROUP;

    constructor(
        public vp: ViewportService,
        private readonly _title: Title,
        private readonly _meta: Meta,
        private readonly _router: Router,
        private readonly _searchService: SearchService,
        private readonly _viewportService: ViewportService,
        private readonly _stateService: DrawerStateService
    ) {
        this._listenForRouteChanges();
    }

    ngOnInit(): void {
        this._searchService.searchEvents().subscribe((data: { search: string; openInNewWindow: boolean }) => {
            if (data.openInNewWindow) {
                if (data.search.startsWith('kshs_')) {
                    window.open(`${window.location.origin}/${APP_NAV_ITEMS.account.route}/${data.search}`, '_blank');
                } else {
                    window.open(`${window.location.origin}/${APP_NAV_ITEMS.hash.route}/${data.search}`, '_blank');
                }
            } else {
                if (data.search.startsWith('kshs_')) {
                    void this._router.navigate([`${APP_NAV_ITEMS.account.route}/${data.search}`]);
                } else {
                    void this._router.navigate([`${APP_NAV_ITEMS.hash.route}/${data.search}`]);
                }
            }
        });
    }

    goHome(): void {
        if (!this.vp.sm) {
            void this._router.navigate([APP_NAV_ITEMS.home.route]);
        }
    }

    navigate(url: string): void {
        void this._router.navigateByUrl(url);
    }

    isOpen(): boolean {
        return this._stateService.getDrawerOpen();
    }

    appbarSearch(event: any): void {
        if (event.key === 'Enter') {
            this._searchService.emitSearch(this.appbarSearchText, false);
            this.closeSearch();
        }
    }

    selectItem(navItem: NavItem): void {
        this.navigate(navItem.route);
        this._stateService.setDrawerOpen(false);
    }

    getSelectedItem(): string {
        return this._stateService.getSelectedItem();
    }

    closeDrawer(): void {
        this._stateService.setDrawerOpen(false);
    }

    openDrawer(): void {
        this._stateService.setDrawerOpen(true);
    }

    openSearch(): void {
        this.toggleSearch = true;
        // focus the input after the animation completes to avoid a jerky transition
        setTimeout(() => this.searchBar.nativeElement.focus(), 300);
    }

    closeSearch(): void {
        this.appbarSearchText = '';
        this.toggleSearch = false;
    }

    isHome(): boolean {
        return this._router.url === '/';
    }

    // Observes route changes and changes app title & sets selected item
    private _listenForRouteChanges(): void {
        this.routeListener = this._router.events.subscribe((route) => {
            if (route instanceof NavigationEnd) {
                window.scrollTo(0, 0);
                const drawerContent = document.getElementsByClassName('mat-sidenav-content')[0];
                if (drawerContent) {
                    drawerContent.scroll(0, 0);
                }

                switch (route.urlAfterRedirects
                        .replace('explorer/', '')  // Prune explorer legacy routes
                    .replace('/history', '')
                    .split('/')[1]) {
                    case `${APP_NAV_ITEMS.home.route}`: {
                        this.toolbarTitle = APP_NAV_ITEMS.home.title;
                        this._stateService.setSelectedItem(APP_NAV_ITEMS.home.title);
                        this._title.setTitle(this._makeTitle('Explore'));
                        this._meta.updateTag({
                            name: 'description',
                            content:
                                'Search kakitu addresses or transaction hashes; explore the kakitu network',
                        });
                        break;
                    }
                    case `${APP_NAV_ITEMS.account.route}`: {
                        this._updateAccountPageMetadata();
                        break;
                    }
                    case `auto`: {
                        this._updateHashPageMetadata();
                        break;
                    }
                    case `${APP_NAV_ITEMS.hash.route}`: {
                        this._updateHashPageMetadata();
                        break;
                    }
                    case `${APP_NAV_ITEMS.representatives.route}`: {
                        this.toolbarTitle = APP_NAV_ITEMS.representatives.title;
                        this._stateService.setSelectedItem(APP_NAV_ITEMS.representatives.title);
                        this._title.setTitle(this._makeTitle('Representatives'));
                        this._meta.updateTag({
                            name: 'description',
                            content: 'Search kakitu representatives, online offline reps, voting weight distribution',
                        });
                        break;
                    }
                    case `${APP_NAV_ITEMS.network.route}`: {
                        this.toolbarTitle = APP_NAV_ITEMS.network.title;
                        this._stateService.setSelectedItem(APP_NAV_ITEMS.network.title);
                        this._title.setTitle(this._makeTitle('Network'));
                        this._meta.updateTag({
                            name: 'description',
                            content: 'Kakitu network status, confirmation quorum, online representatives',
                        });
                        break;
                    }
                    case `${APP_NAV_ITEMS.bookmarks.route}`: {
                        this.toolbarTitle = APP_NAV_ITEMS.bookmarks.title;
                        this._stateService.setSelectedItem(undefined);
                        this._title.setTitle(this._makeTitle('Bookmarks'));
                        this._meta.updateTag({
                            name: 'description',
                            content: 'Save and name address or transaction hashes as bookmarks',
                        });
                        break;
                    }
                    case `status`: {
                        this._updateNodePageMetadata();
                        break;
                    }
                    case `${APP_NAV_ITEMS.node.route}`: {
                        this._updateNodePageMetadata();
                        break;
                    }
                    case `${APP_NAV_ITEMS.wallets.route}`: {
                        this.toolbarTitle = APP_NAV_ITEMS.wallets.title;
                        this._stateService.setSelectedItem(APP_NAV_ITEMS.wallets.title);
                        this._title.setTitle(this._makeTitle('Wallets'));
                        this._meta.updateTag({
                            name: 'description',
                            content: 'See kakitu distribution by account, top kakitu holders, rich list',
                        });
                        break;
                    }
                    case `${APP_NAV_ITEMS.knownAccounts.route}`: {
                        this.toolbarTitle = APP_NAV_ITEMS.knownAccounts.title;
                        this._stateService.setSelectedItem(APP_NAV_ITEMS.knownAccounts.title);
                        this._title.setTitle(this._makeTitle('Known Accounts'));
                        this._meta.updateTag({
                            name: 'description',
                            content:
                                'Known kakitu accounts, kakitu exchanges, kakitu games, kakitu developer / owner accounts',
                        });
                        break;
                    }
                    case `${APP_NAV_ITEMS.vanity.route}`: {
                        this.toolbarTitle = APP_NAV_ITEMS.vanity.title;
                        this._stateService.setSelectedItem(APP_NAV_ITEMS.vanity.title);
                        this._title.setTitle(this._makeTitle('Vanity Avatars'));
                        this._meta.updateTag({
                            name: 'description',
                            content: 'Kakitu addresses with custom vanity avatars.',
                        });
                        break;
                    }
                    case `${APP_NAV_ITEMS.paperWallet.route}`: {
                        this.toolbarTitle = APP_NAV_ITEMS.paperWallet.title;
                        this._stateService.setSelectedItem(APP_NAV_ITEMS.paperWallet.title);
                        this._title.setTitle(this._makeTitle('Paper Wallet'));
                        this._meta.updateTag({
                            name: 'description',
                            content: 'Generate offline-safe Kakitu paper wallets in your browser.',
                        });
                        break;
                    }
                    case `${APP_NAV_ITEMS.mnemonicChecker.route}`: {
                        this.toolbarTitle = APP_NAV_ITEMS.mnemonicChecker.title;
                        this._stateService.setSelectedItem(APP_NAV_ITEMS.mnemonicChecker.title);
                        this._title.setTitle(this._makeTitle('Mnemonic Checker'));
                        this._meta.updateTag({
                            name: 'description',
                            content: 'Validate a BIP39 mnemonic phrase and derive its Kakitu wallet address.',
                        });
                        break;
                    }
                    default: {
                        this.toolbarTitle = '';
                    }
                }
            }
        });
    }

    private _updateAccountPageMetadata(): void {
        this.toolbarTitle = APP_NAV_ITEMS.account.title;
        this._title.setTitle(this._makeTitle('Account'));
        this._meta.updateTag({
            name: 'description',
            content: 'Explore account transaction history and delegators.',
        });
    }

    private _updateHashPageMetadata(): void {
        this.toolbarTitle = APP_NAV_ITEMS.hash.title;
        this._title.setTitle(this._makeTitle('Block'));
        this._meta.updateTag({
            name: 'description',
            content: 'See details for a specific block',
        });
    }

    private _updateNodePageMetadata(): void {
        this.toolbarTitle = APP_NAV_ITEMS.node.title;
        this._stateService.setSelectedItem(APP_NAV_ITEMS.node.title);
        this._title.setTitle(this._makeTitle('Node'));
        this._meta.updateTag({
            name: 'description',
            content: 'Node status for the Kakitu Looker explorer',
        });
    }

    private _makeTitle(page: string): string {
        return `Kakitu Looker | ${page}`;
    }
}
