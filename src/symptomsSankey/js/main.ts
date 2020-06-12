import { csv, select } from "d3";
import { maniputaleData } from "./data";
import { SankeyInterface } from "../inteface/sankey.interface";
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';

fetch('../data/covidData.json')
    .then(r => r.json())
    .then(maniputaleData)
    .then(populateChart)
    .catch(console.error)

function populateChart(sankeyData: SankeyInterface) {
    console.log(sankeyData);
    
    const width = 850
    const height = 850
    const svg = select('#chart')
                    .append('svg')
                    .attr('width', width)
                    .attr('height', height)
    
    const sankeyGen = sankey()
                .nodeId(d =>d.name)
                .extent([[1, 5], [width - 10, height - 50]]);
    const {nodes, links } = sankeyGen(sankeyData)
    svg.append('g')
        .selectAll('path')
        .data(links)
        .join('path')
        .attr('d', sankeyLinkHorizontal())
        .style('stroke','orange')
        .style('opacity','0.4')
        .style('fill','none')
        .style('stroke-width', (d:any) =>  d.width)
    svg.append('g')
        .selectAll('rect')
        .data(nodes)
        .join('rect')
        .attr('x',(d:any)=>d.x0)
        .attr('y',(d:any)=>d.y0)
        .attr('height',(d:any)=>d.y1 - d.y0)
        .attr('width',(d:any)=>d.x1 - d.x0)
    svg.append('g')
        .selectAll('text')
        .data(nodes)
        .join('text')
        .attr('x',(d:any)=>d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
        .attr('y',(d:any)=>(d.y1 + d.y0) / 2)
        .attr('dy','0.35em')
        .attr('text-anchor',(d:any) => d.x0 < width / 2 ? "start" : "end")
        .text((d:any)=>d.name)
        // .attr('height',(d:any)=>d.y1 - d.y0)
        // .attr('width',(d:any)=>d.x1 - d.x0)

}