import * as helper from './helper.js';

export async function getGrammars(browser, grammarUrlSuffixes, cookies) {
    //Map url suffixes to getGrammar Promises
    let pages = [];
    const grammarPromises = grammarUrlSuffixes.map(async (grammarUrlSuffix) =>{
        //Open new page
        const page = await browser.newPage();
        //Store pages to close later
        pages.push(page);
        //Get grammar
        try {
            //Load cookies
            await page.setCookie(...cookies);
            //Get the example sentence
            const grammar = await getGrammar(page, grammarUrlSuffix);
            //Return
            return grammar;
        } catch {
            console.error('Error in getGrammars():', error);
            return false;
        }
    });
    //Process results
    try {
        const grammars = await Promise.all(grammarPromises);
        //Add list to object
        const grammarsObj = { grammars: grammars };
        //Return
        return grammarsObj;
    } catch(error) {
        console.error('Error in getGrammars():', error);
        return false;
    } finally {
        //Close all pages
        await Promise.all(pages.map(page => page.close()));
    }
}

async function getGrammar(page, grammarUrlSuffix) {
    //Grammar base url (Should be auto grabbed when pulling from list page?)
    const baseUrl = 'https://www.kanshudo.com/grammar/';
    //Build full grammar url
    const grammarUrl = baseUrl + grammarUrlSuffix;
    //Get example sentence
    try {
        //Navigate to grammar page
        await page.goto(grammarUrl);
        //Get grammar components in parallel
        const [grammarIds, grammarCard] = await Promise.all([
            helper.getIds(page, '#main-content .bodyarea .grammar_point .gp_headline .gp_icons .jlpt_container', 'id', '^(jlpt_)'),
            getGrammarCard(page)
        ]);

        //Get grammar id (getIds() returns an array, but there's only one grammar id per page)
        const grammarId = grammarIds[0];
        //Return the grammar
        return {
            id: grammarId,
            front: grammarCard.front,
            back: grammarCard.back
        };
    } catch(error) {
        console.error('Error in getGrammar():', error);
        return false;
    } 
}

async function getGrammarCard(page) {
    //Get grammar definition container (Grammar section doesn't have a class we can navigate directly to. So grab the 2nd div child)
    const grammarContainer = await page.$('#main-content .bodyarea .grammar_point .gp_headline > div:nth-child(2)');
    //Pull the grammar text from the container
    const grammar = await page.evaluate((grammarContainer) => {
        //Get the grammar contents (Grammar container holds the grammar and other objects. So only grab the text of the first child)
        const grammar = grammarContainer.childNodes[0].textContent.trim();
        //Return
        return grammar;
    }, grammarContainer);
    //Split the grammar into front/back sides (separated by non-break space character)
    const grammarSplit = grammar.split('\u00a0');
    //Store front/back in an object
    const grammarCard = {
        front: grammarSplit[0].trim(),
        back: grammarSplit[1] ? grammarSplit[1].trim() : ''
    };
    //Return
    return grammarCard;
}