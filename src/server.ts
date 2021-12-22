#!/usr/bin/env node

import Tungenes from './tungenes';

const isProduction = process.env.NODE_ENV && process.env.NODE_ENV.toLowerCase() === 'production';
if (isProduction) {
    const tungenes = new Tungenes();
}
else {
    const tungenes = new Tungenes(8080);
}


