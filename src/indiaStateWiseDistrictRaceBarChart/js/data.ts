import { stateCodes } from "./mappers/states.mapper"
import { convertDate } from "./helpers/convertDate"

export function getStatesData() { 
    return fetch('https://api.covid19india.org/districts_daily.json')
        .then(res => res.json())
        .then((data: any) => {
            return data
        })
        .catch(console.error) 
}

export async function addIndiaData(data){
    let India = {}
    await fetch('https://api.covid19india.org/states_daily.json')
        .then(res => res.json())
        .then((data: any) => {
            let totalCovidDataState = data.states_daily
            for(let i = 0 ; i < 1; i = i + 3){
                for (let p in totalCovidDataState[i]){
                    if (p in stateCodes){
                        India[stateCodes[p]] = []
                    }
                }
            }
            for(let i = 0 ; i < totalCovidDataState.length; i = i + 3){
                for (let p in totalCovidDataState[i]){
                    if (p in stateCodes ){
                    let obj = {
                        confirmed: +totalCovidDataState[i][p],
                        recovered: +totalCovidDataState[i+1][p],
                        deceased: +totalCovidDataState[i+2][p],
                        date: convertDate(totalCovidDataState[i]['date'])
                    }
                    India[stateCodes[p]].push(obj)
                    }
                }
            }
            for(let p in India){
                for(let j in India[p]){
                    if(+j > 0){
                        India[p][j].confirmed += India[p][+j-1].confirmed
                        India[p][j].recovered += India[p][+j-1].recovered
                        India[p][j].deceased += India[p][+j-1].deceased
                    }
                }
            }
        })
        .catch(console.error) 
    data["All-India"] = India
    return data
}
