import * as helper from './helper.js';

export async function getKanjis(browser, kanjiUrlSuffixes, cookies) {
    //Map url suffixes to getKanjiDetail() Promises
    let pages = [];//To close later
    const kanjiPromises = kanjiUrlSuffixes.map(async (kanjiUrlSuffix) => {
        //Open new page
        const page = await browser.newPage();
        //Store page to close later
        pages.push(page);
        //Get kanji
        try {
            //Load cookies
            await page.setCookie(...cookies);
            //Get kanji
            const kanjiObj = await getKanjiDetail(page, kanjiUrlSuffix);
            //Return
            return kanjiObj;
        } catch (error) {
            console.error('Error in getKanjis():', error);
            return false;
        }
    });
    //Process results
    try {
        const kanjis = await Promise.all(kanjiPromises);
        //Add list to object
        const kanjisObj = { kanjis: kanjis };
        //Return
        return kanjisObj;
    } catch(error) {
        console.error('Error in getKanjis():', error);
        return false;
    } finally {
        //Close all pages
        await Promise.all(pages.map(page => page.close()));
    }
}

async function getKanjiDetail(page, kanjiUrlSuffix) {
    //Base url
    const baseUrl = 'https://www.kanshudo.com/kanji/';
    //Full url
    const kanjiUrl = baseUrl + kanjiUrlSuffix;
    //Get kanji detail
    try {
        //Navigate to page
        await page.goto(kanjiUrl);
        //Get kanji components in parallel
        const [kanjiIds, kanjiDef, kanjiType, componentIds] = await Promise.all([
            helper.getIds(page, '#main-content .bodyarea .kanjirow.level0 .kr_container .kanji', 'id', '^(k_kan_)'),
            getKanjiDetailDefinition(page),
            getKanjiType(page),
            helper.getIds(page, '#main-content .bodyarea .kanjirow.level1 .kr_container .kanji', 'id', '^(k_kan_)')
        ])
        //Grab the kanji id (only 1 id per page)
        const kanjiId = kanjiIds[0];
        //Return
        return {
            id: kanjiId,
            kanji: kanjiDef.kanji,
            meaning: kanjiDef.meaning,
            type: kanjiType,
            component_ids: componentIds
        };
    } catch (error) {
        console.error('Error in getKanjiDetail():', error);
        return false;
    }
}

async function getKanjiType(page) {
    return await page.evaluate(() => {
        return document.querySelector('#main-content .bodyarea .kdetailsrow .kdetails2 div .typemessage').textContent;
    });
}

async function getKanjiDetailDefinition(page) {
    //Get the kanji definition sentence (includes kanji + filler text + definition)
    const defWithFiller = await page.evaluate(() => {
        return document.querySelector('#main-content .bodyarea h1').textContent;
    });
    //Split the definition by "mean" (kanji means 'def')
    const kanjiDefSplit = defWithFiller.split('means');
    //Get each component of the split
    const kanji = kanjiDefSplit[0].trim();
    const kanjiDef = kanjiDefSplit[1].trim().replaceAll("'", ''); //Remove surrounding ''
    //Return
    return {
        kanji: kanji,
        meaning: kanjiDef
    }
}