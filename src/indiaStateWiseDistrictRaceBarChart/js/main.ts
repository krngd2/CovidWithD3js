/* eslint-disable no-unused-vars */
import { CovidData } from "../../interfaces/CovidData.interface";
import {
    select, timeParse,
    scaleLinear, max, schemeTableau10,
    scaleOrdinal, axisTop, easeLinear
} from "d3"; 
import { dropdownInitializer } from "./initializers/dropdown.initializer";
import { getStatesData, addIndiaData } from "./data";
import { disableEnableOptions } from "./helpers/disableEnableOptions";
import { dateSliderInitializer } from "./initializers/dateSlider.initializer";
import { convertCovidObjToArray } from "./helpers/convertObjToArray";

let totalCovidData: any;
let covidStateData: CovidData[][] = []
let covidStateAllDates: string[]
let updateChart: Function;
let ticker: number = 800;

select('#speedRange').on('change', (d, i, n) => {
    ticker = Math.abs(n[0].value);
})

getStatesData().then(async (data) => {
    totalCovidData = await addIndiaData(data.districtsDaily)
    dropdownInitializer(Object.keys(totalCovidData), adjustData)
    adjustData()
})

async function adjustData() {
    const selectElement = select('#select_state')
    const selectedState = selectElement.property("value") 
    if (selectedState === '0') return; 
    covidStateData = convertCovidObjToArray(totalCovidData[selectedState])
    console.log(covidStateData)
    updateChart = plotChart(covidStateData)
    await playPlot()
}

async function playPlot(date?: string) {
    const timeParser = timeParse("%Y-%m-%d")
    if (date) {
        return updateChart(date)
    }
    const dateRange = select('#dateRange')
    for (let i = 1; i < covidStateAllDates.length; i++) {
        if (i === covidStateAllDates.length - 1) {
            disableEnableOptions(true)
        } else {
            disableEnableOptions(false)
        }
        dateRange.attr('value', (timeParser(covidStateAllDates[i])?.getTime()) / 1000)
        updateChart(covidStateAllDates[i])
        await new Promise(done => setTimeout(() => done(), ticker));
    }
}

