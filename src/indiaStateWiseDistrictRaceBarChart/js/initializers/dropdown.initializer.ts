import { select } from "d3"

export function dropdownInitializer(data: string[], onChange: Function) {
    const selectElement = select('#select_state')
    const optionsArray = data.map(d => `<option value='${d}' >${d}</option>`)
    optionsArray.unshift(optionsArray.pop())
    optionsArray.unshift(optionsArray.pop())
    optionsArray.unshift(`<option value='0' disabled selected>Select a State</option>`)
    selectElement.html(optionsArray.join(''))
    selectElement.on('change', onChange)
}
