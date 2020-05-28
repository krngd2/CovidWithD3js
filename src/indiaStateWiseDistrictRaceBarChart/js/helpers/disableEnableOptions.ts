import { select } from "d3";

export function disableEnableOptions(enable: boolean) {
    select('#dateRange').attr('disabled', enable ? null : true);
    select('#select_state').attr('disabled', enable ? null : true);
    select('#speedRange').attr('disabled', enable ? null : true)
}
