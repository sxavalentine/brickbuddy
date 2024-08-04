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

document.addEventListener('DOMContentLoaded', async () => {
    
    await getPageReady()

    /* WANTED LIST BUTTONS */
    const WL_readBtn = document.getElementById('WL_readBtn')
    WL_readBtn.onclick = async () => {
        try {
            await ServiceWantedList.readWantedList()
            await displayWL()
            const CARTS = await ServiceCarts.getCarts()
            alert("Wanted List items loaded")
            populateInfoBox(CARTS.length == 0 ? INFO_WLDONE : INFO_READY)
        } catch (error) {
            populateInfoBox(INFO_ERROR + "<br>READ WL<br>" + error.message)
        }
    }

    const WL_clearBtn = document.getElementById('WL_clearBtn');
    WL_clearBtn.onclick = async () => {
        try{
            await ServiceWantedList.clearWantedList()
            await displayWL()
            const CARTS = await ServiceCarts.getCarts()
            populateInfoBox(CARTS.length == 0 ? INFO_START : INFO_NOWL)
        } catch (error) {
            populateInfoBox(INFO_ERROR + "<br>CLEAR WL<br>" + error.message)
        }
    }

    /* CARTS BUTTONS */
    const Carts_readBtn = document.getElementById('Carts_readBtn')
    Carts_readBtn.onclick = async () => {
        try {
            await ServiceCarts.readCart()
            await displayCarts()
            const WL = await ServiceWantedList.getWantedList()
            alert("Cart items loaded")
            populateInfoBox(WL.length == 0 ? INFO_NOWL : INFO_READY)
        } catch (error) {
            populateInfoBox(INFO_ERROR + "<br>READ CART<br>" + error.message)
        }
    }

    const Carts_clearAllBtn = document.getElementById('Carts_clearAllBtn')
    Carts_clearAllBtn.onclick = async () => {
        try {
            await ServiceCarts.clearAllCarts()
            const WL = await ServiceWantedList.getWantedList()
            populateInfoBox(WL.length == 0 ? INFO_START : INFO_WLDONE)
            await displayCarts()
        } catch (error) {
            populateInfoBox(INFO_ERROR + "<br>CLEAR ALL CARTS<br>" + error.message)
        }
    }

    /* EXCEL BUTTON */
    const EXCEL_BTN = document.getElementById('excelButton')
    EXCEL_BTN.onclick = async () => {
        try {
            const CARTS = await ServiceCarts.getCarts()
            const WL = await ServiceWantedList.getWantedList()
            if (WL.length == 0 || CARTS.length == 0) {
                populateInfoBox(INFO_OUTPUT)
            } else {
                const ExcelJS = getExcelJS()
                let  workbook = new ExcelJS.Workbook();

                let DictionaryWL = await ServiceDictionary.createDictionaryWL(WL, CARTS)
                DictionaryWL = await ServiceDictionary.createDictionaryCarts(DictionaryWL, CARTS)
                await ServiceExcel.generateExcel(workbook, DictionaryWL, CARTS)

                const FileSaver = getFileSaver()
                const buffer = await workbook.xlsx.writeBuffer()
                FileSaver.saveAs(new Blob([buffer]), "BrickBuddy Wanted List.xlsx")
                populateInfoBox(EXCEL_DONE)
            }
        } catch (error) {
            populateInfoBox(INFO_ERROR + "<br>GENERATE EXCEL<br>" + error.message)
        }
    }

    /* XML BUTTON */
    const XML_BUTTON = document.getElementById('xmlButton')
    XML_BUTTON.onclick = async () => {
        try {
            const CARTS = await ServiceCarts.getCarts()
            const WL = await ServiceWantedList.getWantedList()
            if (WL.length == 0 || CARTS.length == 0) {
                populateInfoBox(INFO_OUTPUT)
            } else {
                let DictionaryWL = await ServiceDictionary.createDictionaryWL(WL, CARTS)
                DictionaryWL = await ServiceDictionary.createDictionaryCarts(DictionaryWL, CARTS)
                const XML = await ServiceXML.generateXML(DictionaryWL, CARTS)
                let stringXML = new XMLSerializer().serializeToString(XML);
                navigator.clipboard.writeText(stringXML)
                populateInfoBox(XML_DONE)
            }
        } catch (error) {
            populateInfoBox(INFO_ERROR + "<br>GENERATE XML<br>" + error.message)
        }
    }

})

