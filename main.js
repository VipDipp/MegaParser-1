
const http = require('http');
const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
const fs = require('fs');
const DOMParser = require('jsdom');
const heroDefaults = require('./Hero.interface.js');
const ejs = require('ejs');
const path = require('path');

const port = '5050';
const host = '127.0.0.1';

const options = {
  protocol: 'https://',
  method: 'GET',
  website: 'dota2.fandom.com',
  host: encodeURI('dota2.fandom.com/ru/wiki/Герои'),
  path: '/',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) ' +
        'AppleWebKit/537.36 (KHTML, like Gecko) ' +
        'Chrome/39.0.2171.95 Safari/537.36',
    'Accept': '*/*',
    'Accept-Encoding': 'null',
    'Connection': 'keep-alive',
    'Host': encodeURIComponent('dota2.fandom.com/ru/wiki/Герои'),
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
      setBasicHeroAttributes(hero);
      getAbilityimages(hero);
      getAbilityDescriptions(hero);
      setHeroTalents(hero);
      recentChanges(hero);

    }
  };
  req.send();
}

function setBasicHeroAttributes(hero) {
  const page = hero.page.window.document;
  const imgs = page.querySelectorAll('a.image img');
  for (let i = 0; i < imgs.length; i++) {
    if (imgs[i].alt && !imgs[i].alt.includes('Grow')) {
      hero.img = imgs[i].attributes['src'].value;
      break;
    }
  }
  hero.attributes = [];
  const attributesPath = 'table.infobox tr:first-child div';
  const attributesDivs = page.querySelectorAll(attributesPath);
  console.log(attributesDivs);
  for (let i = 5; i <= 7; i++) {
    const attrString = attributesDivs[i].textContent.split(' + ');
    hero.attributes.push({ start: +attrString[0], grow: +(attrString[1].replace(',', '.')) });
  }
  hero.firstLvlStats = [];
  hero.lastLvlStats = [];
  hero.defaultStats = [];
  const statsPath = 'table.infobox tr:nth-child(2) table tr';
  const stats = page.querySelectorAll(statsPath);
  for (let i = 1; i < stats.length; i++) {
    const trStats = stats[i].querySelectorAll('td');
    hero.firstLvlStats.push(trStats[1].textContent.trim());
    hero.lastLvlStats.push(trStats[4].textContent.trim());
  }
  const defaultPath = 'table.infobox tr:nth-child(3) table tbody tr td';
  const defaultStats = page.querySelectorAll(defaultPath);
  defaultStats.forEach(el => hero.defaultStats.push(el.textContent.trim()));


}

function getAbilityimages(hero) {
  hero.abilityImgLinks = [];
  const page = hero.page.window.document;
  const path = 'div.ico_active > a > img, ' +
      'div.ico_passive > a > img, ' +
      'div.ico_autocast > a > img';
  const skillImgs = page.querySelectorAll(path);
  skillImgs.forEach(skillImg => {
    const link = skillImg.attributes['src'].value;
    hero.abilityImgLinks.push(link);
  });
}
function getAbilityDescriptions(hero) {
  hero.abilityDescriptions = [];
  const page = hero.page.window.document;
  const descriptionPath = 'div.ability-description > div:nth-child(2)';
  const skillDescriptions = page.querySelectorAll(descriptionPath);
  skillDescriptions.forEach(el =>
    hero.abilityDescriptions.push(el.textContent)
  );

  hero.abilityTitles = [];
  const titlesPath = 'div.ability-background > div > div:nth-child(1)';
  const skillTitles = page.querySelectorAll(titlesPath);
  skillTitles.forEach(title =>
    hero.abilityTitles.push(title.textContent.split('Link▶')[0].trim())
  );
}


function setHeroTalents(hero) {
  const page = hero.page.window.document;
  hero.talents = [];
  const talentsDivs = page.querySelectorAll('table.wikitable tbody tr');
  for (let i = 1; i < 5; i++) {
    const trTalents = talentsDivs[i].querySelectorAll('td');
    trTalents.forEach(el => hero.talents.push(el.textContent.trim()));
  }
}

function recentChanges(hero) {
  const page = hero.page.window.document;
  hero.recentChanges = [];
  const path = 'div.updatetablebody div:nth-child(1) div#description';
  const changes = page.querySelectorAll(path);
  hero.recentChanges.push(changes[0].textContent.trim());
  hero.page = null;
  console.log(hero);
}

parsePage();
parseRequest.onloadend = async () => {
  heroes = await getHeroesLinks(parsedDocument);
  heroes.forEach(hero => {
    getHeroPage(hero, hero.link);
  });
};


const requestListener = function(req, res) {
  if (!heroes.length) {
    console.log('Server is loading or crashed');
    return;
  }
  if (req.url === '/') {
    res.setHeader('Content-Type', 'text/html');
    fs.readFile(path.join(__dirname, 'pages/index.ejs'), 'utf-8', (err, data) => {
      if (err) throw new Error();
      const compiledPage = ejs.render(data, { heroes });

      res.setHeader('Status-Code', 200);
      res.end(compiledPage);
    });
    return;
  }
  if (req.url.includes('hero')) {
    res.setHeader('Content-Type', 'text/html');
    fs.readFile(path.join(__dirname, 'pages/hero.ejs'), 'utf-8', (err, data) => {
      if (err) throw new Error();
      const name = (req.url.split('/')[2]).replace(/_/g, ' ');
      const chosenHero = heroes.filter(el => el.name === name)[0];
      const compiledPage = ejs.render(data, { hero: chosenHero });

      res.setHeader('Status-Code', 200);
      res.end(compiledPage);
    });
    return;
  }
  console.log(req.url);
  if (req.url.includes('favicon')) {
    console.log('HERE');
    res.setHeader('Content-Type', 'image/png');
    fs.readFile(path.join(__dirname, 'pages/favicon.png'), (err, data) => {
      if (err) {
        res.writeHead(400, { 'Content-type': 'text/html' });
        console.log(err);
        res.end('No such image');
      } else {
        // specify the content type in the response will be an image
        console.log('image loaded!');
        res.writeHead(200, { 'Content-type': 'image/png' });
        res.end(data);
      }
    });
  }

};



const server = http.createServer(requestListener);
server.listen(port);

console.log(`http://${host}:${port}/`);
