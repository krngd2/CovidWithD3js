import {
  select, geoMercator, geoPath
} from "d3";
import { getStatesZonesData, getIndianStatesMap } from "./service";

let w = 600;
let h = 650;
let proj = geoMercator();
let path = geoPath().projection(proj);
let t = proj.translate(); // the projection's default translation
let s = proj.scale() // the projection's default scale

let svg = select("#chart")
  .append("svg:svg")
  .attr("width", w)
  .attr("height", h)
  .call(initialize);

let map = svg.append("svg:g")

let india = map.append("svg:g")
  .attr("id", "india");
let areaMap = new Map()
let unidentifiedPlaces = [];

getStatesZonesData().then(async (data) => {
  for (let i = 0; i < data.length; i++) {
    for (let j = 0; j < data[i].districtData.length; j++) {
      areaMap.set(data[i].districtData[j].name, data[i].districtData[j].zone);
    }
  }
  drawMap();
})

async function drawMap() {
  // let distrctMapData: any = getIndianDistrictsMap();
  // india.selectAll("path")
  //   .data(distrctMapData.features)
  //   .enter().append("path")
  //   .style("stroke", "#e4e4e4")
  //   .style("opacity", "0.4")
  //   .style("stroke-width", "0.5px")
  //   .style("fill", (d: any) => {
  //     console.log(d.properties.NAME_2);
  //     if (areaMap.has(d.properties.NAME_2)) {
  //       return areaMap.get(d.properties.NAME_2);
  //     } else {
  //       unidentifiedPlaces.push(d.properties.NAME_2 + "-test");
  //       return "black";
  //     }
  //   })
  //   .attr("d", path)
  //   .append("title")
  //   .text(function (d: any) {
  //     return "district : " + d.properties.NAME_2 + " " + " state : " + d.properties.NAME_1;
  //   });

  let stateMapData: any = getIndianStatesMap();
  india.selectAll("path").data(stateMapData.features)
    // .enter()
    .append('path')
    .attr("class", "subunit")
    .attr("d", path)
    .style("stroke", "black")
    .style("opacity", "1")
    .style("stroke-width", "1px");
}

setTimeout(() => {
  console.log(unidentifiedPlaces);
}, 1000);

function initialize() {
  proj.scale(6700);
  proj.translate([-1240, 750]);
}