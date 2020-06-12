import { SymptomsInterface } from "../inteface/data.interface";
import { LinksSankey } from "../inteface/links.interface";

export function maniputaleData(data:any) {
    return {
        nodes: getNodes(data),
        links: getLinks(data)
    };
}

function getNodes(data:any) {
    const ageMap = data.map(d => Math.floor((d.age/10)))
    return [...[...new Set(ageMap)].sort().map((d:number)=> {return {name: d + '0'+'-' +((d*10)+10)}}),...Object.keys(data[0]).map(d=> {return {name:d}}), {name: '70-80'}]
    
}
function getLinks(data: SymptomsInterface[]) {
    const linksData: LinksSankey[] = []
    const entryValues: SymptomsInterface[] = [];
    for (let i = 0; i < 8; i++) {
        entryValues.push({
                        sno: 0,
                        age: 0,
                        gender: 0,
                        body_temperature: 0,
                        dry_cough: 0,
                        sour_throat: 0,
                        weakness: 0,
                        breathing_problem: 0,
                        drowsiness: 0,
                        chest_pain: 0,
                        travel_history_to_infected_countries: 0,
                        diabetes: 0,
                        heart_disease: 0,
                        lung_disease: 0,
                        stroke_or_reduced_immunity: 0,
                        symptoms_progressed: 0,
                        high_blood_pressue: 0,
                        kidney_disease: 0,
                        change_in_appetide: 0,
                        loss_of_sense_of_smell: 0,
                        corona_result: 0
                })
    }
    data.forEach(e => {
        const age = Math.floor((e.age/10)) -1
        Object.entries(e).forEach(([key, value]) => {
            if (key === 'age' || key === 'sno'|| key === 'gender'|| key === 'body_temperature') return ;
            entryValues[age][key] = value ? entryValues[age][key] +1 : entryValues[age][key]
        })
    });
    entryValues.forEach((d, i) => {
            i += 1
            return Object.entries(d).forEach(([key, value]) => {
                linksData.push({
                            source: i + '0'+'-' +((i*10)+10),
                            target: key,
                            value: value
                        })
            })
        })
    return linksData
}