import { createMudo, MUDO_SOCKET_TYPES, MudoSpec } from '../mudo';
import minimist = require('minimist');

const argv = minimist(process.argv.slice(2));

if (!('client' in argv)) {
    throw new Error('must specify client');
}
if (!('server' in argv)) {
    throw new Error('must specify server');
}

const mudoSpec:MudoSpec = {
    client: argv.client,
    server: argv.server,
};

if ('socket' in argv) {
    const socketType = (<string>argv.socket).toUpperCase();
    if (!(socketType in MUDO_SOCKET_TYPES)) {
        throw new Error(`unknown socket type.  must be one of ${Object.keys(MUDO_SOCKET_TYPES).join()}`);
    }
    mudoSpec.socket = MUDO_SOCKET_TYPES[socketType];
}

if ('port' in argv) {
    mudoSpec.port = argv.port | 0;
}
if ('host' in argv) {
    mudoSpec.host = argv.host;
}
if ('cors' in argv) {
    mudoSpec.cors = !!argv.cors;
}
if ('ssl' in argv) {
    mudoSpec.ssl = !!argv.ssl;
}
if ('cert' in argv) {
    mudoSpec.cert = argv.cert;
}
if ('open' in argv) {
    mudoSpec.open = argv.open;
}

createMudo(mudoSpec);