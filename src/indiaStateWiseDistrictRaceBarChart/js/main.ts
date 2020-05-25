/* eslint-disable no-unused-vars */
import { CovidData } from "../../interfaces/CovidData.interface";
import { select, timeParse,
    scaleLinear, max, schemeTableau10,
    scaleOrdinal, axisTop, easeLinear
} from "d3";

let totalCovidData: any;
let totalCovidDataState: any;
let covidStateData: CovidData[][] = []
let updateChart: Function;
let ticker: number = 800;
select('#speedRange').on('change', (d, i ,n) => {
    ticker = n[0].value;
    console.log(ticker);

})


const stateCodes = {
    'un': "State Unassigned",
    'an': "Andaman and Nicobar Islands",
    'ap': "Andhra Pradesh",
    'ar': "Arunachal Pradesh",
    'as': "Assam",
    'br': "Bihar",
    'ch': "Chandigarh",
    'ct': "Chhattisgarh",
    'dl': "Delhi",
    'dn': "Dadra and Nagar Haveli and Daman and Diu",
    'ga': "Goa",
    'gj': "Gujarat",
    'hp': "Himachal Pradesh",
    'hr': "Haryana",
    'jh': "Jharkhand",
    'jk': "Jammu and Kashmir",
    'ka': "Karnataka",
    'kl': "Kerala",
    'la': "Ladakh",
    'ld': "Lakshadweep",
    'mh': "Maharashtra",
    'ml': "Meghalaya",
    'mn': "Manipur",
    'mp': "Madhya Pradesh",
    'mz': "Mizoram",
    'nl': "Nagaland",
    'or': "Odisha",
    'pb': "Punjab",
    'py': "Puducherry",
    'rj': "Rajasthan",
    'sk': "Sikkim",
    'tg': "Telangana",
    'tn': "Tamil Nadu",
    'tr': "Tripura",
    'up': "Uttar Pradesh",
    'ut': "Uttarakhand",
    'wb': "West Bengal",
}



fetch('https://api.covid19india.org/districts_daily.json')
    .then(res => res.json())
    .then((data: any) => {
        totalCovidData = addData(data.districtsDaily)
        makeStatesDropDown(Object.keys(totalCovidData))
        // adjustData()
        adjustData()
    })
    .catch(console.error)


function convertDate(dateString){
    const months = {
        'Jan' : '01',
        'Feb' : '02',
        'Mar' : '03',
        'Apr' : '04',
        'May' : '05',
        'Jun' : '06',
        'Jul' : '07',
        'Aug' : '08',
        'Sep' : '09',
        'Oct' : '10',
        'Nov' : '11',
        'Dec' : '12'
    }
    let dateEle = dateString.split('-')
    let corrDateForm = "20" + dateEle[2] + "-" + months[dateEle[1]] + "-" + dateEle[0]

    return corrDateForm
}

function addData(data){
    let India = {}
    fetch('https://api.covid19india.org/states_daily.json')
        .then(res => res.json())
        .then((data: any) => {
            totalCovidDataState = data.states_daily
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
            console.log(India)
        })
        .catch(console.error)
    data["All-India"] = India
    return data
}

async function adjustData() {

    const selectElement = select('#select_state')
    const selectedState = selectElement.property("value")
    console.log(selectedState);

    if (selectedState === '0') return ;
    const covidStateDataObj = totalCovidData[selectedState]
    covidStateData = Object.keys(covidStateDataObj).map(district => {
        return covidStateDataObj[district].map((e:any)=> {
            e.district = district
            return e
        })
    })
    console.log(covidStateData)
    const dates = covidStateData
                    .map(d => d.map(e => e.date))
                    .flat(Infinity);
    intiDateSlider(dates)
    updateChart = plotChart(covidStateData)
    await playPlot()

}

async function playPlot(date?: string) {
    const timeParser = timeParse("%Y-%m-%d")
    if (date) {
        return updateChart(covidStateData[0].findIndex((e) => (timeParser(e.date).getTime())/1000 === Number(date)) ?? 0 )
    }
    const dateRange = select('#dateRange')
    for (let i = 1; i < Object.keys(covidStateData[0]).length; i++) {
        if (i === Object.keys(covidStateData[0]).length - 1 ) {
            disableEnableOptions(true)
        } else {
            disableEnableOptions(false)
        }
        dateRange.attr('value', (timeParser(covidStateData[0][i].date)?.getTime())/1000)
        updateChart(i)
        await new Promise(done => setTimeout(() => done(), ticker));
    }
}

