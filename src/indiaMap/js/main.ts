import { select, scaleLinear, max, line } from "d3";
import { geoMercator, geoPath } from "d3-geo";
import { getStatesDailyData, formatStatesDailyData, getIndianStatesMap } from "./service";
import { convertDateFormatForHeading } from "../../barChartRace/js/helpers/convertDateFormatForHeading";

let w = 620;
let h = 650;
let proj = geoMercator();
let path = geoPath().projection(proj);
var t = proj.translate(); // the projection's default translation
var s = proj.scale() // the projection's default scale
let covidCasesData;
let covidStateAllDates;
let covidTotalCasesData;
let updateChart: Function;
let indiaMapStructure: any;

function initialize() {
  proj.scale(1000);
  proj.translate([-1140, 750]);
}

let mapDataPromise = new Promise((resolve) => resolve(getIndianStatesMap()));
let covidDataPromise = new Promise((resolve) => resolve(getStatesDailyData()));

Promise.all([mapDataPromise, covidDataPromise]).then((responses) => {
  indiaMapStructure = responses[0];
  let formattedData: any = formatStatesDailyData(responses[1]);
  covidCasesData = formattedData.covidCasesData;
  covidStateAllDates = formattedData.covidStateAllDates;
  covidTotalCasesData = formattedData.covidTotalCasesData;
  adjustData(covidCasesData);
});

async function adjustData(data) {
  updateChart = plotMap(data)
  playPlot();
}

async function playPlot() {
  for (let covidDate of covidStateAllDates) {
    updateChart(covidDate)
    await new Promise(done => setTimeout(() => done(), 100));
  }
}

function plotMap(covidData) {
  indiaMapStructure.features = indiaMapStructure.features.filter(function (data) {
    return data.properties.st_nm !== 'Daman & Diu';
  });
  const maxValue = max(Object.values(covidData).flat(Infinity), (d: any) => Number(d.confirmed))
  const colorScale = scaleLinear()
    .domain([0, 1, 100, 1000, maxValue])
    .range(['green', 'yellow', 'orange', 'rgb(255, 100, 100)', 'red']);
  let firstDates = [...covidStateAllDates]
  let presentDate = firstDates[0]

  let svg = select("#chart")
    .append("svg:svg")
    .attr("width", w)
    .attr("height", h)
    .call(initialize);

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
        "<br/><b>Confirmed: </b>" + todayStateData[0]?.confirmed +
        "<br/><b>Recovered:</b> " + todayStateData[0]?.recovered +
        "<br/><b>Deaths:</b> " + todayStateData[0]?.deceased)
        .style("left", (event.pageX) + "px")
        .style('background', '#52A1B8')
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
            else return -15;
          })
          .attr("y", function (d: any) {
            if (path.centroid(d)[0] < w / 2) return -4;
            else if (path.centroid(d)[1] < h / 2) return -120;
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
  let connectionLine = line()
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
        labelPosition.x = path.centroid(d)[0] + 10;
        labelPosition.y = path.centroid(d)[1] - 120;
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
  return (date) => {
    presentDate = date;
    dateText.text(convertDateFormatForHeading(date));
    totalCases.text("Total Cases -" + covidTotalCasesData.filter((countData) => countData.date === date)[0].totalConfirmedCases);
    indiaMap.selectAll("path").transition()
      .duration(800 / 1.2)
      .style('fill', (d: any) => {
        let todayStateData = covidData[d.properties.st_nm]?.filter((stateData) => stateData.date === date);
        return colorScale(!todayStateData ? 0 : todayStateData[0]?.confirmed)
      });
  }
}