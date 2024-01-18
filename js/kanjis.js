import * as helper from './helper.js';
import pLimit from 'p-limit';

export async function getAllKanjiComponents(browser, cookies) {
    let compsPage;
    try {
        //Kanji components url
        const compsUrl = "https://www.kanshudo.com/component_details/all_components";
        //Open a new page
        compsPage = await browser.newPage();
        //Load cookies
        await compsPage.setCookie(...cookies);
        //Navigate to the kanji components page
        await compsPage.goto(compsUrl);
        //Get all the component urls from the page
        const comps = await compsPage.evaluate(() => {
            //Get the component containers
            const compContainers = document.querySelectorAll('#main-content .bodyarea .clist .cbox .chead');
            //Loop through and grab the name and url objects
            let comps = [];
            for (const compContainer of compContainers) {
                //Grab the name
                const compName = compContainer.querySelector('div .cname').textContent;
                //Grab the component kanji url
                const kanjiUrl = compContainer.querySelector('.comp').href;
                //Add object to list
                comps.push({
                    name: compName,
                    url: kanjiUrl
                });
            }
            //Return
            return comps;
        });
        //Limit to batches of 3
        const limit = pLimit(10);
        const compPromises = Array.from(comps).map((comp) => {
            return limit(async () => {
                //Get the kanji details
                const kanji = await getKanjiDetailFromBrowser(browser, comp.url, cookies);
                //Return the new object
                return {
                    name: comp.name,
                    url: comp.url,
                    kanji: kanji
                };
            })

            
        });
        //Process
        const kanjis = await Promise.all(compPromises);
        //Add list to object
        const kanjisObj = { kanjis: kanjis };
        //Return
        return kanjisObj;
    } catch (error) {
        console.error('Error in getAllKanjiComponents():', error);
        return false;
    } finally {
        compsPage.close();
    }
    
}

export async function getKanjis(browser, kanjiUrlSuffixes, cookies) {
    //Map url suffixes to getKanjiDetailFromSuffix() Promises
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
            const kanjiObj = await getKanjiDetailFromSuffix(page, kanjiUrlSuffix);
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

async function getKanjiDetailFromSuffix(page, kanjiUrlSuffix) {
    //Base url
    const baseUrl = 'https://www.kanshudo.com/kanji/';
    //Full url
    const kanjiUrl = baseUrl + kanjiUrlSuffix;
    //Call main function
    return await getKanjiDetail(page, kanjiUrl);
}

async function getKanjiDetailFromBrowser(browser, kanjiUrl, cookies) {
    //Open new page
    const page = await browser.newPage();
    try {
        //Load cookies
        await page.setCookie(...cookies);
        //Get kanji
        const kanjiObj = await getKanjiDetail(page, kanjiUrl);
        //Return
        return kanjiObj;
    } catch (error) {
        console.error('Error in getKanjiDetailFromBrowser():', error);
        return false;
    } finally {
        await page.close();
    }
}

async function getKanjiDetail(page, kanjiUrl) {
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
    const kanjiDef = kanjiDefSplit[1] ? kanjiDefSplit[1].trim().replaceAll("'", '') : "No definition";
    //Return
    return {
        kanji: kanji,
        meaning: kanjiDef
    }
}