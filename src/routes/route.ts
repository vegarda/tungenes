import { FastifyReply, FastifyRequest, HTTPMethods, RouteHandlerMethod } from 'fastify';
import * as asdasdas from 'fastify-caching';

import { DataMethods } from 'database';
import { DataCache, DataCacheEntry } from '../utils/data-cache';
import { RequestTimeParams } from '../utils/request-time-params';


export abstract class Route<ResponseData = unknown> {

    public static readonly method: HTTPMethods | HTTPMethods[];
    public static readonly route: string;

    public readonly method: HTTPMethods | HTTPMethods[];
    public readonly route: string;

    protected dataCache: DataCache<ResponseData>;

    constructor() {
        this.route = (Object.getPrototypeOf(this).constructor as typeof Route).route;
        if (!this.route) {
            throw new Error('static Route.route missing');
        }
        this.method = (Object.getPrototypeOf(this).constructor as typeof Route).method;
        if (!this.method) {
            throw new Error('static Route.method missing');
        }
    }

    public abstract getHandler(dataMethods: DataMethods): RouteHandlerMethod;

    public getDataCacheEntryForRequestTimeParams(rtp: RequestTimeParams): DataCacheEntry<ResponseData | null> {
        if (this.dataCache) {
            return this.dataCache.getDataCacheEntryForRequestTimeParams(rtp);
        }
        return null;
    }

    public getCachedDataForRequestTimeParams(rtp: RequestTimeParams): ResponseData | null {
        if (this.dataCache) {
            return this.dataCache.getDataForRequestTimeParams(rtp);
        }
        return null;
    }

    public setCachedDataForRequestTimeParams(data: ResponseData, rtp: RequestTimeParams): void {
        if (this.dataCache) {
            return this.dataCache.setDataForRequestTimeParams(rtp, data);
        }
    }

}


export abstract class DataRoute<QueryData, ResponseData = QueryData> extends Route<ResponseData> {

    public abstract getData(dataMethods: DataMethods, rtp: RequestTimeParams, signal?: AbortSignal): Promise<ResponseData>;

    public getHandler(dataMethods: DataMethods): RouteHandlerMethod {

        return async (request: FastifyRequest, reply: FastifyReply) => {

            const rtp = RequestTimeParams.fromParams(request.params);

            console.log(request.url, rtp);

            const cachedValue = this.getCachedDataForRequestTimeParams(rtp);
            if (cachedValue) {
                reply.send(cachedValue);
                return;
            }

            const abortController = new AbortController();
            request.raw.once('end', () => abortController.abort());

            const data = await this.getData(dataMethods, rtp, abortController.signal);
            this.setCachedDataForRequestTimeParams(data, rtp);

            const cachedEntry = this.getDataCacheEntryForRequestTimeParams(rtp);
            if (cachedEntry) {
                const maxAge = Math.floor((cachedEntry.expiresAt - cachedEntry.cacheDate) / 1000);
                reply.header('Cache-Control', `max-age=${ maxAge }`);
            }

            reply.send(data);

        };

    }
}