const displayWL = async () => {
    const wantedList = await ServiceWantedList.getWantedList()
    const WLsize = wantedList.length
    const WL_Counter = document.getElementById('WL_Counter')
    const WL_table = document.getElementById('WL_table')
    const WL_clearBtn = document.getElementById('WL_clearBtn')
    clearWLTable()
    if (WLsize > 0) {
        const WL_tbody = document.getElementById('WL_tbody')
        wantedList.forEach(wantedItem => {
            const WL_row = document.createElement('tr')
            WL_tbody.appendChild(WL_row)

            const WL_td_description = document.createElement('td')
            WL_td_description.innerText = wantedItem.description
            WL_row.appendChild(WL_td_description)
            
            const WL_td_wanted = document.createElement('td')
            WL_td_wanted.innerText = wantedItem.wanted
            WL_row.appendChild(WL_td_wanted)

            const WL_td_blCode = document.createElement('td')
            WL_td_blCode.innerText = wantedItem.blCode
            WL_row.appendChild(WL_td_blCode)

            const WL_td_color = document.createElement('td')
            WL_td_color.innerText = wantedItem.color
            WL_row.appendChild(WL_td_color)

            const WL_td_owned = document.createElement('td')
            WL_td_owned.innerText = wantedItem.owned
            WL_row.appendChild(WL_td_owned)
        })
        WL_table.removeAttribute("hidden")
        WL_clearBtn.removeAttribute("hidden")
        populateInfoBox(INFO_WLDONE)
    } else {
        WL_table.setAttribute("hidden", "true")
        WL_clearBtn.setAttribute("hidden", "true")
        populateInfoBox(INFO_START)
    }
    if (WLsize == 0) {
        WL_Counter.innerHTML = "Visit a Wanted List page on Bricklink, then click <b>Read Wanted List</b> to load the data"
    } else {
        let pluralOrNot = WLsize == 1 ? "element" : "elements"
        WL_Counter.innerHTML = "Loaded " + WLsize + " " + pluralOrNot + " from your Wanted List(s)"
    }
    return wantedList
}

const displayCarts = async () => {
    const carts = await ServiceCarts.getCarts()
    const Carts_Counter = document.getElementById('Carts_Counter')
    const Carts_table = document.getElementById('Carts_table')
    const Carts_clearAllBtn = document.getElementById('Carts_clearAllBtn')
    clearCartsTable()

    if (carts.length > 0) {
        const Carts_tbody = document.getElementById('Carts_tbody')
        for (let index = 0; index < carts.length; index++) {
            const cart = carts[index]
            const Cart_row = document.createElement('tr')
            Carts_tbody.appendChild(Cart_row)

            const cart_td_store = document.createElement('td')
            cart_td_store.innerText = cart.storeName
            Cart_row.appendChild(cart_td_store);

            const cart_td_feedback = document.createElement('td')
            cart_td_feedback.innerText = cart.storeFeedback
            Cart_row.appendChild(cart_td_feedback);

            const cart_td_country = document.createElement('td')
            cart_td_country.innerText = cart.storeCountry
            Cart_row.appendChild(cart_td_country);
            
            const cart_td_lots = document.createElement('td')
            cart_td_lots.innerText = cart.items.length
            Cart_row.appendChild(cart_td_lots);

            const cart_td_total = document.createElement('td')
            cart_td_total.innerText = cart.cartTotal
            Cart_row.appendChild(cart_td_total);

            const cart_td_DelBtn = document.createElement('td')
            cart_td_DelBtn.innerHTML = '<button style="background-color: red"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">' + 
            '<path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z"/>' +
            '<path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z"/>' +
            '</svg></button>'
            cart_td_DelBtn.onclick = async () => {
                try {
                    await ServiceCarts.clearSingleCart(index)
                    displayCarts()
                    const CARTS = await ServiceCarts.getCarts()
                    if (CARTS.length == 0) populateInfoBox(INFO_WLDONE)
                } catch (error) {
                    populateInfoBox(INFO_ERROR + " CLEAR CART<br>" + error.message)
                }
            }
            Cart_row.appendChild(cart_td_DelBtn)
        }
        Carts_table.removeAttribute("hidden")
        Carts_clearAllBtn.removeAttribute("hidden")
    } else {
        Carts_table.setAttribute("hidden", "true")
        Carts_clearAllBtn.setAttribute("hidden", "true")
    }
    Carts_Counter.innerHTML = getCartsCounter(carts)
    return carts
}

