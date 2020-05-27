export function convertCovidObjToArray(data:any) {
    let convidData = []
    Object.keys(data).forEach((district, index) => {
        data[district].forEach((e: any) => {
            e.district = district
            convidData[index] = {...convidData[index]} 
            convidData[index][e.date] = e
        })
    })
    return convidData;
}
