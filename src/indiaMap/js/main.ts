import { select, scaleLinear, max, line, timeParse, axisBottom } from "d3";
import { geoMercator, geoPath } from "d3-geo";
import { getStatesDailyData, formatStatesDailyData, getIndianStatesMap } from "./service";
import { convertDateFormatForHeading } from "../../barChartRace/js/helpers/convertDateFormatForHeading";
import { dateSliderInitializer } from "../../barChartRace/js/initializers/dateSlider.initializer";

let w = 620;
let h = 650;
const colourRange: any = ['green', 'yellow', 'orange', 'rgb(255, 100, 100)', 'rgb(221, 10, 10)'];
let scaleRange = [0, 100, 1000, 10000];
let proj = geoMercator();
let path = geoPath().projection(proj);
var t = proj.translate(); // the projection's default translation
var s = proj.scale() // the projection's default scale
let covidCasesData;
let covidStateAllDates;
let covidTotalCasesData;
let updateChart: Function;
let indiaMapStructure: any;

let mapDataPromise = new Promise((resolve) => resolve(getIndianStatesMap()));
let covidDataPromise = new Promise((resolve) => resolve(getStatesDailyData()));

const dateRange = select('#dateRange')
const playBtn = select('#playBtn').on('click', playPlot)

Promise.all([mapDataPromise, covidDataPromise]).then((responses) => {
  indiaMapStructure = responses[0];
  let formattedData: any = formatStatesDailyData(responses[1]);
  covidCasesData = formattedData.covidCasesData;
  covidStateAllDates = [...formattedData.covidStateAllDates];
  covidTotalCasesData = formattedData.covidTotalCasesData;
  adjustData(covidCasesData);
});

async function adjustData(data) {
  updateChart = plotMap(data)
  dateSliderInitializer(covidStateAllDates, updateChart);
  playPlot();
}

async function playPlot() {
  dateRange.attr('disabled', true)
  playBtn.attr('disabled', true)
  for (let covidDate of covidStateAllDates) {
    updateChart(covidDate)
    await new Promise(done => setTimeout(() => done(), 100));
  }
  dateRange.attr('disabled', null)
  playBtn.attr('disabled', null)
}

