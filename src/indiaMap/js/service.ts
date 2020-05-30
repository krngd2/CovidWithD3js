import * as statesMapData from '../data/states_india.json';
// import * as districtMapData from '../data/districts_india.json';


export function getStatesZonesData() {
    return fetch('https://api.covidindiatracker.com/state_data.json')
        .then(res => res.json())
        .then((data: any) => {
            return data
        })
        .catch(console.error)
}

export function getIndianStatesMap() {
    return statesMapData;
}

// export function getIndianDistrictsMap() {
//     return districtMapData;
// }