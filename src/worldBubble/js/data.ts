
export function getData() {
    return fetch('https://covid-19.dataflowkit.com/v1')
        .then(res => res.json())
        .then((data: []) => {
            let worldData;
            data = data.filter(d => {
                if (d['Active Cases_text'] === 'N/A') { 
                    return false 
                } else if(typeof d['Active Cases_text'] === 'undefined' ) {
                    return false
                } else {
                    return true
                }
            })
            data.map(d => {
                d['Active Cases_text'] = parseInt(d['Active Cases_text'].split(',').join(''))
                return d;
            })
            worldData = data.shift()
            worldData['children'] = data
            return worldData
        })
}