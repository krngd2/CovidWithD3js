import * as statesMapData from '../data/states_india.json';
import { stateCodes } from './mappers/stateCodes.mapper';
import { monthsNames } from './mappers/months.mapper';

export function getIndianStatesMap() {
    return statesMapData;
}

export function getStatesDailyData() {
    return fetch('https://api.covid19india.org/states_daily.json')
        .then(res => res.json())
        .then((data: any) => {
            return data
        })
        .catch(console.error)
}

export function formatStatesDailyData(data) {
    let response = {
        covidStateAllDates: new Set(),
        covidCasesData: []
    };
    let covidStateAllDates = new Set();
    let covidCasesData = [];
    let totalCovidDataState = data.states_daily;
    for (let i = 0; i < 1; i = i + 3) {
        for (let p in totalCovidDataState[i]) {
            if (p in stateCodes) {
                covidCasesData[stateCodes[p]] = []
            }
        }
    }
    for (let i = 0; i < totalCovidDataState.length; i = i + 3) {
        for (let p in totalCovidDataState[i]) {
            if (p in stateCodes) {
                let obj = {
                    confirmed: +totalCovidDataState[i][p],
                    recovered: +totalCovidDataState[i + 1][p],
                    deceased: +totalCovidDataState[i + 2][p],
                    date: convertDate(totalCovidDataState[i]['date'])
                }
                covidStateAllDates.add(convertDate(totalCovidDataState[i]['date']));
                covidCasesData[stateCodes[p]].push(obj)
            }
        }
    }
    for (let p in covidCasesData) {
        for (let j in covidCasesData[p]) {
            if (+j > 0) {
                covidCasesData[p][j].confirmed += covidCasesData[p][+j - 1].confirmed
                covidCasesData[p][j].recovered += covidCasesData[p][+j - 1].recovered
                covidCasesData[p][j].deceased += covidCasesData[p][+j - 1].deceased
            }
        }
    }
    response.covidStateAllDates = covidStateAllDates;
    response.covidCasesData = covidCasesData;
    return response;
}

export function convertDate(dateString) {
    let dateEle = dateString.split('-')
    let corrDateForm = "20" + dateEle[2] + "-" + monthsNames[dateEle[1]] + "-" + dateEle[0]
    return corrDateForm
}