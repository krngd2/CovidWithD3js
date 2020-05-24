import { select, pack, hierarchy, scaleOrdinal,  schemeReds, schemePuRd, schemePastel2, zoom, event } from "d3";

let worldData;
fetch('https://covid-19.dataflowkit.com/v1')
    .then(res => res.json())
    .then((data: []) => {
        data = data.filter(d => {
            if (d['Active Cases_text'] === 'N/A') { 
                return false 
            } else if(typeof d['Active Cases_text'] === 'undefined' ) {
                return false
            } else {
                return true
            }
        })
        data.map(d => {
            d['Active Cases_text'] = parseInt(d['Active Cases_text'].split(',').join(''))
            return d;
        })
        worldData = data.shift()
        worldData['children'] = data
        
        plotChart(worldData)
    })

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
    svg.call(zoom()
            .scaleExtent([0.1, 80])  // This control how much you can unzoom (x0.5) and zoom (x20)
            .extent([[0, 0], [width, height]])
            .on("zoom", function () {
            select('svg > g').attr("transform", event.transform)
        }))
    svg.append('g')
    const dataNodes = hierarchy(data)
    dataNodes.sum((d) => d['Active Cases_text'])
                .sort((d) => d['Active Cases_text'])
    
    const packLayout = pack().size([width, height]).padding(1)
    packLayout(dataNodes) 
    

    const countries = select('svg g')
            .selectAll('circle')
            .data(dataNodes.descendants())
            .enter()
            .append('g')
    countries.append('circle')
            .attr('cx', (d) =>  { 
                // console.log(d);
                return d.x; 
            })
            .attr('cy', (d) => d.y)
            .attr('r', (d) => d.r)
            .style('fill', (d, i) => '#ff00004d')

    const contiresText = countries.append('text')
        .style('font-size', (d) => d.r * 0.4 < 16 ? d.r * 0.4:16)
    contiresText.append('tspan')
            .attr('dy', (d) => d.y - (d.r *0.4))
            .attr('dx', (d) => d.x )
            .text((d) => d.data['Country_text'])
            
    const div = select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);
    countries.on('mouseover', (d, i) => {
        if (d.r > 15) return;
        div.transition()
            .duration(200)
            .style("opacity", .9);
        div.html(`<p>
            Active Cases: ${d.data['Active Cases_text']}<br>
            Country: ${d.data['Country_text']}<br>
            New Cases: ${d.data['New Cases_text']}<br>
            New Deaths: ${d.data['New Deaths_text']}<br>
            Total Cases: ${d.data['Total Cases_text']}<br>
            Total Deaths: ${d.data['Total Deaths_text']}<br>
            Total Recovered: ${d.data['Total Recovered_text']}"674"<br>
        </p>`)
            .style("left", (event.pageX) + "px")
            .style('background', (d) => color(i))
            .style("top", (event.pageY - 28) + "px");
            
    }).on("mouseout", function(d) {
        div.transition()
            .duration(500)
            .style("opacity", 0)

    });
    // contiresText.append('tspan') 
    //         .attr('dy', (d) => 16)
    //         .attr('dx', (d) => -(d.data['Country_text'].length))
    //         .text(function(d) {
    //             return d.r > 15 ? + d.data['Active Cases_text'] : '';
    //         })
}