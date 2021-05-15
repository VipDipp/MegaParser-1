const http = require('http');
const fs = require('fs');

const port = '5050'
const host = '127.0.0.1'

var resp = 'unset';

var options = {
    host: 'tsn.ua',
    path: '/',
    //This is the only line that is new. `headers` is an object with the headers to request
    headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36'
    }
};

var request = http.request(options,(res) => {
        res.on('data', (data) => {
           resp += data;
           console.log('data:', data);
        });
});

request.end();

const requestListener = function (req, res) {
    // req.method (GET, POST, PUT, DELETE)
    // req.url
    // response.setHeader('Content-Type', 'application/json'); // Response headers
    // response.write() // Body of response
    res.writeHead(200);
    res.write(resp);
    res.end('\nHello, World!');
}



const server = http.createServer(requestListener);
server.listen(port);
