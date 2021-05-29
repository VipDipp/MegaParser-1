
var resp = new Buffer('');
var isResponded = false;

var options = {
    protocol: 'https:',
    method: 'GET',
    host: 'dota2.fandom.com/ru/wiki/' + encodeURIComponent('Герои'),
    path: '/',
    //This is the only line that is new. `headers` is an object with the headers to request
    headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36',
        'Accept': '*/*',
        'Accept-Encoding': 'null',
        'Connection': 'keep-alive',
        'Host': encodeURIComponent('dota2.fandom.com/ru/wiki/Герои'),
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7,uk;q=0.6,la;q=0.5'
    }
};

var request = https.request(options,(res) => {
        res.on('data', (data) => {
          console.log('data:', data);
          resp = Buffer.concat([resp, data]);
        });
        res.on('end', () => isResponded = true);
});

request.end();

const requestListener = function (req, res) {
    // req.method (GET, POST, PUT, DELETE)
    // req.url
    // response.setHeader('Content-Type', 'application/json'); // Response headers
    // response.write() // Body of response
    if(isResponded){
        res.setHeader('Content-Type', 'text/html');
        fs.readFile('./pages/index.html', ((err, data) => {
            if(err){
                res.writeHead(500);
                res.write('We didn`t find the page you`re looking for');
                res.end()
                return;
            }
            res.writeHead(200, {'content-type': 'text/html charset=UTF-8'});
            res.end(data, 'utf-8');
        }))
        // res.end(resp.toString('utf-8'));
        return;
    }
    res.writeHead(500);
    res.end('Not yet');
}

// TODO: GET '/api/parse' + params
// TODO: params => text
// TODO: config options
// TODO: make request a function like: request(smthg)
// TODO: request it
// TODO: get a result from parse
// TODO: calculate some values like quantity, percents etc
// TODO: response it to client request


const server = http.createServer(requestListener);
server.listen(port);

console.log(`http://${host}:${port}/`)

// TODO Parse https://dota2.fandom.com/ru/wiki/Герои to string
// TODO Make HTMLDocument based on the string
// TODO `table td div a` => linksToHero
// TODO navigate to linksToHero and get `table.infobox`
// TODO get 8 divs with attributes from `table.infobox tr:first-child div` {
//  0: a.image,
//  2-4: divs with attributes(one of them - #primaryAttribute),
//  5-7: values of start attributes and ' + n' grow
// }
// TODO Then get table with characteristics from `table.infobox tr:nth-child(2) table tr` get only 0, 2, 5 columns
// TODO Get info from `table.infobox tr:nth-child(3) table`
//
