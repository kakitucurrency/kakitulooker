import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export type SearchResult =
    | { valid: true; search: string }
    | { valid: false; error: string };

@Injectable({
    providedIn: 'root',
})
export class SearchService {
    search$ = new Subject<{ search: string; openInNewWindow: boolean }>();
    searchError$ = new Subject<string>();

    searchEvents(): Observable<{ search: string; openInNewWindow: boolean }> {
        return this.search$;
    }

    searchErrorEvents(): Observable<string> {
        return this.searchError$;
    }

    emitSearch(search: string, openInNewWindow = true): void {
        if (!search) {
            return;
        }
        const trimmed = search.trim();
        if (!trimmed) {
            return;
        }

        const result = this.validate(trimmed);
        if (!result.valid) {
            this.searchError$.next((result as { valid: false; error: string }).error);
            return;
        }

        this.search$.next({ search: (result as { valid: true; search: string }).search, openInNewWindow: openInNewWindow });
    }

    /** Validates a search term as either a kshs_ address or a 64-char hex block hash. */
    validate(input: string): SearchResult {
        if (input.startsWith('kshs_')) {
            // kshs_ addresses are 65 characters: "kshs_" (5) + 60 alphanumeric chars
            if (!/^kshs_[13][a-z0-9]{59}$/.test(input)) {
                return { valid: false, error: 'Invalid address format. Addresses start with kshs_1 or kshs_3 followed by 59 characters.' };
            }
            return { valid: true, search: input };
        }

        // Block hashes: exactly 64 hex characters (uppercase)
        if (/^[0-9a-fA-F]{64}$/.test(input)) {
            return { valid: true, search: input.toUpperCase() };
        }

        return { valid: false, error: 'Invalid input. Enter a kshs_ address or a 64-character block hash.' };
    }
}
