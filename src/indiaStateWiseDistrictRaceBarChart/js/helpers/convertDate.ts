import { monthsNames } from "../mappers/monthNames.mapper"

export function convertDate(dateString){ 
    let dateEle = dateString.split('-')
    let corrDateForm = "20" + dateEle[2] + "-" + monthsNames[dateEle[1]] + "-" + dateEle[0] 
    return corrDateForm
}