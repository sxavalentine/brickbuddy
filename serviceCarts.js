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
 * See the GNU General Public License for more details at
 * <http://www.gnu.org/licenses/>.
 * 
 * For support, or to report a bug, write an email at
 * brickbuddyinfo@gmail.com
 */

const CARTS_KEY = 'carts'

class ServiceCarts {

    /**
     * @returns {Promise<Array>}
     */
    static getCarts = () => {
        const promise = toPromiseCarts((resolve, reject) => {
            chrome.storage.local.get([CARTS_KEY], (result) => {
                if (chrome.runtime.lastError)
                    reject(chrome.runtime.lastError);
                const researches = result.carts ?? [];
                resolve(researches);
            });
        });
        return promise;
    }

    static readCart = async () => {
        const carts = await this.getCarts();
        
        let html = await this.getHTML()
        let htmlString = html.result

        const parser = new DOMParser()
        const parsedHTML = parser.parseFromString(htmlString, "text/html")
        const cartItems = parsedHTML.getElementsByClassName("flex-table__row--with-hover")

        const items = [] 
        for (let row = 0; row < cartItems.length; row++) {
            let info = cartItems[row].childNodes[0].childNodes[1].childNodes

            let description = info[2].children[0].children[0].textContent
            let blCode = this.getBlCode(info)
            let color = info[2].children[0].children[1].children[1].textContent.trim()
            if (color.toUpperCase().indexOf("NOT APPLICABLE") > -1) color = ""
            let condition = info[2].children[0].children[1].children[2].textContent
            let ppu = parseFloat(this.getPPU(info))
            let qty = parseInt(this.getCartQty(info))
            
            let item = {
                blCode: blCode,
                description: description,
                color: color,
                condition: condition,
                ppu: ppu,
                qty: qty
            }
            items.push(item)
        }
        let storeInfo = this.getStoreInfo(parsedHTML)

        // If we already had some items loaded from this store, we add the new items to it, otherwise we create a new cart
        let isNewCart = true
        for (let cartIndex = 0; cartIndex < carts.length; cartIndex++) {
            if (carts[cartIndex].storeName == storeInfo.storeName) {
                let concatCart = carts[cartIndex].items.concat(items)
                carts[cartIndex].items = concatCart
                isNewCart = false
                break
            }
        }
        if (isNewCart) {
            let cart = {
                storeName: storeInfo.storeName,
                storeFeedback: storeInfo.storeFeedback,
                storeCountry: storeInfo.storeCountry,
                cartTotal: this.getStoreTotal(parsedHTML),
                items: items
            }
            carts.push(cart)    
        }

        const promise = toPromiseCarts((resolve, reject) => {
            chrome.storage.local.set({ [CARTS_KEY]: carts }, () => {          
                if (chrome.runtime.lastError)
                    reject(chrome.runtime.lastError);
                resolve(carts);
            });
        });
        return promise;
    }

    static clearSingleCart = async (index) => {
        const carts = await this.getCarts();
        const cart = carts[index]
        carts.splice(index, 1)
        const promise = toPromiseCarts((resolve, reject) => {
            chrome.storage.local.set({ [CARTS_KEY]: carts }, () => {          
                if (chrome.runtime.lastError)
                    reject(chrome.runtime.lastError);
                resolve(carts);
            });
        });
    }

    static clearAllCarts = async () => {
        const promise = toPromiseCarts((resolve, reject) => {
            chrome.storage.local.remove([CARTS_KEY], () => {
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
            func: readHTML_Cart,
        })
        return html
    }

    /*
    * Extract the part code from the <div> with the img url (if present) otherwise from the <div> with the part code, 
    * but there (in case of CMF), is missing the second id-number of the code.
    * For instance: Huey, Dewey and Louie are all "coldis2" in the part code <div>, instead of coldis2-3, coldis2-4, coldis2-5
    */
    static getBlCode(info) {
        let imgUrl = info[1].children[0].attributes.src.value
        if (imgUrl.indexOf("no_image.png") == -1) {
            imgUrl = imgUrl.substring(imgUrl.lastIndexOf("/") + 1)
            return imgUrl.substring(0, imgUrl.indexOf("."))
        }
        return info[2].children[0].children[1].children[0].textContent
    }

    /* In case of foreign currencies and/or discounted prices*/
    static getPPU(info) {
        let PPU = 0
        try {
            let divPPU = info[3].children[0]
            // We iterate the different child, and we keep only the ones without the strike class (used for the price before the discount)
            let noStrikeChildren = []
            for (let childIndex = 0; childIndex < divPPU.children.length; childIndex++) {
                if (divPPU.children[childIndex].firstChild.classList == undefined || !divPPU.children[childIndex].firstChild.classList.contains("strike")) {
                    noStrikeChildren.push(divPPU.children[childIndex])
                }
            }
            // If we still have more than one child, the first one is in foreign currency, the second one is gonna be the one with our currency (the data we want)
            if (noStrikeChildren.length > 1)
                PPU = divPPU.children[1].textContent.substring(noStrikeChildren[1].textContent.indexOf(" ") + 1)
            else
                PPU = noStrikeChildren[0].textContent.substring(noStrikeChildren[0].textContent.indexOf(" ") + 1)
            //remove the dollar simbol, that is attached to the PPU (check if other currencies do the same)
            PPU.replace('\$', '')
        } catch (error) {
            console.log("Error retrieving Price Per Unit of " + info + ".")
            console.log(error.message)
        }
        return PPU
    }

    static getStoreInfo(parsedHTML) {
        const storeInfo = {}
        const infoHeader = parsedHTML.getElementsByTagName('header')[3]
        storeInfo.storeName = infoHeader.children[0].children[0].textContent
        storeInfo.storeFeedback = infoHeader.children[0].children[1].textContent
        storeInfo.storeCountry = infoHeader.children[1].children[0].textContent.replace('""', "")
        return storeInfo
    }

    static getCartQty(info) {
        return info[4].children[0].children[0].children[1].value
    }

    static getStoreTotal(parsedHTML) {
        return parsedHTML.getElementsByClassName('text-color--primaryGreen')[0].textContent
    }
}

/**
 * Promisify a callback.
 * @param {Function} callback 
 * @returns {Promise}
 */
const toPromiseCarts = (callback) => {
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

function readHTML_Cart() {
    let html = document.body.innerHTML.toString()
    return html
}