function plotChart(data: CovidData[][]) {
    const mainSection = select('#raceChart');
    (function getDateRange(){
        const dates = data.map(d => Object.keys(d))
                    .flat(Infinity);
        covidStateAllDates = dates.filter((v,i) => dates.indexOf(v) === i)
        dateSliderInitializer(covidStateAllDates, playPlot)
    })()
    let presentDate = covidStateAllDates[0];
    const dateH2 = select('#date')
    
    dateH2.text(covidStateAllDates[0])
    const totalCases = select('#totalCases')
    let confirmedCases = 0;
    data.forEach((value) => {
        let cases = value[covidStateAllDates[0]]?.confirmed
        confirmedCases = confirmedCases + (isNaN(cases) ? 0 : cases);
    });
    totalCases.text(confirmedCases);
    mainSection.html('')
    const rankings = data.map((district: CovidData[]) => district[covidStateAllDates[0]])
        .sort((a: CovidData, b: CovidData) => b.confirmed - a.confirmed)
        .map(d => d ? d.district : '').filter(v => v !== "") 
        
    const mainSectionNode: HTMLElement = mainSection.node() as HTMLElement
    // data.sort( (a, b) => b.confirmed - a.confirmed)
    const mainSvg = mainSection.append('svg')
        .attr('width', mainSectionNode.clientWidth)
        .attr('height', mainSectionNode.clientHeight)
        .append('g')
        .style('transform', 'translate(0px,10px)')
    const maxDistrictLength = 200;

    const xScale = scaleLinear()
        .domain([0, max(data.map((d) => d[covidStateAllDates[0]]?.confirmed ? d[covidStateAllDates[0]]?.confirmed : 0)) + 100])
        .range([0, mainSectionNode.clientWidth - 100 - maxDistrictLength]);

    const colorSchema = scaleOrdinal().range(schemeTableau10)
    const bars = mainSvg
        .append('g')
        .classed('bars', true)
        .style('transform', 'translate(0px,20px)')
        .selectAll('g')
        .data(data)
        .enter()
        .append('g')
        .attr('class', d => d[covidStateAllDates[0]]?.district)
    //rectangles
    bars.append('rect')
        .attr('x', maxDistrictLength)
        .attr('y', (d) => {
            return 20 * (d[covidStateAllDates[0]] ? rankings.findIndex((e: string) => e === d[covidStateAllDates[0]]?.district) : 0)
        })
        .attr('height', 15)
        .attr('width', (d) => {
            return xScale(d[covidStateAllDates[0]]?.confirmed ?? 0)
        })
        .style('stroke', (d, i: number) => colorSchema(i))
        .style('fill', (d, i: number) => colorSchema(i))
    //counts
    bars.append('text')
        .attr('class', 'count')
        .attr('x', (d) => {
            return xScale(d[covidStateAllDates[0]]?.confirmed ?? 0) + 10 + maxDistrictLength
        })
        .attr('y', (d) => {
            return 20 * (d[covidStateAllDates[0]] ? rankings.findIndex((e: string) => e === d[covidStateAllDates[0]]?.district) : 0) + 15
        })
        .style('font-size', 14)
        .html((d) => {
            return (d[covidStateAllDates[0]]?.confirmed ?? '')
        })
    //district names
    bars.append('text')
        .attr('class', 'districtName')
        .attr('x', maxDistrictLength - 10)
        .attr('y', (d) => {
            return 20 * (d[covidStateAllDates[0]] ? rankings.findIndex((e: string) => e === d[covidStateAllDates[0]]?.district) : 0) + 15
        })
        .attr("text-anchor", "end")
        .style('font-size', 14)
        .html((d) => {
            return (d[covidStateAllDates[0]]?.district ?? '')
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
        div.html("<b>" + d[presentDate]?.district + "</b>" +
            "<br/><b>Confirmed: </b>" + d[presentDate]?.confirmed +
            "<br/><b>Recovered:</b> " + d[presentDate]?.recovered +
            "<br/><b>Deaths:</b> " + d[presentDate]?.deceased +
            "<br/><b>Active: </b>" + d[presentDate]?.active)
            .style("left", (event.pageX) + "px")
            .style('background', (d) => colorSchema(index))
            .style("top", (event.pageY - 28) + "px");
    })
        .on("mouseout", function (d) {
            div.transition()
                .duration(500)
                .style("opacity", 0);
        });
    //-----------------------------------

    return (date: string) => {
        presentDate = date;
        dateH2.text(date)
        const updatedRankings = data.map((district: CovidData[]) => district[date])
            .sort((a: CovidData, b: CovidData) => b.confirmed - a.confirmed)
            .map((d: CovidData) => d ? d.district : '') 
        const newXScale = scaleLinear()
            .domain([0, max(data.map((d: CovidData[]) => d[date]?.confirmed ?? 0)) + 100])
            .range([0, mainSectionNode.clientWidth - 100 - maxDistrictLength])
        let confirmedCases = 0;
        data.forEach((value) => {
            let cases = value[date]?.confirmed
            confirmedCases = confirmedCases + (isNaN(cases) ? 0 : cases);
        });
        totalCases.text(confirmedCases);
        bars.selectAll('rect')
            .transition()
            .duration(ticker / 1.2)
            .ease(easeLinear)
            .attr('width', (d: CovidData[]) => {
                return newXScale(d[date]?.confirmed ?? 0)
            })
            .attr('y', (d: CovidData[]) => {
                
                if (d[date]?.confirmed === 0) {
                    return mainSectionNode.clientHeight
                }
                return 20 * (d[date] ? (updatedRankings.findIndex((e: string) => e === d[date].district) ?? 0) : mainSectionNode.clientHeight)
            })
        bars.selectAll('.count')
            .html((d: CovidData[]) => {
                return (d[date] ? d[date].confirmed : 0)
            })
            .transition()
            .duration(ticker / 1.2)
            .ease(easeLinear)
            .attr('x', (d: CovidData[]) => newXScale(d[date] ? d[date].confirmed : 0) + 10 + maxDistrictLength)
            .attr('y', (d: CovidData[]) => {
                return 20 * (d[date] ? (updatedRankings.findIndex((e: string) => e === d[date].district) ?? 0) : mainSectionNode.clientHeight) + 15
            })
        bars.selectAll('.districtName')
            .html((d: CovidData[]) => {
                return (d[date] ? d[date].district : '')
            })
            .transition()
            .duration(500)
            .ease(easeLinear)
            .attr('x', maxDistrictLength - 10)
            .attr('y', (d: CovidData[]) => {
                return 20 * (d[date] ? (updatedRankings.findIndex((e: string) => e === d[date].district) ?? 0) : mainSectionNode.clientHeight) + 15
            })
        select('g.x-axis').call(axisTop(newXScale))
    }
} 

