import { select, timeParse } from "d3";

export function dateSliderInitializer(dates: string[], oninput: Function) {
    const timeParser = timeParse("%Y-%m-%d")
    const dateObjects = dates.map(d => timeParser(d).getTime());
    dateObjects.sort()
    select('#dateRange')
        .attr('min', dateObjects[0] / 1000)
        .attr('max', dateObjects[dateObjects.length - 1] / 1000)
        .attr('step', 86400)
        .on('input', async (d, i, n: HTMLInputElement[]) => {
            const idate = new Date(Number(n[0].value + '000'))
            await oninput(`${idate.getFullYear()}-${idate.getMonth()+1 < 10 ? '0' + (idate.getMonth()+1): idate.getMonth()}-${idate.getDate() < 10 ? '0' + idate.getDate() : idate.getDate()}`);
        })
}