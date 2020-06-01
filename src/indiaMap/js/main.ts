import { select } from "d3";
import { geoMercator, geoPath } from "d3-geo";
import { getStatesDailyData, formatStatesDailyData, getIndianStatesMap } from "./service";

let w = 600;
let h = 650;
let proj = geoMercator();
let path = geoPath().projection(proj);
var t = proj.translate(); // the projection's default translation
var s = proj.scale() // the projection's default scale
let covidCasesData;
let covidStateAllDates = new Set();
let updateChart: Function;

let svg = select("#chart")
  .append("svg:svg")
  .attr("width", w)
  .attr("height", h)
  .call(initialize);

let indiaMap = svg.append("svg:g")
  .attr("id", "india");

function initialize() {
  proj.scale(1000);
  proj.translate([-1140, 750]);
}

getStatesDailyData().then(async (data) => {
  let formattedData = formatStatesDailyData(data);
  covidCasesData = formattedData.covidCasesData;
  covidStateAllDates = formattedData.covidStateAllDates;
  adjustData(covidCasesData);
})

async function adjustData(data) {
  // plotMap(data);
  updateChart = plotMap(data)
  playPlot();
}

async function playPlot() {
  for (let covidDate of covidStateAllDates) {
    updateChart(covidDate)
    await new Promise(done => setTimeout(() => done(), 800));
  }
}

function plotMap(covidData) {
  let indiaMapStructure: any = getIndianStatesMap();
  indiaMap.selectAll("path").data(indiaMapStructure.features)
    .enter()
    .append('path')
    .attr("d", path)
    .style("stroke", "black")
    .style("opacity", "1")
    .style("stroke-width", "1px")
    .attr("class", (d: any) => {
      if (d.properties.st_nm === "Daman & Diu" || d.properties.st_nm === "Dadara & Nagar Havelli") {
        d.properties.st_nm = "Dadra and Nagar Haveli and Daman and Diu";
      }
      let covidStatesIterator = covidStateAllDates.values();
      let first = covidStatesIterator.next();
      let todayStateData = covidData[d.properties.st_nm]?.filter((stateData) => {
        return stateData.date === first.value;
      });
      let confirmedCases = todayStateData[0].confirmed;
      if (confirmedCases === 0) { return "c0"; }
      else if (confirmedCases < 50) { return "c1-49"; }
      else if (confirmedCases < 100) { return "c50-99"; }
      else if (confirmedCases < 500) { return "c100-499"; }
      else if (confirmedCases < 1000) { return "c500-999"; }
      else if (confirmedCases < 5000) { return "c1000-4999"; }
      else if (confirmedCases < 10000) { return "c5000-9999"; }
      else { return "c10000"; }
    });
  return (date) => {
    indiaMap.selectAll("path").transition()
      .duration(800 / 1.2)
      .attr("class", (d: any) => {
        if (d.properties.st_nm === "Daman & Diu" || d.properties.st_nm === "Dadara & Nagar Havelli") {
          d.properties.st_nm = "Dadra and Nagar Haveli and Daman and Diu";
        }
        let todayStateData = covidData[d.properties.st_nm]?.filter((stateData) => {
          return stateData.date === date;
        });
        let confirmedCases = todayStateData[0].confirmed;
        if (confirmedCases === 0) { return "c0"; }
        else if (confirmedCases < 50) { return "c1-49"; }
        else if (confirmedCases < 100) { return "c50-99"; }
        else if (confirmedCases < 500) { return "c100-499"; }
        else if (confirmedCases < 1000) { return "c500-999"; }
        else if (confirmedCases < 5000) { return "c1000-4999"; }
        else if (confirmedCases < 10000) { return "c5000-9999"; }
        else { return "c10000"; }
      });
  }
}