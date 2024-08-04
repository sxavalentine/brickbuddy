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

class ServiceExcel {

    static generateExcel = async (workbook, DictionaryWL, CARTS) => {
        const shopsCount = DictionaryWL.entries().next().value[1].carts.length
        const storeInfo = []

        // Initiate the workbook
        workbook.creator = "BrickBuddy Chrome Extension"
        workbook.created = new Date()
        workbook.description = "Excel file with table of the coverage of your Bricklink Wanted List"
        workbook.title = "BrickBuddy Chrome Extension output"
        workbook.company = "BrickBuddy"

        const LIGHT_BLUE = "C2DBF7"
        const LIGHT_PINK = "E3ABEC"
        const YELLOW = "FFE654"
        const LIGHT_GREEN = "9DF0C0"
        const DARK_GREEN = "3CBA4C"
        const LIGHT_YELLOW = "FFF099"
        const LIGHT_RED = "F58B69"
        const RED = "FF0000"
        
        const worksheet = workbook.addWorksheet('Wanted List')

        // Update these values if you change the structure of the table
        const HEADER_INDEX = 0
        const BEGIN_OF_STORES_INDEX = 7
        const TOTAL_INDEX = 5
        const MISSING_INDEX = TOTAL_INDEX + 1

        // Force workbook calculation on load
        workbook.calcProperties.fullCalcOnLoad = true
        
        // Freeze columns (x) and rows (y)
        worksheet.views = [{state: 'frozen', xSplit: 3, ySplit: HEADER_INDEX+1}]

        // Set the text and key for the fixed headers
        const HEADERS = ["Wanted", "Description", "Color", "BL Code", "Owned", "Total", "Missing"]
        const COL_KEYS = ["wanted", "description", "color", "blCode", "owned", "total", "missing"]
        
        // Add the text and key for the N possible stores of the table
        for (let i = 0; i < shopsCount; i++) {
            HEADERS.push("Quantity")
            HEADERS.push("Price per unit")
            COL_KEYS.push("qty"+i)
            COL_KEYS.push("ppu"+i)
        }

        // Add the headers to the table
        const COLUMNS = []
        for (let i=0; i< HEADERS.length; i++) {
            COLUMNS.push({
                header: 
                    HEADERS[i], 
                    key: COL_KEYS[i], 
                    widh: 20
                })
        }
        worksheet.columns = COLUMNS

        // Add the tooltip with store info inside the store headers
        const HEADER_ROW = worksheet._rows[0]
        let storeCount = 0
        let pairCount = 0
        for (let i = 0; i < HEADER_ROW._cells.length - BEGIN_OF_STORES_INDEX; i++) {
            let cart = CARTS[storeCount]
            let cell = HEADER_ROW._cells[BEGIN_OF_STORES_INDEX + i]
            cell.note = cart.storeName + "\n" + cart.storeCountry + "\n" +"Total: " + cart.cartTotal + "\n" + "Feedback " + cart.storeFeedback
            pairCount++
            if (pairCount == 2) {
                storeCount++
                pairCount = 0
            }
        }

        // Find which are the N possible columns related to the stores and create couples (qty, ppu)
        const STORES_COLUMNS = []
        for (let i = 0; i < shopsCount; i++) {
            let store = []
            store.push("qty"+i)
            store.push("ppu"+i)
            STORES_COLUMNS.push(store)
        }

        // Memorize the letters of the cells that need to include a comment (used parts or not applicable colors)
        const COMMENTS = []

        // Memorize the letters of the stores columns (for formulas)
        const STORES_QTY = []
        const STORES_PPU = []
        let isQty = true;
        for (let colIndex = BEGIN_OF_STORES_INDEX; colIndex < worksheet._columns.length; colIndex++) {
            if (isQty) {
                STORES_QTY.push(worksheet._columns[colIndex].letter)
            } else {
                STORES_PPU.push(worksheet._columns[colIndex].letter)
            }
            isQty = !isQty
        }

        // const AUTOFILTER = 'A1:' + STORES_PPU[STORES_PPU.length -1]
        // worksheet.autoFilter = AUTOFILTER

        // Add the rows of the table
        let rowIndex = HEADER_INDEX + 1
        DictionaryWL.forEach (function(item, key) {

            const KEY_OBJECT = JSON.parse(key)
            const entryCopy = {
                "wanted": item.wanted, 
                "description": item.description,
                "color": KEY_OBJECT.color, 
                "blCode": KEY_OBJECT.blCode,
                "owned": item.owned,
                "total": 0,
                "missing": 0
            }
            for (let shopIndex = 0; shopIndex < shopsCount; shopIndex++) {

                let isUsedComment = false
                let altColorComment = ServiceExcel.isAltColor(item)
                let countUsed = 0
                let usedPPU = 0

                if (item.carts[shopIndex].length > 0) {
                    if (item.carts[shopIndex].length == 1) {
                        entryCopy[STORES_COLUMNS[shopIndex][0]] = item.carts[shopIndex][0].qty
                        entryCopy[STORES_COLUMNS[shopIndex][1]] = item.carts[shopIndex][0].ppu
                    }
                    // If there are two of the same items (New and Used...but some stores have more articles for the same item)
                    else {
                        let countNew = 0
                        let newPPU = 0

                        for (let lotIndex = 0; lotIndex < item.carts[shopIndex].length; lotIndex++) {
                            let lot = item.carts[shopIndex][lotIndex]
                            if (lot.condition == "New") {
                                countNew += lot.qty
                                newPPU = lot.ppu
                            }
                            else {
                                countUsed += lot.qty
                                usedPPU = lot.ppu
                                isUsedComment = true
                            }
                        }
                        entryCopy[STORES_COLUMNS[shopIndex][0]] = countNew + countUsed
                        entryCopy[STORES_COLUMNS[shopIndex][1]] = newPPU
                    }
                } else {
                    entryCopy[STORES_COLUMNS[shopIndex][0]] = 0
                    entryCopy[STORES_COLUMNS[shopIndex][1]] = 0
                }
                // Keep track of the comments to add later
                if (isUsedComment || altColorComment) {
                    let comment = {
                        row: rowIndex,
                        col: BEGIN_OF_STORES_INDEX + (shopIndex * 2)
                    }
                    if (isUsedComment) comment.used = countUsed + "x used at " + usedPPU
                    if (altColorComment) {
                        let c = ""
                        const ALT_CART = item.carts[shopIndex]
                        for (let alt = 0; alt < ALT_CART.length; alt++) {
                            const LOT = ALT_CART[alt]
                            c += LOT.qty + "x " + (LOT.condition == "Used" ? "Used " : "") + LOT.altColor + " at " + LOT.ppu + "\n"
                        }
                        comment.altColor = c
                    }
                    COMMENTS.push(comment)
                }
            }
            worksheet.addRow(entryCopy)
            rowIndex++
        })

        // Adjust columns width
        worksheet._columns.forEach(function (column, i) {
            var maxLength = 0
            column["eachCell"]({ includeEmpty: true }, function (cell) {
                var columnLength = cell.value ? cell.value.toString().length : 10
                if (columnLength > maxLength ) {
                    maxLength = columnLength
                }
            })
            column.width = maxLength < 10 ? 10 : maxLength
        })

        // Apply styles and formulas
        for (let rIndex = 0; rIndex < worksheet._rows.length; rIndex++) {
            const ROW = worksheet._rows[rIndex]
            if (rIndex == HEADER_INDEX) {
                ROW._cells.forEach(cell => cell.fill = {
                    type: 'pattern',
                    pattern:'solid',
                    fgColor:{argb: YELLOW}
                })
                ROW._cells.forEach(cell => cell.font = {bold: true})
            }
            const CELLS = ROW._cells
            let cellCount = 0
            let storeBackgroundColor = LIGHT_BLUE
            for (let cIndex = TOTAL_INDEX; cIndex < CELLS.length; cIndex ++) {
                //apply formula to "Missing" cells
                if (cIndex == TOTAL_INDEX) {
                    if (rIndex > HEADER_INDEX) {
                        let excelFormula = "E" + (rIndex + 1)
                        for (let i=0; i < STORES_QTY.length; i++) {
                            excelFormula += "+" + STORES_QTY[i] + (rIndex+1)
                        }
                        CELLS[cIndex].value = {formula : excelFormula}
                    }
                }
                if (cIndex == MISSING_INDEX) {
                    if (rIndex > HEADER_INDEX) {
                        CELLS[cIndex].value = {formula : "A" + (rIndex+1) + "- F" + (rIndex+1)}
                    }
                }
                // Apply fill color to stores columns
                else if (cIndex > MISSING_INDEX) {
                    let cell = CELLS[cIndex]
                    if (cell.value != 0) {
                        cell.fill = {
                            type: 'pattern',
                            pattern:'solid',
                            fgColor:{argb: storeBackgroundColor},
                        }
                    }
                    cellCount++
                    if (cellCount == 2) {
                        storeBackgroundColor = storeBackgroundColor == LIGHT_BLUE ? LIGHT_PINK : LIGHT_BLUE
                        cellCount = 0
                    }
                }
            }
        }

        // Add comments to cells with used parts of alternate colors
        COMMENTS.forEach(comment => {
            let cell = worksheet._rows[comment.row]._cells[comment.col]
            let note = (comment.altColor ?? "")
            if (note == "") note += comment.used
            if (note != "") cell.note = note
            if (comment.used != undefined || note.indexOf("Used") > -1) {
                cell.font = {
                    bold: true,
                    color: { argb:RED}
                }
            } 
        })

        // Apply conditional formatting
        const ROW_COUNT = worksheet._rows.length
        const WANTED_COL = 'A' + (HEADER_INDEX + 1) + ':A' + ROW_COUNT
        const TOTAL_COL = 'F' + (HEADER_INDEX + 1) + ':F' + ROW_COUNT
        const MISSING_COL = 'G' + (HEADER_INDEX + 1) + ':G' + ROW_COUNT
        worksheet.addConditionalFormatting({
            ref: WANTED_COL,
            rules: [
                {
                    priority:1,
                    type: 'cellIs',
                    operator: 'lessThan',
                    formulae: [TOTAL_COL],
                    style: {fill: {type: 'pattern', pattern: 'solid', bgColor: {argb: DARK_GREEN}}},
                },
                {
                    priority:2,
                    type: 'cellIs',
                    operator: 'equal',
                    formulae: [TOTAL_COL],
                    style: {fill: {type: 'pattern', pattern: 'solid', bgColor: {argb: LIGHT_GREEN}}},
                },
                {
                    priority:3,
                    type: 'cellIs',
                    operator: 'equal',
                    formulae: [MISSING_COL],
                    style: {fill: {type: 'pattern', pattern: 'solid', bgColor: {argb: LIGHT_RED}}},
                },
                {
                    priority:4,
                    type: 'cellIs',
                    operator: 'greaterThan',
                    formulae: [TOTAL_COL],
                    style: {fill: {type: 'pattern', pattern: 'solid', bgColor: {argb: LIGHT_YELLOW}}},
                }
            ]
        })

        // Color Guide sheet
        const colorGuide = workbook.addWorksheet('Color Guide')
        colorGuide.columns = [
            { header: 'Color', key: 'color', width: 25 },
            { header: 'Meaning', key: 'meaning', width: 70 }
        ]

        colorGuide.addRow({
            color: "DARK GREEN", 
            meaning: 'You are gonna exceed the needed quantity of this item'
        })
        colorGuide.addRow({
            color: "LIGHT GREEN", 
            meaning: 'You are gonna reach the exact needed quantity of this item'
        })
        colorGuide.addRow({
            color: "LIGHT YELLOW", 
            meaning: 'You are still gonna need some of this lot to reach the needed quantity'
        })
        colorGuide.addRow({
            color: "LIGHT_RED", 
            meaning: 'You are gonna have zero items of this lot'
        })
        colorGuide.addRow({
            color: "RED BOLD FONT", 
            meaning: 'Part or all of these items are used (check cell comments for more info)'
        })

        colorGuide._rows[0]._cells.forEach(cell => cell.font = {bold:true})
        colorGuide._rows[0]._cells.forEach(cell => cell.fill = {
            type: 'pattern',
            pattern:'solid',
            fgColor:{argb: YELLOW}
        })
        colorGuide._rows[1]._cells.forEach(cell => cell.fill = {
            type: 'pattern',
            pattern:'solid',
            fgColor:{argb: DARK_GREEN}
        })
        colorGuide._rows[2]._cells.forEach(cell => cell.fill = {
            type: 'pattern',
            pattern:'solid',
            fgColor:{argb: LIGHT_GREEN}
        })
        colorGuide._rows[3]._cells.forEach(cell => cell.fill = {
            type: 'pattern',
            pattern:'solid',
            fgColor:{argb: LIGHT_YELLOW}
        })
        colorGuide._rows[4]._cells.forEach(cell => cell.fill = {
            type: 'pattern',
            pattern:'solid',
            fgColor:{argb: LIGHT_RED}
        })
        colorGuide._rows[5]._cells[0].font = {
            bold: true,
            color: {argb: RED}
        }
        return workbook
    }

    static isAltColor = (item) => {
        for (let x=0; x < item.carts.length; x++) {
            let cart = item.carts[x]
            for (let i = 0; i < cart.length; i ++) {
                if (cart[i].altColor != undefined) return true
            }
        }
        return false
    }
}