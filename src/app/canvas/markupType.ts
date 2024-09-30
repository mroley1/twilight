export type MarkupType = {fill: string, stroke: string}

export interface IMarkupTypes {
    ADD: MarkupType
    REMOVE: MarkupType
    DEFAULT: MarkupType
    BOLD: MarkupType
}

export const MarkupTypes: IMarkupTypes = {
    ADD: {fill: "#2288", stroke: "#33F"},
    REMOVE: {fill: "#8228", stroke: "#F33"},
    DEFAULT: {fill: "#8888", stroke: "#888"},
    BOLD: {fill: "#FFF8", stroke: "FFF"}
}