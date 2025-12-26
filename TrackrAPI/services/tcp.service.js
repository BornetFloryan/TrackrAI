const net = require('net');

const TCP_HOST = process.env.CENTRAL_HOST || 'localhost';
const TCP_PORT = parseInt(process.env.CENTRAL_PORT || '9000', 10);

function sendToCentralServer(message) {
    return new Promise((resolve, reject) => {
        const client = new net.Socket();

        client.connect(TCP_PORT, TCP_HOST, () => {
            client.write(message + '\n');
        });

        client.on('data', (data) => {
            client.destroy();
            resolve(data.toString());
        });

        client.on('error', (err) => {
            client.destroy();
            reject(err);
        });

        client.setTimeout(3000, () => {
            client.destroy();
            reject(new Error('TCP timeout'));
        });
    });
}

module.exports = {
    sendToCentralServer
};