function plotChart(data: CovidData[][]) {
    const mainSection = select('#raceChart')
    const dateH2 = select('#date')
    let presentIndex = 0;
    dateH2.text(data[0][0].date)
    mainSection.html('')
    const rankings = data.map((district: CovidData[]) => district[0])
                        .sort((a: CovidData,b: CovidData)=>b.confirmed - a.confirmed)
                        .map(d => d? d.district : '')
    const mainSectionNode: HTMLElement = mainSection.node() as HTMLElement
    // data.sort( (a, b) => b.confirmed - a.confirmed)
    const mainSvg = mainSection.append('svg')
                .attr('width', mainSectionNode.clientWidth)
                .attr('height', mainSectionNode.clientHeight)
                .append('g')
                .style('transform', 'translate(0px,10px)')
    const xScale = scaleLinear()
                .domain([0, max(data.map((d) => d[0].confirmed ? d[0].confirmed: 0 )) + 100])
                .range([0, mainSectionNode.clientWidth - 100])
    const colorSchema = scaleOrdinal().range(schemeTableau10)
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
                return 20 * (d[0] ?  rankings.findIndex((e: string) => e === d[0].district) : 0)
            })
            .attr('height', 15)
            .attr('width', (d) => {
                return xScale(d[0].confirmed)
            })
            .style('stroke', (d, i: number) => colorSchema(i))
            .style('fill', (d, i: number) => colorSchema(i))

            bars.append('text')
                .attr('x', (d) => {
                    return xScale(d[0].confirmed) + 20
                })
                .attr('y', (d) => {
                    return 20 * (d[0] ?  rankings.findIndex((e: string) => e === d[0].district) : 0) + 15
                })
                .style('font-size', 14)
                .html((d) => {
                    return d[0].confirmed + ' ' + d[0].district
                })

    const xAxis = axisTop(xScale)
    mainSvg.append('g')
            .classed('x-axis', true)
            .style('transform', 'translate(10px, 10px);')
        .call(xAxis)
    // Tool Tip Implementation
    const div = select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

    bars.on("mouseover", (d: CovidData[], index) => {
        div.transition()
            .duration(200)
            .style("opacity", .9);
        div.html("<b>"+ d[presentIndex].district + "</b>"+
                "<br/><b>Confirmed: </b>" + d[presentIndex].confirmed +
                "<br/><b>Recovered:</b> " +d[presentIndex].recovered+
                "<br/><b>Deaths:</b> " +d[presentIndex].deceased)
            .style("left", (event.pageX) + "px")
            .style('background', (d) => colorSchema(index))
            .style("top", (event.pageY - 28) + "px");
        })
    .on("mouseout", function(d) {
        div.transition()
            .duration(500)
            .style("opacity", 0);
    });
    //-----------------------------------

    return (i:  number) => {
        presentIndex = i;
        dateH2.text(data[0][i].date)
        const updatedRankings = data.map((district: CovidData[]) => district[i])
                            .sort((a: CovidData, b: CovidData)=>b.confirmed -a.confirmed)
                            .map((d: CovidData) => d? d.district : '')
        const newXScale = scaleLinear()
                            .domain([0, max(data.map((d: CovidData[]) => d[i] ? d[i].confirmed : 0)) + 100])
                            .range([0, mainSectionNode.clientWidth - 100])
        bars.selectAll('rect')
            .transition()
            .duration(500)
            .ease(easeLinear)
            .attr('width', (d: CovidData[]) => {
                return newXScale(d[i] ? d[i].confirmed : 0 )
            })
            .attr('y', (d: CovidData[]) => {
                return 20 * (d[i] ?  updatedRankings.findIndex((e: string) => e === d[i].district) : mainSectionNode.clientHeight)
            })

        bars.selectAll('text')
            .html((d: CovidData[]) => {
                return (d[i] ? d[i].confirmed : 0) + ' ' + (d[i] ?  d[i].district : '')
            })
            .transition()
            .duration(500)
            .ease(easeLinear)
            .attr('x', (d: CovidData[]) => newXScale(d[i] ? d[i].confirmed : 0) + 20  )
            .attr('y', (d: CovidData[]) => {
                return 20 * (d[i] ?  updatedRankings.findIndex((e: string) => e === d[i].district) : mainSectionNode.clientHeight) + 15
            })

        select('g.x-axis').call(axisTop(newXScale))
    }
}

function makeStatesDropDown(data: string[]) {
    const selectElement = select('#select_state')
    const optionsArray  = data.map(d => `<option value='${d}' >${d}</option>`)
    optionsArray.unshift(optionsArray.pop())
    optionsArray.unshift(`<option value='0' disabled selected>Select a State</option>`)
    selectElement.html(optionsArray.join(''))
    selectElement.on('change', adjustData)
}

function intiDateSlider(dates: string[]) {
    const timeParser = timeParse("%Y-%m-%d")
    const dateObjects = dates.map(d => timeParser(d).getTime());
    dateObjects.sort()
    select('#dateRange')
            .attr('min', dateObjects[0] / 1000)
            .attr('max', dateObjects[dateObjects.length -1] / 1000)
            .attr('step', 86400)
            .on('input', async (d, i, n: HTMLInputElement[]) => {
                await playPlot(n[0].value);
            })
}

function disableEnableOptions(enable:boolean) {
    select('#dateRange').attr('disabled', enable ? null: true);
    select('#select_state').attr('disabled', enable ? null: true);
    select('#speedRange').attr('disabled', enable ? null: true)
}