function plotMap(covidData) {
  indiaMapStructure.features = indiaMapStructure.features.filter(function (data) {
    return data.properties.st_nm !== 'Daman & Diu';
  });
  const maxValue = max(Object.values(covidData).flat(Infinity), (d: any) => Number(d.confirmed))
  scaleRange.push(maxValue);
  const colorScale = scaleLinear()
    .domain(scaleRange)
    .range(colourRange);
  let firstDates = covidStateAllDates;
  let presentDate = firstDates[0]

  const svg = select("#chart")
    .html("")
    .append("svg:svg")
    .attr("width", w)
    .attr("height", h + 50)
    .call(() => {
      proj.scale(1000);
      proj.translate([-1140, 750]);
    });

  let indiaMap = svg.append("svg:g")
    .attr("id", "india");

  let stateLabels = svg.append("svg:g")
    .attr("id", "labels");
  let statePointers = svg.append("svg:g")
    .attr("id", "pointers");
  let stateMarkers = svg.append("svg:g")
    .attr("id", "markers");
  let stateLines = svg.append("svg:g")
    .attr("id", "lines");
  const dateText = svg.append('text')
    .attr('x', 360)
    .attr('y', 50)
    .style('font-size', '24px')
    .style('font-weight', '600')
    .text(firstDates[0]);
  const totalCases = svg.append('text')
    .attr('x', 360)
    .attr('y', 80)
    .style('font-size', '24px')
    .style('font-weight', '600')
    .text("Total Cases -" + covidTotalCasesData.filter((countData) => countData.date === firstDates[0])[0].totalConfirmedCases);

  const div = select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);
  indiaMap.selectAll("path")
    .data(indiaMapStructure.features)
    .enter()
    .append('path')
    .attr("d", path)
    .style("stroke", "white")
    .style("opacity", "1")
    .style("stroke-width", "0.4px")
    .style('fill', (d: any) => {
      let todayStateData = covidData[d.properties.st_nm]?.filter((stateData) => stateData.date === firstDates[0]);
      return colorScale(!todayStateData ? 0 : todayStateData[0].confirmed)
    }).on("mouseover", (d: any, index) => {
      const todayStateData = covidData[d.properties.st_nm]?.filter((stateData) => stateData.date === presentDate);
      div.transition()
        .duration(200)
        .style("opacity", .9);
      div.html("<b>" + d.properties.st_nm + "</b>" +
        "<br/><br/>Confirmed: <b>" + todayStateData[0]?.confirmed +
        "</b><br/>Recovered:<b> " + todayStateData[0]?.recovered +
        "</b><br/>Deaths:<b> " + todayStateData[0]?.deceased + "</b><br>")
        .style("left", (event.pageX) + "px")
        .style("top", (event.pageY - 28) + "px");
    }).on("mouseout", function (d) {
      div.transition()
        .duration(500)
        .style("opacity", 0);
    });
  //state names
  stateLabels.selectAll("labels")
    .data(indiaMapStructure.features)
    .enter()
    .append("text")
    .attr('x', function (d: any) {
      return path.centroid(d)[0]
    })
    .attr('y', function (d: any) {
      return path.centroid(d)[1]
    })
    .style('fill', "black")
    .text((d: any) => {
      let todayStateData = covidData[d.properties.st_nm]?.filter((stateData) => stateData.date === firstDates[0]);
      return !todayStateData ? "" : todayStateData[0].stateCode;
    })
    .attr("text-anchor", "middle")
    .style('font-size', (d: any) => path.area(d) < 50 ? 8 : 10)
    .filter(function (d: any) {
      return path.area(d) < 500;
    }).remove();
  //Draw Labels
  statePointers.selectAll("pointers")
    .data(indiaMapStructure.features)
    .enter()
    .append("text")
    .each(function (d: any) {
      if (path.area(d) < 500) {
        select(this)
          .attr("transform", function (d: any) { return "translate(" + path.centroid(d) + ")"; })
          .attr("x", function (d: any) {
            if (path.centroid(d)[0] < w / 2) return 0 - path.centroid(d)[0];
            else return 15;
          })
          .attr("y", function (d: any) {
            if (path.centroid(d)[0] < w / 2) return -4;
            else if (path.centroid(d)[1] < h / 2) return 140;
            else return 50;
          })
          .attr("fill", "black")
          .style("text-anchor", "start")
          .style('font-size', 12)
          .text(d.properties.st_nm);
      }
    }).filter(function (d: any) {
      return path.area(d) > 500;
    }).remove();
  //Draw Markers
  stateMarkers.selectAll("markers")
    .data(indiaMapStructure.features)
    .enter()
    .append("circle")
    .each(function (d: any) {
      if (path.area(d) < 500) {
        select(this)
          .attr("r", "2.5px")
          .attr("transform", function (d: any) { return "translate(" + path.centroid(d) + ")"; })
          .attr("fill", "none")
          .attr("stroke", "black")
          .attr("stroke-width", "1px");
      }
    }).filter(function (d: any) {
      return path.area(d) > 500;
    }).remove();
  //Draw Lines
  const connectionLine = line()
    .x(function (d: any) { return d.x; })
    .y(function (d: any) { return d.y; });
  stateLines.selectAll("lines")
    .data(indiaMapStructure.features)
    .enter()
    .append("path")
    .attr("d", function (d: any) {
      let labelPosition = { "x": 0, "y": 0 }
      if (path.centroid(d)[0] < w / 2) {
        labelPosition.x = 0 - path.centroid(d)[0];
        labelPosition.y = path.centroid(d)[1];
      } else if (path.centroid(d)[1] < h / 2) {
        labelPosition.x = path.centroid(d)[0] + 25;
        labelPosition.y = path.centroid(d)[1] + 120;
      } else {
        labelPosition.x = path.centroid(d)[0] + 10;
        labelPosition.y = path.centroid(d)[1] + 50;
      }
      let lineData: any = [
        { "x": path.centroid(d)[0], "y": path.centroid(d)[1] }
      ];
      lineData.push(labelPosition);
      return connectionLine(lineData);
    }).attr("stroke", "black")
    .attr("stroke-width", 1)
    .attr("opacity", 0.8)
    .attr("fill", "#000")
    .filter(function (d: any) {
      return path.area(d) > 500;
    }).remove();
  const timeParser = timeParse("%Y-%m-%d");
  const dateRange = select('#dateRange');
  //color legend
  let legendWidth = w * 0.6;
  let legendHeight = 10;
  //Needed for colour gradients			
  let defs = svg.append("defs");
  defs.append("linearGradient")
    .attr("id", "gradient-ygb-colors")
    .attr("x1", "0%").attr("y1", "0%")
    .attr("x2", "100%").attr("y2", "0%")
    .selectAll("stop")
    .data(colourRange)
    .enter().append("stop")
    .attr("offset", (d, i) => { return i / (colourRange.length - 1); })
    .attr("stop-color", (d: any) => d);
  const colorLegend = svg.append("g")
    .attr("class", "legendWrapper")
    .attr("transform", "translate(" + (w / 2 - 50) + "," + h + ")");
  //Draw the Rectangle
  colorLegend.append("rect")
    .attr("class", "legendRect")
    .attr("x", -legendWidth / 2)
    .attr("y", 10)
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#gradient-ygb-colors)");
  //Set scale for x-axis
  let xScale = scaleLinear()
    .range([0, legendWidth])
    .domain([0, maxValue]);
  //Define x-axis
  let xAxis = axisBottom(xScale)
    .ticks(5).tickFormat((d, i) => {
      return scaleRange[i].toString();
    });
  //Set up X axis
  colorLegend.append("g")
    .attr("class", "axis")  //Assign "axis" class
    .attr("transform", "translate(" + (-legendWidth / 2) + "," + (10 + legendHeight) + ")")
    .call(xAxis);
  return (date) => {
    presentDate = date;
    dateRange.attr('value', (timeParser(date)?.getTime()) / 1000)
    dateText.text(convertDateFormatForHeading(date));
    totalCases.text("Total Cases - " + covidTotalCasesData.filter((countData) => countData.date === date)[0].totalConfirmedCases);
    indiaMap.selectAll("path").transition()
      .duration(800 / 1.2)
      .style('fill', (d: any) => {
        let todayStateData = covidData[d.properties.st_nm]?.filter((stateData) => stateData.date === date);
        return colorScale(!todayStateData ? 0 : todayStateData[0]?.confirmed)
      });
  }
}