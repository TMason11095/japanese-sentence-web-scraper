import * as helper from './helper.js';

export async function getAllJlptKanjis(browser, cookies, nLevel) {
    return await helper.getAllSubPagesData(
        browser,
        cookies,
        "https://www.kanshudo.com/collections/jlpt_kanji",
        async (page) => {
            return await page.evaluate((nLevel) => {
                //Get JLPT level headers
                const nLevelHeaderContainers = Array.from(document.querySelectorAll('#main-content .bodyarea .bodysection .infopanel h4')).filter(h4 => h4.textContent.includes(nLevel));
                //Loop through an pull all the kanji urls for each level
                let jlptKanjis = [];
                for (const nLevelHeaderContainer of nLevelHeaderContainers) {
                    //Get the container for the kanji (2 siblings after the header)
                    const kanjisContainer = nLevelHeaderContainer.nextElementSibling.nextElementSibling;
                    //Add the new kanjis entry
                    jlptKanjis.push({
                        title: nLevelHeaderContainer.textContent,
                        kanji_urls: Array.from(kanjisContainer.querySelectorAll('.kanji a')).map((kanji) => kanji.href)
                    });
                }
                //Return
                return jlptKanjis;
            }, nLevel);
        },
        10,
        (jlptSections, limit) => {
            //Loop through each JLPT section
            return jlptSections.map(async (jlptSection) => {
                //Get promises for the kanji pages
                const kanjiPromises = jlptSection.kanji_urls.map((kanjiUrl) => {
                    return limit(() => getKanjiDetailFromBrowser(browser, kanjiUrl, cookies));
                });
                //Run all the promises
                const kanjis = await Promise.all(kanjiPromises);
                    //Return the sections with their kanjis
                return {
                    title: jlptSection.title,
                    kanjis: kanjis
                };
            });
        },
        nLevel
    );
}

export async function getAllKanjiComponents(browser, cookies) {
    return await helper.getAllSubPagesData(
        browser,
        cookies,
        "https://www.kanshudo.com/component_details/all_components",
        async (page) => {
            return await page.evaluate(() => {
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
        },
        10,
        (subUrls, limit) => {
            return Array.from(subUrls).map((subUrl) => {
                return limit(async () => {
                    //Get the kanji details
                    const kanji = await getKanjiDetailFromBrowser(browser, subUrl.url, cookies);
                    //Return the new object
                    return {
                        name: subUrl.name,
                        url: subUrl.url,
                        kanji: kanji
                    };
                })
            })
        },
        "kanjis"
    );
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