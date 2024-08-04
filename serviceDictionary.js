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

class ServiceDictionary {

    static createDictionaryWL = async (WL, CARTS) => {
        const STORES = this.createStores(CARTS)
        const DICTIONARY_WL = new Map()
        WL.forEach(lot => {
            const KEY = JSON.stringify({
                blCode: lot.blCode, 
                color: lot.color
            })
            let value = DICTIONARY_WL.get(KEY)
            if (value != undefined) {
                value.wanted += lot.wanted
            } else {
                value = {
                    wanted: lot.wanted,
                    description: lot.description,
                    owned: lot.owned,
                    carts: STORES,
                    blColorCode: lot.blColorCode,
                    partType: lot.partType
                }
            }
            DICTIONARY_WL.set(KEY, value)
        })
        // Old version, didn't allow merging two or more WL
        // WL.forEach(lot => {
        //     DICTIONARY_WL.set(
        //         JSON.stringify({
        //             blCode: lot.blCode, 
        //             color: lot.color
        //         }), 
        //         {
        //             wanted: lot.wanted,
        //             description: lot.description,
        //             owned: lot.owned,
        //             carts: STORES
        //         }
        //     )}
        // )
        return DICTIONARY_WL
    }

    static createDictionaryCarts = async (DICTIONARY_WL, CARTS) => {  
        for (let cartIndex = 0; cartIndex < CARTS.length; cartIndex++) {
            const cart = CARTS[cartIndex]
            cart.items.forEach(item => {
                
                const KEY = JSON.stringify({
                    blCode: item.blCode,
                    color: item.color
                })
                let VALUE = DICTIONARY_WL.get(KEY)

                const SINGLE_STORE = {
                    qty: item.qty,
                    ppu: item.ppu,
                    condition: item.condition
                }

                // If it's an extra lot not belonging to the WL
                if (VALUE == undefined) {
                    const STORES = this.createStores(CARTS)
                    
                    // Check if there is a part with the same blCode and color = "Not Applicable" in the WL
                    const NEW_KEY = JSON.stringify({
                        blCode: item.blCode,
                        color: "(Not Applicable)"
                    })
                    const NOT_APPLICABLE = DICTIONARY_WL.get(NEW_KEY)
                    if (NOT_APPLICABLE != undefined) {
                        const NA_STORE = {
                            qty: item.qty,
                            ppu: item.ppu,
                            condition: item.condition,
                            altColor: item.color
                        }
                        STORES[cartIndex].push(SINGLE_STORE)
                        const toJSON = JSON.stringify(NOT_APPLICABLE);
                        const toObject = JSON.parse(toJSON)
                        toObject.carts[cartIndex].push(NA_STORE)
                        DICTIONARY_WL.set(NEW_KEY, toObject)
                    } 
                    // If it's a regular part not included in the WL
                    else {
                        STORES[cartIndex].push(SINGLE_STORE)
                        VALUE = {
                            wanted: 0, 
                            description: item.description, 
                            owned: 0,
                            carts: STORES
                        }
                        DICTIONARY_WL.set(KEY, VALUE)
                    }
                }   
                // Otherwise, if it is a lot included in the WL (or one that wasn't, but you already add one of it with different condition)
                else {
                    const toJSON = JSON.stringify(VALUE);
                    const toObject = JSON.parse(toJSON)
                    toObject.carts[cartIndex].push(SINGLE_STORE)
                    DICTIONARY_WL.set(KEY, toObject)
                }
            })
        }
        return DICTIONARY_WL
    }

    static createStores(CARTS) {
        const STORES = []
        for (let i = 0; i < CARTS.length; i++)
            STORES.push([])
        return STORES
    }
}