import { select, pack, hierarchy, scaleOrdinal, schemePastel2, zoom, event, interpolateZoom, min, easePolyInOut, zoomIdentity } from "d3";
import { getData } from "./data";
let worldData;
getData().then((data) => {
    worldData = data
    plotChart(worldData)
});

function plotChart(data: []) {
    const mainsection = select('#chartbox')
    const mainsectionElement: HTMLElement = mainsection.node() as HTMLElement;
    const width = mainsectionElement.clientWidth
    const height = mainsectionElement.clientHeight
    const color = scaleOrdinal().range(schemePastel2)

    const svg = mainsection.append('svg')
                .attr('width', width)
                .attr('height', height)
                .attr("viewBox", `${0} ${0} ${width} ${height}`)
                .style("display", "block")
                .style("margin", "0 -14px")
                // .style("background", color(0))
                .style("cursor", "pointer")
    const zoomGenerator = zoom()
            .scaleExtent([0.1, 200])
            .extent([[0, 0], [width, height]])
            .on("zoom", function () {
                select('svg > g').attr("transform", event.transform)
            })
    svg.call(zoomGenerator)
    svg.append('g')
    const dataNodes = hierarchy(data)
    dataNodes.sum((d) => d['Active Cases_text'])
                .sort((d) => d['Active Cases_text'])

    const packLayout = pack().size([width, height]).padding((d) => d.r * 0.4 < 6 ? d.r * 0.1 : 1)
    packLayout(dataNodes)


    const contries = select('svg g')
            .selectAll('circle')
            .data(dataNodes.descendants())
            .enter()
            .append('g')
    contries.append('circle')
            .attr('cx', (d) =>  {
                // console.log(d);
                return d.x;
            })
            .attr('cy', (d) => d.y)
            .attr('r', (d) => d.r)
            .style('fill', (d, i) => '#ff00004d')

    const contiresText = contries.append('text')
        .style('font-size', (d) => d.r * 0.4 < 16 ? d.r * 0.4 : 16)

    contiresText.append('tspan')
            .attr('dy', (d) => d.y - (d.r - (d.r * 0.4 < 16 ? d.r * 0.4:16)))
            .attr('dx', (d) => d.x )
            .text((d) => d.parent ? d.data['Country_text']: '')

    const div = select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);
    contries.on('mouseover', (d, i) => {
        if (d.r > 15) return;
        div.transition()
            .duration(200)
            .style("opacity", .9);
        div.html(`<p>
            <b>${d.data['Country_text']}</b><br>
            Active Cases: ${d.data['Active Cases_text']}<br>
            New Cases: ${d.data['New Cases_text']}<br>
            New Deaths: ${d.data['New Deaths_text']}<br>
            Total Cases: ${d.data['Total Cases_text']}<br>
            Total Deaths: ${d.data['Total Deaths_text']}<br>
            Total Recovered: ${d.data['Total Recovered_text']}<br>
        </p>`)
            .style("left", (event.pageX) + "px")
            .style('background', (d) => color(i))
            .style("top", (event.pageY - 28) + "px");

    }).on("mouseout", function(d) {
        div.transition()
            .duration(500)
            .style("opacity", 0)

    });

    contries.selectAll('circle').on('click', (d,i,n) => {
        const zoomTo = [d.x, d.y, d.r * 2]
        const viewInterplator = interpolateZoom([width, height, min([width, height])], zoomTo)
        const view  = viewInterplator(0.9)
        const k = min([width, height]) / view[2];
        const translate = [width/2 - view[0] *k, height / 2 - view[1] * k];
        select('svg > g')
            .transition().ease(easePolyInOut).duration(1000)
            .attr("transform", `translate(${translate}) scale(${k})`)
        // const transform = zoomIdentity
        //             .translate(translate[0], translate[1])
        //             .scale(k)
        //             .translate(-translate[0], -translate[1]);
        // svg.call(zoomGenerator.transform, transform)
    })
    // contiresText.append('tspan')
    //         .attr('dy', (d) => 16)
    //         .attr('dx', (d) => -(d.data['Country_text'].length))
    //         .text(function(d) {
    //             return d.r > 15 ? + d.data['Active Cases_text'] : '';
    //         })
}