fetch('https://covid-19.dataflowkit.com/v1')
    .then(res => res.json())
    .then(data => {
        console.log(data);
        
    })


function plotChart(data: any) {
    
}