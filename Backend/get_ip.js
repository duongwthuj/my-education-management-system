
import os from 'os';

const interfaces = os.networkInterfaces();
const results = Object.create(null);

for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
        // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
        if (net.family === 'IPv4' && !net.internal) {
            if (!results[name]) {
                results[name] = [];
            }
            results[name].push(net.address);
        }
    }
}

console.log(JSON.stringify(results, null, 2));
