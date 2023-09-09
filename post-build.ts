import * as fs from 'fs';
import { execSync } from 'child_process';
import { exit } from 'process';


console.log('build.ts');

console.log('process.platform', process.platform);

if (process.platform === 'win32') {
    exit();
}


const distDirPath = `${ __dirname }/dist`;

const serviceFileName = `tungenes.service`;

const serviceFile = `
[Unit]
Description=Tungenes

[Service]
ExecStart=${ distDirPath }/server.js
Restart=always
Environment=PATH=/usr/bin:/usr/local/bin:/snap/bin
Environment=NODE_ENV=production
WorkingDirectory=${ distDirPath }

[Install]
WantedBy=multi-user.target
Alias=${ serviceFileName }
`;



const serviceFilePath = `${ distDirPath }/${ serviceFileName }`;
fs.writeFileSync(serviceFilePath, serviceFile);


const serverFilePath = `${ distDirPath }/server.js`;
fs.chmodSync(serverFilePath, 0o775);

const copyServiceFilePath = `${ __dirname }/copy-service.sh`;
fs.chmodSync(copyServiceFilePath, 0o775);
