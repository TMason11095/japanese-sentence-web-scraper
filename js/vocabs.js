import * as helper from './helper.js';

export async function getAllNonJlptVocabDetailFromBrowser(browser, cookies){
    return await helper.getAllSubPagesData(
        browser,
        cookies,
        "https://www.kanshudo.com/collections/vocab_usefulness2021",
        async (page) => {
            return await page.evaluate(() => {
                //Get all the url containers
                const urlContainers = document.querySelectorAll('#main-content .bodyarea .bodysection .infopanel .coll2 .coll2_div a');
                //Return all the urls
                return Array.from(urlContainers).map((container) => container.href);
            });
        },
        3,
        (vocabUrls, limit) => {
            //Get promises for the vocab pages
            return vocabUrls.map((vocabUrl) => {
                return limit(() => getVocabDetailFromBrowser(browser, vocabUrl, cookies, true));
            });
        },
        "N0"
    );
}

export async function getAllJlptVocabs(browser, cookies, nLevel) {
    return await helper.getAllSubPagesData(
        browser,
        cookies,
        "https://www.kanshudo.com/collections/wikipedia_jlpt",
        async (page) => {
            return await page.evaluate((nLevel) => {
                //Get JLPT level header (Only one instance per level so grab the first element of the array after filtering)
                const nLevelHeader = Array.from(document.querySelectorAll('#main-content .bodyarea .bodysection .infopanel h4')).filter(h4 => h4.textContent.includes(nLevel))[0];
                //Get the URLs for each 100 vocab sections
                const vocabSectionUrls = Array.from(nLevelHeader.nextElementSibling.querySelectorAll('.coll_div a')).map((vocab) => vocab.href);
                //Return
                return vocabSectionUrls;
            }, nLevel);
        },
        3,
        (vocabUrls, limit) => {
            //Get promises for the vocab pages
            return vocabUrls.map((vocabUrl) => {
                return limit(() => getVocabDetailFromBrowser(browser, vocabUrl, cookies));
            });
        },
        nLevel
    );
}

export async function getVocabDetailFromBrowser(browser, vocabUrl, cookies, ignoreJlpt = false) {
    //Open new page
    const page = await browser.newPage();
    try {
        //Load cookies
        await page.setCookie(...cookies);
        //Get the vocab
        const vocabPageObj = await getVocabDetail(page, vocabUrl, ignoreJlpt);
        //Return
        return vocabPageObj;
    } catch {
        console.error('Error in getVocabDetailFromBrowser():', error);
        return false;
    } finally {
        //Close the page
        page.close();
    }
}

export async function getVocabPageFromBrowser(browser, vocabUrlSuffix, cookies) {
    //Open new page
    const page = await browser.newPage();
    try {
        //Load cookies
        await page.setCookie(...cookies);
        //Get the vocab
        const vocabPageObj = await getVocabPage(page, vocabUrlSuffix);
        //Return
        return vocabPageObj;
    } catch {
        console.error('Error in getVocabPageFromBrowser():', error);
        return false;
    } finally {
        //Close the page
        page.close();
    }
}

