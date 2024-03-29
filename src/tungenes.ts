import * as dotenv from 'dotenv';
dotenv.config({ path: `${ __dirname }/../.env` });

// console.log('process.env', process.env);

import * as fs from 'fs';

import fastifyInstanceBuilder, { FastifyHttpsOptions, FastifyInstance, FastifyListenOptions, FastifyReply, FastifyRequest, FastifyServerOptions } from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyCompression from '@fastify/compress';
import fastifyWebsocket, { SocketStream, WebsocketPluginOptions } from '@fastify/websocket';


import DataSocket from './data-socket';


import { ArchiveRoute } from './routes/archive.route';
import { HiLoRoute } from './routes/hilo.route';
import { WindroseRoute } from './routes/windrose.route';
import { Database, DatabaseCacher, DatabaseConnection, DataMethods } from './database';
import { Route } from 'routes/route';


export declare interface Type<T> extends Function {
    new (...args: any[]): T;
}


export default class Tungenes {

    private _fastify: FastifyInstance;
    private dataSocket: DataSocket;

    private databaseConnection: DatabaseConnection;
    private database: Database;
    private databaseCacher: DatabaseCacher;
    private dataMethods: DataMethods;


    constructor(
        private port: number = 445,
    ) {
        console.log('Tungenes', this.port);

        this.databaseConnection = new DatabaseConnection();
        this.database = new Database(this.databaseConnection);
        this.databaseCacher = new DatabaseCacher(this.database);
        this.dataMethods = this.databaseCacher;

        this.configFastify();

        this.addRoutes();

        this.addDataSocket();

    }

    private configFastifyCors(): void {
        const options = {

        }
        this._fastify.register(fastifyCors, options);
    }

    private configFastifyCompression(): void {
        const options = {

        }
        this._fastify.register(fastifyCompression, options);
    }

    private configFastifyWebsocket(): void {
        const options: WebsocketPluginOptions = {
            options: {
                maxPayload: 1048576,
            },
        };
        this._fastify.register(fastifyWebsocket, options);
    }



    private configFastify(): void {
        if (this._fastify) {
            return;
        }

        if (process.env.CERT_PATH && process.env.KEY_PATH) {
            this._fastify = fastifyInstanceBuilder({
                https: {
                    key: fs.readFileSync(process.env.KEY_PATH),
                    cert: fs.readFileSync(process.env.CERT_PATH),
                }
            });
        }
        else {
            this._fastify = fastifyInstanceBuilder();
        }

        this._fastify.setErrorHandler((error, request, reply) => {
            console.error(error);
            reply.send();
        });
        const listenOptions: FastifyListenOptions = {
            port: this.port,
        };
        this._fastify.listen(listenOptions);
        this.configFastifyCors();
        this.configFastifyCompression();
        this.configFastifyWebsocket();

    }


    private addDataSocket() {
        this.dataSocket = new DataSocket(this._fastify, this.dataMethods);
    }

    private addRoute(route: Type<Route>): void {
        const _route = new route();
        this._fastify.route({
            method: _route.method,
            url: _route.route,
            handler: _route.getHandler(this.dataMethods),
        });
    }

    private addRoutes(): void {
        console.log('Tungenes.addRoutes()');

        this.addRoute(ArchiveRoute);
        this.addRoute(HiLoRoute);
        this.addRoute(WindroseRoute);

    }

}
