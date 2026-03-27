import { Injectable } from '@angular/core';
import { rawToBan } from 'banano-unit-converter'; // kakitu uses same raw converter
import { Subtype } from '@dev-ptera/nano-node-rpc';

@Injectable({
    providedIn: 'root',
})
export class UtilService {
    numberWithCommas(x: number | string): string {
        if (!x && x !== 0) {
            return '';
        }
        const parts = x.toString().split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
    }

    convertRawToKshs(
        raw: string,
        params: {
            precision: number;
            comma?: boolean;
            state?: Subtype;
        }
    ): string {
        if (!raw || raw === '0') {
            return '0';
        }
        let kshs = Number(rawToBan(raw))
            .toFixed(params.precision)
            .replace(/\.?0+$/, '');
        if (params.comma) {
            kshs = this.numberWithCommas(kshs);
        }
        if (params.state === 'receive') {
            return `+${kshs}`;
        }
        if (params.state === 'send') {
            return `-${kshs}`;
        }
        return kshs;
    }

    /** @deprecated use convertRawToKshs */
    convertRawToBan = this.convertRawToKshs.bind(this);

    formatHtmlAddress(addr: string): string {
        const prefix = addr.substring(0, 5);
        const first7 = addr.substring(5, 13);
        const middle = addr.substring(13, addr.length - 7);
        const last6 = addr.substring(addr.length - 7, addr.length);
        return `${prefix}<strong>${first7}</strong>${middle}${last6}`;
    }

    shortenAddress(addr: string): string {
        return `${addr.substr(0, 12)}...${addr.substr(addr.length - 6, addr.length)}`;
    }
}
