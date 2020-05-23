
let totalCovidData: any;
let covidStateData = {}
const ticker: number = 200;
fetch('https://api.covid19india.org/districts_daily.json')
    .then(res => res.json())
    .then((data: any) => {
        totalCovidData = data.districtsDaily;
        makeStatesDropDown(Object.keys(totalCovidData))
        // adjustData()
        adjustData()
    })
    .catch(console.error)


async function adjustData() {

    const selectElement = d3.select('#select_state')
    const selectedState = selectElement.property("value")
    covidStateData = totalCovidData[selectedState]
    covidStateData = Object.keys(covidStateData).map(district => {
        return covidStateData[district].map((e:any)=> {
            e.district = district
            return e
        })
    })
    const dates = covidStateData.map(d => d.map(e => e.date)).flat(Infinity);
    intiDateSlider(dates)
    await playPlot()
}

async function playPlot(date?: string) {
    const updateChart = plotChart(covidStateData)
    const timeParser = d3.timeParse("%Y-%m-%d") 
    if (date) {
        return updateChart(covidStateData[0].findIndex(e => (timeParser(e.date)?.getTime())/1000 === Number(date)) ?? 0 )
    }
    const dateRange = d3.select('#dateRange')
    for (let i = 1; i < Object.keys(covidStateData[0]).length; i++) {
        console.log(timeParser(covidStateData[0][i].date)?.getTime())/1000);
        
        dateRange.attr('value', (timeParser(covidStateData[0][i].date)?.getTime())/1000)
        updateChart(i)
        await new Promise(done => setTimeout(() => done(), ticker));
    }
}

function plotChart(data: any) {
    const mainSection = d3.select('#raceChart')
    const dateH2 = d3.select('#date')
    dateH2.text(data[0][0].date)
    mainSection.html('')
    const rankings = data.map(district => district[0])
                        .sort((a,b)=>b.confirmed - a.confirmed)
                        .map(d => d? d.district : '') 
    const mainSectionNode: HTMLElement = mainSection.node() as HTMLElement
    // data.sort( (a, b) => b.confirmed - a.confirmed)
    const mainSvg = mainSection.append('svg')
                .attr('width', mainSectionNode.clientWidth)
                .attr('height', mainSectionNode.clientHeight)
                .append('g')
                .style('transform', 'translate(0px,10px)')
    const xScale = d3.scaleLinear()
                .domain([0, d3.max(data.map(d => d[0].confirmed? d[0].confirmed: 0 )) + 100])
                .range([0, mainSectionNode.clientWidth - 100])
    const colorSchema = d3.scaleOrdinal().range(d3.schemeTableau10)
    const bars = mainSvg
            .append('g')
            .classed('bars', true)
            .style('transform', 'translate(0px,20px)')  
            .selectAll('g')
            .data(data)
            .enter()
            .append('g')
            .attr('class', d => d[0].district)

        bars.append('rect')
            .attr('x', 10)
            .attr('y', (d) => {
                return 20 * (d[0] ?  rankings.findIndex(e => e === d[0].district) : 0)
            })
            .attr('height', 15)
            .attr('width', (d) => {
                return xScale(d[0].confirmed)
            })
            .style('stroke', (d,i) => colorSchema(i))
            .style('fill', (d,i) => colorSchema(i))

            bars.append('text')
                .attr('x', (d) => xScale(d[0].confirmed) + 20  )
                .attr('y', (d) => {
                    return 20 * (d[0] ?  rankings.findIndex(e => e === d[0].district) : 0) + 15
                })
                .style('font-size', 14)
                .html((d) => {
                    return d[0].confirmed + ' ' + d[0].district
                }) 
            
    const xAxis = d3.axisTop(xScale)
    mainSvg.append('g')
            .classed('x-axis', true)
            .style('transform', 'translate(10px, 10px);')
        .call(xAxis)


    return (i:  number) => { 
        
        dateH2.text(data[0][i].date)
        const updatedRankings = data.map(district => district[i])
                            .sort((a,b)=>b.confirmed -a.confirmed)
                            .map(d => d? d.district : '') 
                            
        xScale.domain([0, d3.max(data.map(d => d[i] ? d[i].confirmed : 0)) + 100])
        bars.selectAll('rect')
            .transition()
            .duration(500)
            .ease(d3.easeLinear)
            .attr('width', (d) => {
                return xScale(d[i] ? d[i].confirmed : 0 )
            })
            .attr('y', (d) => {
                return 20 * (d[i] ?  updatedRankings.findIndex(e => e === d[i].district) : mainSectionNode.clientHeight)
            })
            
        bars.selectAll('text')
            .html((d) => {
                return (d[i] ? d[i].confirmed : 0) + ' ' + (d[i] ?  d[i].district : '')
            }) 
            .transition()
            .duration(500)
            .ease(d3.easeLinear)
            .attr('x', (d) => xScale(d[i] ? d[i].confirmed : 0) + 20  )
            .attr('y', (d) => {
                return 20 * (d[i] ?  updatedRankings.findIndex(e => e === d[i].district) : mainSectionNode.clientHeight) + 15
            })
            
    }
}

function makeStatesDropDown(data: string[]) {
    const selectElement = d3.select('#select_state')
    selectElement.html(data.map(d => `<option value='${d}'>${d}</option>`).join(''))
    selectElement.on('change', adjustData)
}

function intiDateSlider(dates: string[]) {
    const timeParser = d3.timeParse("%Y-%m-%d")
    const dateObjects = dates.map(d => timeParser(d).getTime());
    dateObjects.sort()
    const dateRange = d3.select('#dateRange')
            .attr('min', dateObjects[0] / 1000)
            .attr('max', dateObjects[dateObjects.length -1] / 1000)
            .attr('step', 86400)
            .on('input', (d, i, n) => {
                playPlot(n[0].value);
            })
}
