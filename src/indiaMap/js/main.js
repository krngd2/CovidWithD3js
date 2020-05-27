var w = 600;
var h = 650;
var proj = d3.geo.mercator();
var path = d3.geo.path().projection(proj);
var t = proj.translate(); // the projection's default translation
var s = proj.scale() // the projection's default scale

var svg = d3.select("#chart")
  .append("svg:svg")
  .attr("width", w)
  .attr("height", h)
  .call(initialize);

var map = svg.append("svg:g")

var india = map.append("svg:g")
  .attr("id", "india");
let areaMap = new Map()
d3.json("https://api.covidindiatracker.com/state_data.json", (response) => {
  for (let i = 0; i < response.length; i++) {
    for (let j = 0; j < response[i].districtData.length; j++) {
      areaMap.set(response[i].districtData[j].name, response[i].districtData[j].zone);
    }
  }
});
let unidentifiedPlaces = [];
d3.json("data/states_india.json", function (data) {
  india.selectAll("path").data(data.features)
    .enter()
    .append('path')
    .attr("class", "subunit")
    .attr("d", path)
    .style("stroke", "black")
    .style("opacity", "1")
    .style("stroke-width", "1px");
});
d3.json("data/districts_india.json", function (json) {
  india.selectAll("path")
    .data(json.features)
    .enter().append("path")
    .style("stroke", "#e4e4e4")
    .style("opacity", "0.4")
    .style("stroke-width", "0.5px")
    .attr("fill", (d) => {
      if (areaMap.has(d.properties.NAME_2)) {
        return areaMap.get(d.properties.NAME_2);
      } else {
        unidentifiedPlaces.push(d.properties.NAME_2 + "-test");
        return "black";
      }
    })
    .attr("d", path)
    .append("title")
    .text(function (d) {
      return "district : " + d.properties.NAME_2 + " " + " state : " + d.properties.NAME_1;
    });
  // svg.call(_zoom);
});

setTimeout(() => {
  console.log(unidentifiedPlaces);
}, 1000);

function initialize() {
  proj.scale(6700);
  proj.translate([-1240, 750]);
}