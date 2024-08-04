/*
 * This file and the BrickBuddy© logo are part of BrickBuddy©,
 * Copyright© 2023-present.
 *
 * BrickBuddy© is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * BrickBuddy© is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY.  
 * See the GNU General Public License for more details.
 *
 * To read the GNU General Public License, see 
 * <http://www.gnu.org/licenses/>.
 * 
 * For support, or to report a bug, write an email at
 * brickbuddyinfo@gmail.com
 */

const WL_KEY = 'wantedList'

class ServiceWantedList {

    /**
     * @returns {Promise<Array>}
     */
    static getWantedList = () => {
        const promise = toPromiseWL((resolve, reject) => {
            chrome.storage.local.get([WL_KEY], (result) => {
                if (chrome.runtime.lastError)
                    reject(chrome.runtime.lastError);
                const researches = result.wantedList ?? [];
                resolve(researches);
            });
        });
        return promise;
    }

    static readWantedList = async () => {
        const wantedList = await this.getWantedList();
        
        let html = await this.getHTML()
        let htmlString = html.result
        const parser = new DOMParser()
        const parsed = parser.parseFromString(htmlString, "text/html")
        const tableWLrows = parsed.getElementsByClassName("table-wl-edit")[0].childNodes

        //the first row is the header
        for (let row = 1; row < tableWLrows.length; row++) {
            let info = tableWLrows[row].childNodes[0].childNodes
            let mainData = this.getMainData(info)
            let blCode = mainData.blCode
            let blColorCode = mainData.blColorCode
            let partType = mainData.partType
            let description = info[2].children[0].textContent
            let color = info[2].children[3]?.textContent ? info[2].children[3].textContent.trim() : ""
            let wanted = parseInt(info[5].children[0].textContent.replace("Want:", "").trim())
            let owned = info[5].children[1].textContent.replace("Have:", "").trim()
            if (owned == "-") {
                owned = 0;
            } else {
                owned = parseInt(owned)
            }
            
            let item = {
                wanted: wanted,
                blCode: blCode,
                description: description,
                color: color,
                owned: owned,
                blColorCode: blColorCode,
                partType: partType
            }
            wantedList.push(item);
        }

        const promise = toPromiseWL((resolve, reject) => {
            chrome.storage.local.set({ [WL_KEY]: wantedList }, () => {          
                if (chrome.runtime.lastError)
                    reject(chrome.runtime.lastError);
                resolve(wantedList);
            });
        });
        return promise;
    }

    static clearWantedList = async () => {
        const promise = toPromiseWL((resolve, reject) => {
            chrome.storage.local.remove([WL_KEY], () => {
                if (chrome.runtime.lastError)
                    reject(chrome.runtime.lastError);
                resolve();
            });
        });
        return promise;
    }

    static getHTML = async () => {
        let [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true
        });
        let [html] = await chrome.scripting.executeScript({
            target: {tabId : tab.id},
            func: readHTML_WantedList,
        })
        return html
    }

    static getMainData(info) {
        let stringData = info[2].children[1].attributes.href.value
        stringData = stringData.substring(stringData.lastIndexOf("page?") + 5)

        let result = {}

        result.partType = stringData.substring(0,1)
        let colorIndex = stringData.indexOf("&C=")
        if (colorIndex > - 1) {
            result.blCode = stringData.substring(stringData.indexOf(result.partType + "=") + 2, colorIndex)
            result.blColorCode = stringData.substring(colorIndex + 3)
        } else {
            result.blCode = stringData.substring(stringData.indexOf(result.partType + "=") + 2)
        }
        return result
    }

    /*
    * Extract the part code from the <div> with the img url (if present) otherwise from the <div> with the part code, 
    * but there (in case of CMF), is missing the second id-number of the code.
    * For instance: Huey, Dewey and Louie are all "coldis2" in the part code <div>, instead of coldis2-3, coldis2-4, coldis2-5
    */
    // static getBlCode(info) {
    //     let imgUrl = info[1].children[0].attributes.src.value
    //     if (imgUrl.indexOf("no_image.png") == -1) {
    //         imgUrl = imgUrl.substring(imgUrl.lastIndexOf("/") + 1)
    //         return imgUrl.substring(0, imgUrl.indexOf("."))
    //     }
    //     return info[2].children[1].textContent
    // }
}

/**
 * Promisify a callback.
 * @param {Function} callback 
 * @returns {Promise}
 */
const toPromiseWL = (callback) => {
    const promise = new Promise((resolve, reject) => {
        try {
            callback(resolve, reject);
        }
        catch (err) {
            reject(err);
        }
    });
    return promise;
}

function readHTML_WantedList() {
    let html = document.body.innerHTML.toString()
    return html
}