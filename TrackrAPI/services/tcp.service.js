const net = require('net');

const TCP_HOST = process.env.CENTRAL_HOST || '127.0.0.1';
const TCP_PORT = Number(process.env.CENTRAL_PORT);

function sendToCentralServer(message) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    let received = '';

    client.connect(TCP_PORT, TCP_HOST, () => {
      client.write(message + '\n');
    });

    client.on('data', (data) => {
      received += data.toString();

      if (received.includes('\n')) {
        resolve(received.trim());
        client.end();
      }
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

module.exports = { sendToCentralServer };
