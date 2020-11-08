import * as dotenv from 'dotenv';
dotenv.config();

import * as express from 'express';
import * as compression from 'compression';
import * as debug from 'debug';
import * as cors from 'cors';

import DataSocket from './data-socket';


import archiveRoute from './routes/archive.route';
import realtimeRoute from './routes/realtime.route';
import hiLoRoute from './routes/hilo.route';
import windroseRoute from './routes/windrose.route';
import windrose10Route from './routes/windrose10.route';

export default class Tungenes {

    private express: express.Application;
    private dataSocket: DataSocket;

    constructor(private port: number = 80) {
        this.express = express();
        this.configExpress();
        this.addRoutes();
        this.express.listen(this.port);
        this.addDataSocket();
    }

    private configExpress(): void {
        console.log('configExpress');
        this.express.use(compression());
        this.express.use(cors());
        // this.express.use(debug());
    }

    private addDataSocket() {
        this.dataSocket = new DataSocket();
    }

    private addRoutes(): void {
        console.log('addRoutes');
        this.express.use('/api', archiveRoute);
        this.express.use('/api', hiLoRoute);
        this.express.use('/api', realtimeRoute);
        this.express.use('/api', windroseRoute);
        this.express.use('/api', windrose10Route);
    }

}



if (process.env.NODE_ENV && process.env.NODE_ENV.toLowerCase() === 'production') {
    let tungenes: Tungenes = new Tungenes();
}
else {
    let tungenes: Tungenes = new Tungenes(8080);
}



