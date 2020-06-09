import { select, scaleLinear, max, line, timeParse, axisBottom, scaleQuantile } from "d3";
import { geoMercator, geoPath } from "d3-geo";
import { getStatesDailyData, formatStatesDailyData, getIndianStatesMap } from "./service";
import { convertDateFormatForHeading } from "../../barChartRace/js/helpers/convertDateFormatForHeading";
import { dateSliderInitializer } from "../../barChartRace/js/initializers/dateSlider.initializer";

let covidStateAllDates;
let covidTotalCasesData;
let updateChart: Function;

const mapDataPromise = new Promise((resolve) => resolve(getIndianStatesMap()));
const covidDataPromise = new Promise((resolve) => resolve(getStatesDailyData()));

const dateRange = select('#dateRange')
const playBtn = select('#playBtn').on('click', playPlot)

Promise.all([mapDataPromise, covidDataPromise]).then((responses) => {
  const indiaMapStructure = responses[0];
  let formattedData: any = formatStatesDailyData(responses[1]);
  const covidCasesData = formattedData.covidCasesData;
  covidStateAllDates = [...formattedData.covidStateAllDates];
  covidTotalCasesData = formattedData.covidTotalCasesData;
  loadMap(covidCasesData, indiaMapStructure);
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
  const maxValue = max(Object.values(covidData).flat(Infinity), (d: any) => Number(d.confirmed))
  const scaleRange = [0, 10, 100, 1000, maxValue];
  const colourRange: any = ['green', '#fb6947', '#fb6947', 'red', '#66000d'];
  const colorScale = scaleLinear()
    .domain(scaleRange)
    .range(colourRange);

  let firstDates = covidStateAllDates;
  let presentDate = firstDates[0]

  const svg = select("#chart svg")
  const width = svg.node().clientWidth;
  const height = svg.node().clientHeight;

  const dateText = svg.append('text')
    .attr('x', 360)
    .attr('y', 50)
    .style('font-size', '24px')
    .style('font-weight', '600')
    .text(firstDates[0]);
  // const totalCases = svg.append('text')
  //   .attr('x', 360)
  //   .attr('y', 80)
  //   .style('font-size', '24px')
  //   .style('font-weight', '600')
  //   .text("Total Cases -" + covidTotalCasesData.filter((countData) => countData.date === firstDates[0])[0].totalConfirmedCases);

  const totalConfirmedCases = select("#totalConfirmedCases");
  const totalDeathCases = select("#totalDeathCases");
  const totalRecoveredCases = select("#totalRecoveredCases");

  const div = select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);
  const indiaMap = select('#india')
    .selectAll('path')

  indiaMap.on("mouseover", (d: any, index) => {
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
  const timeParser = timeParse("%Y-%m-%d");
  const dateRange = select('#dateRange');
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
    .attr("transform", "translate(" + (width / 2 - 50) + "," + height * 0.9 + ")");

  //color legend
  const legendWidth = width * 0.6;
  const legendHeight = 10;

  //Draw the Rectangle
  colorLegend.append("rect")
    .attr("class", "legendRect")
    .attr("x", -legendWidth / 2)
    .attr("y", 10)
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#gradient-ygb-colors)");

  //Set scale for x-axis
  const xScale = scaleQuantile()
    .range([0, legendWidth / 4, legendWidth / 2, legendWidth / 1.5, legendWidth])
    .domain(scaleRange);

  //Set up X axis
  colorLegend.append("g")
    .attr("class", "axis")  //Assign "axis" class
    .attr("transform", "translate(" + (-legendWidth / 2) + "," + (10 + legendHeight) + ")")
    .call(axisBottom(xScale));

  return (date) => {
    presentDate = date;
    dateRange.attr('value', (timeParser(date)?.getTime()) / 1000)
    dateText.text(convertDateFormatForHeading(date));
    // totalCases.text("Total Cases - " + covidTotalCasesData.filter((countData) => countData.date === date)[0].totalConfirmedCases);
    totalConfirmedCases.text(covidTotalCasesData.filter((countData) => countData.date === date)[0].totalConfirmedCases);
    totalDeathCases.text(covidTotalCasesData.filter((countData) => countData.date === date)[0].totalDeceasedCases);
    totalRecoveredCases.text(covidTotalCasesData.filter((countData) => countData.date === date)[0].totalRevoveredCases);
    indiaMap
      .transition()
      .duration(800 / 1.2)
      .style('fill', (d: any) => {
        let todayStateData = covidData[d.properties.st_nm]?.filter((stateData) => stateData.date === date);
        return colorScale(!todayStateData ? 0 : todayStateData[0]?.confirmed)
      });
  }
}

function loadMap(covidData, indiaMapStructure) {
  const proj = geoMercator();
  const path = geoPath().projection(proj);
  indiaMapStructure.features = indiaMapStructure.features
    .filter(function (data) {
      return data.properties.st_nm !== 'Daman & Diu';
    });
  const width = 620;
  const height = 650;

  const svg = select("#chart")
    .html("")
    .append("svg:svg")
    .attr("width", width)
    .attr("height", height + 50)
    .call(() => {
      proj.scale(1000);
      proj.translate([-1140, 750]);
    });

  const indiaMap = svg.append("svg:g")
    .attr("id", "india");
  const stateLabels = svg.append("svg:g")
    .attr("id", "labels");
  const statePointers = svg.append("svg:g")
    .attr("id", "pointers");
  const stateMarkers = svg.append("svg:g")
    .attr("id", "markers");
  const stateLines = svg.append("svg:g")
    .attr("id", "lines");
  indiaMap.selectAll("path")
    .data(indiaMapStructure.features)
    .enter()
    .append('path')
    .attr("d", path)
    .style("stroke", "white")
    .style("opacity", "1")
    .style("stroke-width", "0.4px")
    .style('fill', 'green')

  //State Names
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
      let todayStateData = covidData[d.properties.st_nm];
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
            if (path.centroid(d)[0] < width / 2) return 0 - path.centroid(d)[0];
            else return 15;
          })
          .attr("y", function (d: any) {
            if (path.centroid(d)[0] < width / 2) return -4;
            else if (path.centroid(d)[1] < height / 2) return 140;
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
      if (path.centroid(d)[0] < width / 2) {
        labelPosition.x = 0 - path.centroid(d)[0];
        labelPosition.y = path.centroid(d)[1];
      } else if (path.centroid(d)[1] < height / 2) {
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
}