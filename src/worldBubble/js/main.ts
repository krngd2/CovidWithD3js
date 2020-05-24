import { select, scaleSqrt, interpolateHcl, scaleLinear } from "d3";

fetch('https://covid-19.dataflowkit.com/v1')
    .then(res => res.json())
    .then(data => {
        console.log(data);
        plotChart(data)
    })

function plotChart(data: []) {
    const mainsection = select('#chartbox')
    const mainsectionElement: HTMLElement = mainsection.node() as HTMLElement;
    const width = mainsectionElement.clientWidth
    const height = mainsectionElement.clientHeight
    const color = scaleLinear()
                    .domain([0, 5])
                    .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
                    .interpolate(interpolateHcl )
                    
    const svg = mainsection.append('svg')
                .attr('width', width)
                .attr('height', height)
                .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
                .style("display", "block")
                .style("margin", "0 -14px")
                .style("background", color(0))
                .style("cursor", "pointer")
                // .on("click", () => zoom(root));
    
    const scale = scaleSqrt()
                    .domain([1, data[0]['Active Cases_text']])
                    .range([1, mainsectionElement.clientWidth])
    
    svg.selectAll('circle')
        .data(valueToShow)
        .enter()
        .append('cirlce')
            .attr('cx', (d) => scale(parseInt(d['Active Cases_text'].split(',').join(''))))
            .attr('cy', )
}