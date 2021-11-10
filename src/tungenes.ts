import * as dotenv from 'dotenv';
dotenv.config();

import * as express from 'express';
import * as compression from 'compression';
import * as debug from 'debug';
import * as cors from 'cors';

import fastifyInstanceBuilder, { FastifyInstance } from 'fastify';
import fastifyCors from 'fastify-cors';
import fastifyCompression from 'fastify-compress';

import DataSocket from './data-socket';


import { ArchiveRoute } from './routes/archive.route';
import { HiLoRoute } from './routes/hilo.route';
import { WindroseRoute } from './routes/windrose.route';
import { Windrose10Route } from './routes/windrose10.route';
import { DatabaseConnection } from './database';

export default class Tungenes {

    private _fastify: FastifyInstance;
    private express: express.Application;
    private dataSocket: DataSocket;

    private databaseConnection: DatabaseConnection;

    constructor(
        private port: number = 80,
    ) {
        console.log('Tungenes', this.port);

        this.databaseConnection = new DatabaseConnection();

        this._fastify = fastifyInstanceBuilder();

        this.configFastify();

        // return;
        // this.express = express();
        // this.configExpress();
        // this.addRoutes();
        // this.express.listen(this.port);
        // this.addDataSocket();

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
        this.configFastifyCors();
        this.configFastifyCompression();
    }

    private configExpress(): void {
        console.log('Tungenes.configExpress()');
        this.express.use(compression());
        this.express.use(cors());
        // this.express.use(debug());
    }

    private addDataSocket() {
        this.dataSocket = new DataSocket(this.databaseConnection);
    }

    private addRoutes(): void {
        console.log('Tungenes.addRoutes()');
        const archiveRoute = new ArchiveRoute(this.express, this.databaseConnection);
        // const windroseRoute = new WindroseRoute(this.express, this.databaseConnection);
        // const windrose10Route = new Windrose10Route(this.express, this.databaseConnection);
        // const hiLoRoute = new HiLoRoute(this.express, this.databaseConnection);
    }

}



if (process.env.NODE_ENV && process.env.NODE_ENV.toLowerCase() === 'production') {
    const tungenes: Tungenes = new Tungenes();
}
else {
    const tungenes: Tungenes = new Tungenes(8080);
}



