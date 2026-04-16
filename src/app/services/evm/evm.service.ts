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
// Public Base RPC caps eth_getLogs at 2000 blocks per call.
// We scan 10 batches × 2000 blocks = 20,000 blocks ≈ 11 hours of history.
const CHUNK_SIZE = 2_000;
const CHUNKS = 10;

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

    /** Returns KSHS transfer events for the address across the last ~11 hours. */
    async getTransfers(address: string): Promise<EvmTransfer[]> {
        const latestHex = await this._jsonRpc<string>('eth_blockNumber', []);
        const latest = parseInt(latestHex, 16);
        const padded = '0x' + address.slice(2).toLowerCase().padStart(64, '0');

        // Build block ranges for each chunk, most-recent first
        const ranges: Array<{ from: number; to: number }> = [];
        for (let i = 0; i < CHUNKS; i++) {
            const to = latest - i * CHUNK_SIZE;
            const from = Math.max(0, to - CHUNK_SIZE + 1);
            ranges.push({ from, to });
        }

        // Fetch all chunks in parallel (sent + received per chunk)
        const chunkResults = await Promise.all(
            ranges.map(({ from, to }) =>
                Promise.all([
                    this._getLogs(padded, from, to, 'sent'),
                    this._getLogs(padded, from, to, 'received'),
                ])
            )
        );

        const addr = address.toLowerCase();
        const all: EvmTransfer[] = [];
        for (const [sent, received] of chunkResults) {
            all.push(...sent.map((log) => this._parseLog(log, addr)));
            all.push(...received.map((log) => this._parseLog(log, addr)));
        }

        // Deduplicate (self-transfers appear in both sent + received)
        const seen = new Set<string>();
        const deduped = all.filter((t) => {
            const key = t.txHash + t.direction;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        return deduped.sort((a, b) => b.blockNumber - a.blockNumber);
    }

    private _getLogs(paddedAddr: string, fromBlock: number, toBlock: number, direction: 'sent' | 'received'): Promise<any[]> {
        const topics = direction === 'sent'
            ? [TRANSFER_SIG, paddedAddr]
            : [TRANSFER_SIG, null, paddedAddr];
        return this._jsonRpc<any[]>('eth_getLogs', [{
            fromBlock: '0x' + fromBlock.toString(16),
            toBlock: '0x' + toBlock.toString(16),
            address: this.contract,
            topics,
        }]);
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
