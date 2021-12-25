import { RequestTimeParams } from "./request-time-params";


export interface DataCacheEntry<T> {
    cacheDate: number;
    requestTimeParams: RequestTimeParams;
    data: T;
    expiresAt: number;
}


export class DataCache<T> {

    public static getCacheIdForRequestTimeParams(requestTimeParams: RequestTimeParams): number {
        const cacheId = requestTimeParams.amount * requestTimeParams.interval * requestTimeParams.startTime;
        return cacheId;
    }

    private cacheMap: Map<number, DataCacheEntry<T>> = new Map();

    private cleanCache(): void {
        const now = Date.now();
        this.cacheMap.forEach((value, key) => {
            if (value.expiresAt < now) {
                this.cacheMap.delete(key);
            }
        });
    }

    public get(id: number): DataCacheEntry<T | null> {
        this.cleanCache();
        const cacheEntry = this.cacheMap.get(id);
        if (cacheEntry) {
            return cacheEntry;
        }
        return null;
    }

    public getData(id: number): T | null {
        const cacheEntry = this.get(id);
        if (cacheEntry) {
            return cacheEntry.data;
        }
        return null;
    }

    public getDataCacheEntryForRequestTimeParams(requestTimeParams: RequestTimeParams): DataCacheEntry<T | null> {
        const cacheId = DataCache.getCacheIdForRequestTimeParams(requestTimeParams);
        return this.get(cacheId);
    }

    public getDataForRequestTimeParams(requestTimeParams: RequestTimeParams): T | null {
        const cacheId = DataCache.getCacheIdForRequestTimeParams(requestTimeParams);
        return this.getData(cacheId);
    }

    public setDataForRequestTimeParams(requestTimeParams: RequestTimeParams, data: T): void {
        const now = Date.now();
        const intervalInMs = requestTimeParams.interval * 1000;
        const cacheExpiresAt = (Math.floor(now * intervalInMs) / intervalInMs) + (intervalInMs / 2);
        const cacheId = DataCache.getCacheIdForRequestTimeParams(requestTimeParams);
        this.setData(cacheId, {
            cacheDate: now,
            requestTimeParams: requestTimeParams,
            data: data,
            expiresAt: cacheExpiresAt,
        });
    }

    public setData(id: number, cacheEntry: DataCacheEntry<T>): void {
        this.cacheMap.set(id, cacheEntry);
    }

}