async function getPageReady() {
    const WL = await displayWL()
    const CARTS = await displayCarts()
    if (WL.length == 0) {
        if (CARTS.length == 0) {
            populateInfoBox(INFO_START)
        } else {
            populateInfoBox(INFO_NOWL)
        }
    } else {
        if (CARTS.length == 0) {
            populateInfoBox(INFO_WLDONE)
        } else {
            populateInfoBox(INFO_READY)
        }
    } 

}

function clearWLTable() {
    const WL_tbody = document.getElementById("WL_tbody")
    while (WL_tbody.children.length > 1) {
        WL_tbody.lastChild.remove()
    }
}

function clearCartsTable() {
    const Carts_tbody = document.getElementById("Carts_tbody")
    while (Carts_tbody.children.length > 1) {
        Carts_tbody.lastChild.remove()
    }
}

function getCartsCounter(carts) {
    if (carts.length == 0) {
        return "Visit a Cart page on Bricklink, then click <b>Read Cart List</b> to load the data"
    } else {
        let lotCount = 0;
        carts.forEach(
            cart => cart.items.forEach(item => {
                lotCount ++
            })
        )
        let pluralLot = lotCount == 1 ? " lot " : " lots "
        let pluralCarts = carts.length == 1 ? " cart" : " carts" 
        return "Loaded " + lotCount + pluralLot + "from " + carts.length + pluralCarts
    } 
}

function populateInfoBox(message) {
    const infobox = document.getElementById("help")
    infobox.innerHTML = message
}

function getExcelJS() {
    return require('exceljs/dist/es5/exceljs.browser')
}

function getFileSaver() {
    return require('file-saver')
}

const INFO_START =  "Hi, I'm BrickBuddy©, your Bricklink little helper.<br>" +
                    "To start, go to your Wanted List page on Bricklink, then click the <b>Read Wanted List</b> button.<br>" +
                    "Remember: you need to click it for <b>EVERY SINGLE PAGE</b> of your Wanted List(s)<br>" +
                    "While changing page this window will close, but don't worry, I will keep track of the elements you loaded."
                
const INFO_WLDONE = "Great, Wanted List items loaded!<br>" +
                    "If you don't have any more WL items to load, let's go to your Bricklink Cart page(s).<br>" + 
                    "Once there, click <b>Read Cart List</b>.<br>" +
                    "You need to do it for <b>EVERY SINGLE CART</b> you want me to check.<br>" + 
                    "While changing page this window will close, but don't worry, I will keep track of the elements you loaded."

const INFO_READY =  "Awesome! Wanted List and cart(s) are both loaded.<br>" +
                    "If you are done loading data, click the green buttons to produce outputs.<br>" +
                    "If you still have Wanted Lists or Carts to load, go ahead!<br>" + 
                    "I will wait for you here ;)"

const INFO_NOWL =   "The carts are loaded, but the Wanted List is still missing.</br>" +
                    "I can't work without one, so visit your Wanted List page on Bricklink and click <b>Read Wanted List</b>.<br>" +
                    "Remember: you need to click it for <b>EVERY SINGLE PAGE</b> of your Wanted List(s) <br>" +
                    "While changing page this window will close, but don't worry, I will keep track of the elements you loaded."

const INFO_OUTPUT = "Hold on, not so fast!<br>" + 
                    "In order to generate outputs I need to collect data from at least one Wanted List and one cart.<br>" +
                    "Try again once you've loaded data from <b>BOTH</b>."

const EXCEL_DONE =  "See how BrickBuddy© makes everything easier?<br>" + 
                    "No more time wasted on manually double check your Bricklink orders.<br>" +
                    "You can send a small tip with the <b>PayPal button</b> below to show your appreciation.<br>" +
                    "If not... no harsh feelings. Glad to have been of some help ^^"

const XML_DONE =    "I generated a new XML string with the items that didn't reach the quantity needed.<br>" +
                    "It's already copied in your clipboard, go to Bricklink and paste it in the 'Upload Bricklink XML format' section.<br>" +
                    "It will generate a new Wanted List with the items you still need to buy.<br>" +
                    "Super easy, isn't it? :D"

const INFO_ERROR =  "Uh-oh! Seems something went wrong :( <br>"+
                    "Please <a href='mailto:brickbuddyinfo@gmail.com'>contact our support center</a> with a screenshot of this page so that we can investigate.<br>" +
                    "This way you will contribute in making BrickBuddy© better and better ;) <br>"