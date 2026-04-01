import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
    AccountBalanceDto,
    AccountDistributionStatsDto,
    AccountOverviewDto,
    AliasDto,
    BlockDto,
    ConfirmedTransactionDto,
    KnownAccountDto,
    MonitoredRepDto,
    NetworkStatsDto,
    PriceDataDto,
    RepresentativesResponseDto,
} from '@app/types/dto';
import { InsightsDto } from '@app/types/dto/InsightsDto';
import { timeout, retryWhen, concatMap } from 'rxjs/operators';
import { throwError, timer, UnaryFunction, Observable } from 'rxjs';

const SLOW_MS = 30000;
const MED_MS = 20000;
const FAST_MS = 15000;
const RETRY_DELAY_MS = 2000;
const RETRY_COUNT = 1;

/** RxJS 6 operator: retry once after a 2-second delay for transient failures. */
function retryOnce<T>(): UnaryFunction<Observable<T>, Observable<T>> {
    return retryWhen<T>((errors) =>
        errors.pipe(
            concatMap((err, index) =>
                index < RETRY_COUNT ? timer(RETRY_DELAY_MS) : throwError(err)
            )
        )
    );
}

@Injectable({
    providedIn: 'root',
})
export class ApiService {
    url = environment.api;

    constructor(private readonly _http: HttpClient) {}

    /** Converts HTTP errors into user-friendly messages. */
    private _friendlyError(err: any): string {
        if (!err) {
            return 'An unexpected error occurred. Please try again.';
        }
        if (err.status === 0) {
            return 'Unable to reach the server. Please check your connection and try again.';
        }
        if (err.status === 404) {
            return 'The requested resource was not found.';
        }
        if (err.status >= 500) {
            return 'The server encountered an error. Please try again later.';
        }
        if (err.name === 'TimeoutError') {
            return 'The request timed out. Please try again.';
        }
        return 'An unexpected error occurred. Please try again.';
    }

    /** Wraps a promise with user-friendly error messages. */
    private _withFriendlyError<T>(promise: Promise<T>): Promise<T> {
        return promise.catch((err) => {
            const message = this._friendlyError(err);
            const friendlyErr = new Error(message);
            (friendlyErr as any).status = err?.status;
            (friendlyErr as any).originalError = err;
            throw friendlyErr;
        });
    }

    accountOverview(address: string): Promise<AccountOverviewDto> {
        return this._withFriendlyError(
            this._http
                .get<AccountOverviewDto>(`${this.url}/account-overview/${address}`)
                .pipe(timeout(SLOW_MS), retryOnce())
                .toPromise()
        );
    }

    confirmedTransactions(address: string, offset: number, pageSize: number): Promise<ConfirmedTransactionDto[]> {
        return this._withFriendlyError(
            this._http
                .get<ConfirmedTransactionDto[]>(
                    `${this.url}/confirmed-transactions?address=${address}&offset=${offset}&size=${pageSize}`
                )
                .pipe(timeout(MED_MS), retryOnce())
                .toPromise()
        );
    }

    block(hash: string): Promise<BlockDto> {
        return this._withFriendlyError(
            this._http
                .get<BlockDto>(`${this.url}/block/${hash}`)
                .pipe(timeout(FAST_MS), retryOnce())
                .toPromise()
        );
    }

    node(): Promise<MonitoredRepDto> {
        return this._withFriendlyError(
            this._http
                .get<MonitoredRepDto>(`${this.url}/node`)
                .pipe(timeout(FAST_MS), retryOnce())
                .toPromise()
        );
    }

    avatar(address: string): Promise<string> {
        const headers = new HttpHeaders().set('Content-Type', 'text/plain; charset=utf-8');
        return this._http
            .get(`https://avatar.kakitu.org/api/v1/avatar/${address}`, { headers, responseType: 'text' })
            .pipe(timeout(FAST_MS), retryOnce())
            .toPromise<string>();
    }

    /** @deprecated use avatar */
    monkey = this.avatar.bind(this);

    representatives(): Promise<RepresentativesResponseDto> {
        return this._withFriendlyError(
            this._http
                .get<RepresentativesResponseDto>(`${this.url}/v2/representatives`)
                .pipe(timeout(MED_MS), retryOnce())
                .toPromise()
        );
    }

    /* Rich List is too expensive operation to run non-locally; default to production. */
    kakituDistribution(): Promise<AccountDistributionStatsDto> {
        return this._withFriendlyError(
            this._http
                .get<AccountDistributionStatsDto>(`${this.url}/accounts-distribution`)
                .pipe(timeout(MED_MS), retryOnce())
                .toPromise()
        );
    }

    getAccountBalances(offset: number, pageSize: number): Promise<AccountBalanceDto[]> {
        return this._withFriendlyError(
            this._http
                .get<AccountBalanceDto[]>(`${this.url}/accounts-balance?offset=${offset}&size=${pageSize}`)
                .pipe(timeout(SLOW_MS), retryOnce())
                .toPromise()
        );
    }

    getPriceInfo(): Promise<PriceDataDto> {
        return this._withFriendlyError(
            this._http
                .get<PriceDataDto>(`${this.url}/price`)
                .pipe(timeout(FAST_MS), retryOnce())
                .toPromise()
        );
    }

    getInsights(address: string): Promise<InsightsDto> {
        return this._withFriendlyError(
            this._http
                .get<InsightsDto>(`${this.url}/insights/${address}`)
                .pipe(timeout(SLOW_MS), retryOnce())
                .toPromise()
        );
    }

    getOnlineReps(): Promise<string[]> {
        return this._withFriendlyError(
            this._http
                .get<string[]>(`${this.url}/online-reps`)
                .pipe(timeout(FAST_MS), retryOnce())
                .toPromise()
        );
    }

    getAliases(): Promise<AliasDto[]> {
        return this._withFriendlyError(
            this._http
                .get<AliasDto[]>(`${this.url}/aliases`)
                .pipe(timeout(FAST_MS), retryOnce())
                .toPromise()
        );
    }

    getKnownAccounts(): Promise<KnownAccountDto[]> {
        return this._withFriendlyError(
            this._http
                .get<KnownAccountDto[]>(`${this.url}/known-accounts`)
                .pipe(timeout(FAST_MS), retryOnce())
                .toPromise()
        );
    }

    megaphone(hasOfflineRep: string[], hasLargeRep: string[]): Promise<void> {
        return this._withFriendlyError(
            this._http
                .post<void>(`${this.url}/megaphone`, {
                    hasOfflineRep,
                    hasLargeRep,
                })
                .pipe(retryOnce())
                .toPromise()
        );
    }

    getNetworkStats(): Promise<NetworkStatsDto> {
        return this._withFriendlyError(
            this._http
                .get<NetworkStatsDto>(`${this.url}/network-stats`)
                .pipe(timeout(FAST_MS), retryOnce())
                .toPromise()
        );
    }
}
