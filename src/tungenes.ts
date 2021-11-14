import * as dotenv from 'dotenv';
dotenv.config();


import fastifyInstanceBuilder, { FastifyInstance, HTTPMethods } from 'fastify';
import fastifyCors from 'fastify-cors';
import fastifyCompression from 'fastify-compress';

import DataSocket from './data-socket';


import { ArchiveRoute } from './routes/archive.route';
import { HiLoRoute } from './routes/hilo.route';
import { WindroseRoute } from './routes/windrose.route';
// import { Windrose10Route } from './routes/windrose10.route';
import { Database, DatabaseCacher, DatabaseConnection, DataMethods } from './database';
import { Route } from 'routes/route';

export declare interface Type<T> extends Function {
    new (...args: any[]): T;
}


/**
 * todo
 *
 *
 */

export default class Tungenes {

    private _fastify: FastifyInstance;
    private dataSocket: DataSocket;

    private databaseConnection: DatabaseConnection;
    private database: Database;
    private databaseCacher: DatabaseCacher;
    private dataMethods: DataMethods;


    constructor(
        private port: number = 80,
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

    private configFastify(): void {
        if (this._fastify) {
            return;
        }
        this._fastify = fastifyInstanceBuilder();
        this._fastify.setErrorHandler((error, request, reply) => {
            console.error(error);
            reply.send();
        });
        this._fastify.listen(this.port);
        this.configFastifyCors();
        this.configFastifyCompression();
    }


    private addDataSocket() {
        this.dataSocket = new DataSocket(this.dataMethods);
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


const isProduction = process.env.NODE_ENV && process.env.NODE_ENV.toLowerCase() === 'production';
if (isProduction) {
    const tungenes: Tungenes = new Tungenes();
}
else {
    const tungenes: Tungenes = new Tungenes(8080);
}



