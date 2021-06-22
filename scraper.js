/*
This uses the great website at Renovate America
as our exmaple because they made it so easy to access
data via a URL.

I hope this code helps you learn basic scraping and
logic skills!
*/

const fs = require('fs');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

function saveResults(searchResults, stream) {
    stream.write(searchResults.join('\n') + "\n");
}

function getPageCount($) {
    const pageCount = $('div.pagination').attr('data-count');
    return pageCount;
}

function getContractorLinks($) {
    let searchResults = [];
    $('.contractor-link a').each((idx,elem) => {
        let resultEntry = $(elem).attr('href');
        searchResults.push(resultEntry);
        console.log(resultEntry);
    });
    return searchResults;
} 

async function scrapeZip(zipCode) {
    console.log('Scraping the face off zip code', zipCode);
    const stream = fs.createWriteStream(`scrapey${zipCode}.txt`, {flags:'a'});
    let url = `https://www.renovateamerica.com/find-a-contractor/contractor-search-results?Radius=100&ZipCode=${zipCode}&Page=1`;
  
    const browser = await puppeteer.launch({
    headless: false,
    args: [
        '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Safari/537.36'
        ]
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1280 })
    await page.goto(url, { waitUntil: 'networkidle2' });    
    console.log('Page loaded.');
    let content = await page.content();
    let $ = cheerio.load(content);
//  tum te tum
    let pageCount = getPageCount($);
    console.log(`There are ${pageCount} pages for ${zipCode}`);
    console.log(`Getting page 1`);
    let contractorLinks = getContractorLinks($);
    saveResults(contractorLinks, stream);
    // theres more than one page
    if (pageCount > 1) {
        x = 2;
        while(pageCount >= x) {
            console.log(`Getting page ${x}`);
            let url = `https://www.renovateamerica.com/find-a-contractor/contractor-search-results?Radius=100&ZipCode=${zipCode}&Page=${x}`;
            await page.goto(url, { waitUntil: 'networkidle2' });
            await page.waitForSelector('.contractor-link');
            console.log('Selector found.');
            let content = await page.content();
            let $ = cheerio.load(content);
            let contractorLinks = getContractorLinks($);
            saveResults(contractorLinks, stream);
            x += 1;
        }
    }
    else {
        console.log("1 page only.");
    }
    // // Zip is done. close the browser.
    await browser.close();
}


//main
async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

let zipCodeList = ['96001','30005','10111','23241'];
//var zipCodeList = fs.readFileSync('list-of-codes.txt').toString().split("\n");

asyncForEach(zipCodeList, scrapeZip);