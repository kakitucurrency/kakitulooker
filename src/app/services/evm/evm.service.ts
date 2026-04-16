import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface EvmTransfer {
    txHash: string;
    blockNumber: number;
    from: string;
    to: string;
    amount: string; // formatted KSHS with decimals
    direction: 'in' | 'out';
    basescanUrl: string;
}

const TRANSFER_SIG = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const DECIMALS = 18;
// Scan last ~14 days of Base blocks (~2s/block)
const BLOCKS_TO_SCAN = 600_000;

@Injectable({
    providedIn: 'root',
})
export class EvmService {
    private readonly rpc = environment.baseRpcUrl;
    private readonly contract = environment.kshs_contract;

    constructor(private readonly _http: HttpClient) {}

    /** Returns the KSHS balance for an EVM address, formatted to 2dp. */
    async getKshsBalance(address: string): Promise<string> {
        const paddedAddr = address.slice(2).toLowerCase().padStart(64, '0');
        const data = '0x70a08231' + paddedAddr; // balanceOf(address)

        const result = await this._jsonRpc<string>('eth_call', [{ to: this.contract, data }, 'latest']);
        return this._formatAmount(BigInt(result));
    }

    /** Returns transfer events involving the address from the last ~14 days. */
    async getTransfers(address: string): Promise<EvmTransfer[]> {
        const latestHex = await this._jsonRpc<string>('eth_blockNumber', []);
        const latest = parseInt(latestHex, 16);
        const fromBlock = '0x' + Math.max(0, latest - BLOCKS_TO_SCAN).toString(16);
        const toBlock = 'latest';

        const padded = '0x' + address.slice(2).toLowerCase().padStart(64, '0');

        const [sentLogs, receivedLogs] = await Promise.all([
            this._jsonRpc<any[]>('eth_getLogs', [{
                fromBlock,
                toBlock,
                address: this.contract,
                topics: [TRANSFER_SIG, padded],
            }]),
            this._jsonRpc<any[]>('eth_getLogs', [{
                fromBlock,
                toBlock,
                address: this.contract,
                topics: [TRANSFER_SIG, null, padded],
            }]),
        ]);

        const addr = address.toLowerCase();
        const all: EvmTransfer[] = [
            ...sentLogs.map((log) => this._parseLog(log, addr)),
            ...receivedLogs.map((log) => this._parseLog(log, addr)),
        ];

        // Deduplicate (an address sending to itself appears in both)
        const seen = new Set<string>();
        const deduped = all.filter((t) => {
            const key = t.txHash + t.direction;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        return deduped.sort((a, b) => b.blockNumber - a.blockNumber);
    }

    private _parseLog(log: any, viewerAddress: string): EvmTransfer {
        const from = '0x' + log.topics[1].slice(26);
        const to = '0x' + log.topics[2].slice(26);
        const rawAmount = BigInt(log.data);
        return {
            txHash: log.transactionHash,
            blockNumber: parseInt(log.blockNumber, 16),
            from,
            to,
            amount: this._formatAmount(rawAmount),
            direction: from.toLowerCase() === viewerAddress ? 'out' : 'in',
            basescanUrl: `https://basescan.org/tx/${log.transactionHash}`,
        };
    }

    private _formatAmount(raw: bigint): string {
        const divisor = BigInt(10 ** DECIMALS);
        const whole = raw / divisor;
        const frac = raw % divisor;
        const fracStr = frac.toString().padStart(DECIMALS, '0').slice(0, 2);
        return `${whole.toLocaleString()}.${fracStr}`;
    }

    private async _jsonRpc<T>(method: string, params: any[]): Promise<T> {
        const body = { jsonrpc: '2.0', id: 1, method, params };
        const resp = await this._http.post<{ result: T; error?: any }>(this.rpc, body).toPromise();
        if (resp.error) {
            throw new Error(resp.error.message ?? 'RPC error');
        }
        return resp.result;
    }
}
