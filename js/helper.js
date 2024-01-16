import * as fs from 'fs';

export async function getIds(page, entriesSelector, entryIdField, idPrefixRegExText) {
    //Get ids
    const ids = await page.evaluate((entriesSelector, entryIdField, idPrefixRegExText) => {
        //Get id entries
        const entries = document.querySelectorAll(entriesSelector);
        //Loop and grab ids
        let ids = [];
        for (const entry of entries) {
            //Get prefixed id
            const prefixedId = entry[entryIdField];
            //Remove prefix
            const id = prefixedId.replace(new RegExp(idPrefixRegExText), "");
            //Add to list
            ids.push(id);
        }
        //Return
        return ids;
    }, entriesSelector, entryIdField, idPrefixRegExText);
    //Return
    return ids;
}

export async function saveDataToFile(data, filePath) {
    try {
        //Write data to file
        fs.writeFileSync(filePath, data);
        //Data saved
        return true;
    }
    catch (error) {
        //Error saving data to file
        console.error('Error saving data to file: ', error);
        //data not saved
        return false;
    }
}

// export async function injectJquery(page) {
//     try {
//         await page.addScriptTag({url: 'https://code.jquery.com/jquery-3.7.1.min.js'});
//     }
//     catch {
//         //Error injecting jQuery
//         console.error('Error injecting jQuery: ', error);
//         //jQuery not injected
//         return false;
//     }
// }

export async function saveHtmlToFile(page, filePath) {
    try {
        //Grab the page's HTML
        const html = await page.content();
        //Write HTML to file
        fs.writeFileSync(filePath, html);
    }
    catch (error) {
        //Error saving HTML
        console.error('Error saving HTML: ', error);
        //HTML not saved
        return false;
    }
}

export async function saveCookiesToFile(page, filePath) {
    try {
        //Grab the cookies from the page
        const cookies = await page.cookies();
        //Write cookies to file as JSON
        fs.writeFileSync(filePath, JSON.stringify(value = cookies, replacer = null, space = 2));
        //Cookies saved
        return true;
    }
    catch (error) {
        //Error saving cookies
        console.error('Error saving cookies: ', error);
        //Cookies not saved
        return false;
    }
}

export async function loadCookiesFromFile(page, filePath) {
    try {
        //Grab the cookies JSON
        const cookiesJson = fs.readFileSync(filePath);
        //Convert to cookies
        const cookies = JSON.parse(cookiesJson);
        //Set the cookies on the page
        await page.setCookie(...cookies);
        //Cookies set
        return true;
    }
    catch (error) {
        //Error loading cookies
        console.error('Error loading cookies: ', error);
        //Cookies not loaded
        return false;
    }
}

export async function getCookiesFromFile(filePath) {
    try {
        //Grab the cookies JSON
        const cookiesJson = fs.readFileSync(filePath);
        //Convert to cookies
        const cookies = JSON.parse(cookiesJson);
        //Return cookies
        return cookies;
    }
    catch (error) {
        //Error getting cookies
        console.error('Error getting cookies: ', error);
        //Cookies not retrieved
        return false;
    }
}