import { LinksSankey } from "./links.interface";

export interface SankeyInterface {
    nodes: {name:string}[],
    links: LinksSankey[]
}