const http = require('http');
const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
const fs = require('fs');
const DOMParser = require('jsdom');
const heroDefaults = require('./Hero.interface.js');

const port = '5050';
const host = '127.0.0.1';

const options = {
  protocol: 'https://',
  method: 'GET',
  website: 'dota2.fandom.com',
  host: encodeURI('dota2.fandom.com/ru/wiki/Heroes'),
  path: '/',
  // This is the only line that is new. `headers` is an object with the headers to request
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36',
    'Accept': '*/*',
    'Accept-Encoding': 'null',
    'Connection': 'keep-alive',
    'Host': encodeURIComponent('dota2.fandom.com/ru/wiki/Heroes'),
    'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7,uk;q=0.6,la;q=0.5'
  }
};

const parseRequest = new XMLHttpRequest();
let response = null;
let parsedDocument = null;
let heroes = [];

const setRequestHeaders = req => {
  req.setRequestHeader('User-Agent', options.headers['User-Agent']);
  req.setRequestHeader('Accept', options.headers.Accept);
  req.setRequestHeader('Accept-Language', options.headers['Accept-Language']);
};

// Parsing page


function parsePage() {
  parseRequest.open('GET', options.protocol + options.host);
  setRequestHeaders(parseRequest);
  parseRequest.onreadystatechange = function() {
    if (parseRequest.readyState === parseRequest.DONE) {
      response = parseRequest.responseText;
      parsedDocument = (new DOMParser.JSDOM(response));
    }
  };
  parseRequest.send();
}
async function getHeroesLinks(doc) {
  if (!doc) return;
  const heroLinks = doc.window.document.querySelectorAll('table td div a');
  const resultArray = [];
  let currentAttrib = 0;
  let prevName = '';
  heroLinks.forEach(el => {
    const link = el.attributes['href'].value;
    const name = (link.split('/')[3]).replace(/_/g, ' ');
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
  const req = new XMLHttpRequest();
  req.open('GET', options.protocol + options.website + link);
  setRequestHeaders(req);
  req.onreadystatechange = function() {
    if (req.readyState === req.DONE) {
      hero.page = (new DOMParser.JSDOM(req.responseText));

      setHeroTalents(hero);
      setBasicHeroAttributes(hero);


    }
  };
  req.send();
}

function setBasicHeroAttributes(hero) {
  const page = hero.page.window.document;
  hero.img = page.querySelector('a.image img').attributes['src'].value;
  hero.attributes = []; // [ { start: 25, grow: 2 }, {...}, {}]
  const attributesDivs = page.querySelectorAll('table.infobox tr:first-child div');
  console.log(attributesDivs);
  for (let i = 5; i <= 7; i++) {
    const attrString = attributesDivs[i].textContent.split(' + ');
    hero.attributes.push({ start: +attrString[0], grow: +(attrString[1].replace(',', '.')) });
  }
  hero.firstLvlStats = [];
  hero.lastLvlStats = [];
  hero.defaultStats = [];
  const stats = page.querySelectorAll('table.infobox tr:nth-child(2) table tr');
  for (let i = 1; i < stats.length; i++) {
    const trStats = stats[i].querySelectorAll('td');
    hero.firstLvlStats.push(trStats[1].textContent.trim());
    hero.lastLvlStats.push(trStats[4].textContent.trim());
  }

  const defaultStats = page.querySelectorAll('table.infobox tr:nth-child(3) table tbody tr td');
  defaultStats.forEach(el => hero.defaultStats.push(el.textContent.trim()));

  console.log(hero);
}

function setHeroTalents(hero) {
  const page = hero.page.window.document;
  hero.talents = [];
  let count = 18;
  while (true) {
    const talentsDivs = page.querySelectorAll(`div div:nth-child(${count}) table tbody tr`);
    if (talentsDivs[0] !== undefined) if (talentsDivs[0].textContent.trim() === 'Таланты героя') break;
    count++;
  }
  const talentsDivs = page.querySelectorAll(`div div:nth-child(${count}) table tbody tr`);
  for (let i = 1; i < 5; i++) {
    const trTalents = talentsDivs[i].querySelectorAll('td');
    trTalents.forEach(el => hero.talents.push(el.textContent.trim()));
  }
}

parsePage();
parseRequest.onloadend = async () => {
  heroes = await getHeroesLinks(parsedDocument);
  heroes.forEach(hero => {
    getHeroPage(hero, hero.link);
  });
};


const requestListener = function(req, res) {

  res.setHeader('Content-Type', 'text/html');
  fs.readFile('./pages/index.html', ((err, data) => {
    if (err) {
      res.writeHead(500);
      res.write('We didn`t find the page you`re looking for');
      res.end();
      return;
    }
    res.writeHead(200, { 'content-type': 'text/html charset=UTF-8' });
    res.end(data, 'utf-8');
  }));
};

const server = http.createServer(requestListener);
server.listen(port);

console.log(`http://${host}:${port}/`);
