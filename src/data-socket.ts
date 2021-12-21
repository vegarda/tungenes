import { Raw } from 'data/raw';
import { DataMethods } from 'database';

import { FastifyInstance, FastifyRequest } from 'fastify';
import { SocketStream } from 'fastify-websocket';

import { BehaviorSubject } from 'rxjs';





export default class DataSocket {

    private openSocketStreams: SocketStream[] = [];

    private consoleData$ = new BehaviorSubject<Raw>({
        dateTime: 0,
        outHumidity: 0,
        barometer: 0,
        outTemp: 0,
        windSpeed: 0,
        windDir: 0,
        windGust: 0,
        windGustDir: 0,
        dayRain: 0,
        rainRate: 0,
    });

    constructor(
        private fastify: FastifyInstance,
        private dataMethods: DataMethods,
        private port: number = 800,
    ) {
        this.init();
    }

    private async init(): Promise<void> {

        this.configWebSocket();

        this.consoleData$.subscribe(consoleData => {
            // console.log('DataSocket.consoleData$', consoleData);
            this.updateSocketsWithData();
        })

        this.updateSockets();

    }


    private configWebSocket() {
        console.log('DataSocket.configWebSocket()');


        const onConnection = async (socketStream: SocketStream) => {

            if (this.openSocketStreams.length === 0) {
                await this.updateData();
            }

            this.openSocketStreams.push(socketStream);
            console.log('DataSocket.openSocketStreams: ' + this.openSocketStreams.length);

            this.updateSocketStream(socketStream);

            socketStream.on('close', () => {
                console.log('socket close');
                this.openSocketStreams.splice(this.openSocketStreams.indexOf(socketStream));
                console.log('DataSocket.openSocketStreams: ' + this.openSocketStreams.length);
            });

            socketStream.on('error', (error) => {
                console.error(error);
            });

        };

        this.fastify.get('/', { websocket: true }, (socketStream: SocketStream, req: FastifyRequest) => {
            onConnection(socketStream);
        });

    }

    private async updateSockets() {
        // console.log('DataSocket.updateSockets()');
        await this.updateData();
        this.sleepAndUpdate();
    }

    private updateSocketsWithData() {
        // console.log('DataSocket.updateSocketsWithData()');
        this.openSocketStreams.forEach(socket => {
            this.updateSocketStream(socket);
        });
    }

    private async sleepAndUpdate(sleepDuration: number = 10000) {
        // console.log('DataSocket.sleepAndUpdate()');
        await this.sleep(sleepDuration);
        this.updateSockets();
    }

    private updateSocketStream(socketStream: SocketStream) {
        const consoleData = this.consoleData$.value;
        if (consoleData) {
            socketStream.socket.send(JSON.stringify(consoleData));
        }
    }

    private async sleep(ms: number){
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    }

    private async getData(): Promise<Raw> {
        // console.log('DataSocket.getData()');
        const rawData = await this.dataMethods.getRawData();
        if (rawData) {
            return rawData[0];
        }
        return null;
    }

    private async updateData(): Promise<void> {
        // console.log('DataSocket.updateData()');
        try {
            const data = await this.getData();
            if (this.consoleData$.value.dateTime < data.dateTime) {
                this.consoleData$.next(data);
            }
        }
        catch (error) {
            if (error) {
                console.error(error.name);
                console.error(error.message);
            }
        }
    }

}

