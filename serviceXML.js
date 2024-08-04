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

class ServiceXML {

    static generateXML = async (DictionaryWL, CARTS) => {

        const XML = document.implementation.createDocument("BrickBuddy XML Bricklink Wanted List", "", null)
        const INVENTORY = XML.createElement("INVENTORY")

        DictionaryWL.forEach (function(item, key) {

            if (item.wanted > 0) {

                let itemQuantity = 0 + item.owned
                
                for (let shopIndex = 0; shopIndex < item.carts.length; shopIndex++) {
                    const SHOP = item.carts[shopIndex]
                    for (let lotIndex = 0; lotIndex < SHOP.length; lotIndex++) {
                        itemQuantity += SHOP[lotIndex].qty
                    }
                }

                if (item.wanted > itemQuantity) {
                    const ITEM = XML.createElement("ITEM")

                    const ITEMTYPE = XML.createElement("ITEMTYPE")
                    ITEMTYPE.innerHTML= item.partType
                    ITEM.appendChild(ITEMTYPE)

                    const ITEMID = XML.createElement("ITEMID")
                    ITEMID.innerHTML= JSON.parse(key).blCode
                    ITEM.appendChild(ITEMID)

                    if (item.blColorCode != undefined) {
                        const COLOR = XML.createElement("COLOR")
                        COLOR.innerHTML= item.blColorCode
                        ITEM.appendChild(COLOR)
                    }

                    const MAXPRICE = XML.createElement("MAXPRICE")
                    MAXPRICE.innerHTML="-1.0000"
                    ITEM.appendChild(MAXPRICE)

                    const MINQTY = XML.createElement("MINQTY")
                    MINQTY.innerHTML= item.wanted
                    ITEM.appendChild(MINQTY)
                                
                    if (itemQuantity > 0) {
                        const QTYFILLED = XML.createElement("QTYFILLED")
                        QTYFILLED.innerHTML= itemQuantity
                        ITEM.appendChild(QTYFILLED)
                    }

                    const CONDITION = XML.createElement("CONDITION")
                    CONDITION.innerHTML= "X"
                    ITEM.appendChild(CONDITION)
                    
                    const NOTIFY = XML.createElement("NOTIFY")
                    NOTIFY.innerHTML= "N"
                    ITEM.appendChild(NOTIFY)

                    INVENTORY.appendChild(ITEM)
                    
                }
            }
        })
        XML.appendChild(INVENTORY)
        return XML
    }
}