async function loadEvaluateLocalFunctions(page) {
    await page.evaluate(() => {
    //getVocabFront(vocabContainer)
        window.getVocabFront = (vocabContainer) => {
            //Get the front container
            const frontContainer = vocabContainer.querySelector('div .jukugo a');
            //Loop through the front nodes (can have kanji components that need to be grouped) and build the vocab front entry
            let vocabFront = [];
            for (const frontNode of frontContainer.childNodes) {
                //Check the node type
                switch (frontNode.nodeType) {
                    case Node.ELEMENT_NODE: //Kanji with furigana
                        //Set kanji bool
                        hasKanji = true;
                        //Add to vocab
                        vocabFront.push({
                            kanji: frontNode.querySelector('.f_kanji').textContent,
                            furigana: frontNode.querySelector('.furigana').textContent
                        });
                        break;
                    case Node.TEXT_NODE: //Hiragana
                        //Add to vocab
                        vocabFront.push(frontNode.textContent);
                        break;
                }
            }
            //Return
            return vocabFront;
        }

    //getVocabBack(vocabContainer)
        window.getVocabBack = (vocabContainer) => {
            //Get the back container
            const backContainer = vocabContainer.querySelector('.jukugo_reading div');
            //Get the type and definition
            let vocabType;
            const vocabDefinitions = [];
            //Check if there's no vm class object in the container
            if (vocabContainer.querySelector('.vm') == null) {
                //No type given and the definition is just the container's text content
                vocabType = "";
                vocabDefinitions.push(backContainer.textContent.trim());
            }
            else {
                //Grab the vocab type
                vocabType = backContainer.querySelector('.vm div span').textContent.trim();
                //Grab the vocab definition containers
                const vocabDefContainers = backContainer.querySelectorAll('.vm ');
                //Grab the definitions from each container
                for (const vocabDefContainer of vocabDefContainers) {
                    //Grab the definition from the text child node
                    for (const node of vocabDefContainer.childNodes) {
                        //Skip if not a text node
                        if (node.nodeType != Node.TEXT_NODE) { continue; }
                        //Grab the definition
                        vocabDefinitions.push(node.textContent.trim());
                    }
                }
            }
            
            //Return
            return {
                type: vocabType,
                definitions: vocabDefinitions
            };
        }
    });
}

async function getVocabDetail(page, vocabUrl, ignoreJlpt = false) {
    //Get vocab
    try {
        //Navigate to vocab list page
        await page.goto(vocabUrl);
        //Load local functions to use withing page.evaluate()
        await loadEvaluateLocalFunctions(page);
        //Get vocab page components
        let [vocabPageTitle, vocabContainers] = await Promise.all([getVocabPageTitle(page), getVocabContainers(page)]);
        //Check if we need to filter out the JLPT entries
        if (ignoreJlpt) {
            //Only grab containers that don't have the JLPT element
            let filteredContainers = await Promise.all(
                vocabContainers.map(async container => {
                    if (!await container.$('.jlpt_container')){
                        return container;
                    };
                })
            );
            filteredContainers = filteredContainers.filter(container => {
                return container != undefined;
            })
            //Set the new filtered vocab containers
            vocabContainers = filteredContainers;
        }
        //Get vocab
        const vocabs = await getVocabs(page, vocabContainers);
        //const vocabs = await Promise.all()

        //Return
        return {
            title: vocabPageTitle,
            vocabs: vocabs
        };
    } catch (error) {
        console.error('Error in getVocabDetail():', error);
        return false;
    }
}

async function getVocabPage(page, vocabUrlSuffix) {
    //Base url
    const baseUrl = 'https://www.kanshudo.com/collections/wikipedia_jlpt/';
    //Build the url
    const vocabUrl = baseUrl + vocabUrlSuffix;
    //Return vocab
    return getVocabDetail(page, vocabUrl);
}

async function getVocab(page, vocabContainer) {
    return await page.evaluate((vocabContainer) => {
        //Get vocab id
        const id = vocabContainer.id.replace(/^(jr_inner_)/, '');
        //Get the japanese vocab (front)
        const vocabFront = getVocabFront(vocabContainer);
        //Get the english translation (back)
        const vocabBack = getVocabBack(vocabContainer);
        //Return
        return {
            id: id,
            type: vocabBack.type,
            front: vocabFront,
            back: vocabBack.definitions
        };
    }, vocabContainer);
}

async function getVocabs(page, vocabContainers) {
    //Map the containers to getVocab() promises
    const vocabPromises = vocabContainers.map(async (vocabContainer) => {
        //Get the vocab
        const vocab = await getVocab(page, vocabContainer);
        //Return
        return vocab;
    });
    //Process the results
    try {
        const vocabs = await Promise.all(vocabPromises);
        //Add list to object
        //const vocabsObj = { vocabs: vocabs };
        //Return
        return vocabs;
    } catch (error) {
        console.error('Error in getVocabs():', error);
        return false;
    }
}

async function getVocabContainers(page) {
    //Return vocab containers
    return await page.$$('#main-content .bodyarea .bodysection .spaced .jukugorow .jr_inner');
}

async function getVocabPageTitle(page) {
    //Return the title
    return await page.evaluate(() => { return document.querySelector('#main-content .bodyarea .bodysection h4').textContent.trim(); })
}