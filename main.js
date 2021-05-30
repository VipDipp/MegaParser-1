const http = require('http');
const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
const fs = require('fs');
const DOMParser = require("jsdom");
const heroDefaults = require('./Hero.interface.js');

const port = '5050'
const host = '127.0.0.1'

var options = {
    protocol: 'https://',
    method: 'GET',
    website: 'dota2.fandom.com',
    host: encodeURI('dota2.fandom.com/ru/wiki/Герои'),
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

var parseRequest = new XMLHttpRequest();
var response = null;
var parsedDocument = null;
var heroes = [];

var setRequestHeaders = (req) => {
    req.setRequestHeader("User-Agent", options.headers["User-Agent"]);
    req.setRequestHeader("Accept", options.headers.Accept);
    req.setRequestHeader("Accept-Language", options.headers["Accept-Language"]);
}

function parsePage() {
    parseRequest.open('GET', options.protocol + options.host);
    setRequestHeaders(parseRequest);
    parseRequest.onreadystatechange = function () {
        if(parseRequest.readyState === parseRequest.DONE) {
            response = parseRequest.responseText;
            parsedDocument = (new DOMParser.JSDOM(response));
        }
    }
    parseRequest.send();
    return;
}
async function getHeroesLinks(doc) {
    if(!doc) return;
    let heroLinks = doc.window.document.querySelectorAll('table td div a');
    let resultArray = [];
    let currentAttrib = 0;
    let prevName = '';
    heroLinks.forEach( el => {
        let link = el.attributes['href'].value;
        let name = (link.split('/')[3]).replace(/_/g, ' ');
        if (name < prevName) {
            currentAttrib += 1;
        }
        resultArray.push({
            name,
            link,
            primaryAttribute: heroDefaults.AttributesArr[currentAttrib],
        });
        prevName = name;
    });
    return resultArray;
}

function getHeroPage(hero, link) {
    let req = new XMLHttpRequest();
    req.open('GET', options.protocol + options.website + link);
    setRequestHeaders(req);
    req.onreadystatechange = function () {
        if(req.readyState === req.DONE) {
            hero.page = (new DOMParser.JSDOM(req.responseText));
            setBasicHeroAttributes(hero);
        }
    }
    req.send();
}

function setBasicHeroAttributes(hero) {
    // console.log(hero)
    let page = hero.page.window.document;
    hero.img = page.querySelector('a.image img').attributes['src'].value;
    console.log(hero);
}

parsePage();
parseRequest.onloadend = async () => {
    heroes = await getHeroesLinks(parsedDocument);
    heroes.forEach(hero => {
        getHeroPage(hero, hero.link);
    });
};


const requestListener = function (req, res) {

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

// Parse https://dota2.fandom.com/ru/wiki/Герои to string
// Make HTMLDocument based on the string
// `table td div a` => linksToHero
// navigate to linksToHero and get `table.infobox`
// get 8 divs with attributes from `table.infobox tr:first-child div` {
//  0: a.image,
//  2-4: divs with attributes(one of them - #primaryAttribute),
// TODO 5-7: values of start attributes and ' + n' grow
// }
// TODO Then get table with characteristics from `table.infobox tr:nth-child(2) table tr` get only 0, 2, 5 columns
// TODO Get info from `table.infobox tr:nth-child(3) table`
