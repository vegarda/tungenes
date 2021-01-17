import { ValidParams, RequestTime } from 'types';

export interface DataCacheEntry<T> {
    cacheDate: number;
    params: ValidParams;
    requestTime: RequestTime;
    data: T;
    expiresAt: number;
}

export class DataCache<T> {

    private cacheMap: Map<number, DataCacheEntry<T>> = new Map();

    private cleanCache(): void {
        const now = Date.now();
        this.cacheMap.forEach((value, key) => {
            if (value.expiresAt < now) {
                this.cacheMap.delete(key);
            }
        });
    }

    public get(id: number): DataCacheEntry<T> {
        const cacheEntry = this.cacheMap.get(id);
        this.cleanCache();
        if (cacheEntry) {
            return cacheEntry;
        }
        return null;
    }

    public getData(id: number): T {
        const cacheEntry = this.get(id);
        if (cacheEntry) {
            return cacheEntry.data;
        }
        return null;
    }

    public setData(id: number, cacheEntry: DataCacheEntry<T>): void {
        this.cacheMap.set(id, cacheEntry);
    }

}
