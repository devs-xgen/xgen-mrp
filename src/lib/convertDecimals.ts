export function convertDecimals(obj: any): any {
    return JSON.parse(
        JSON.stringify(obj, (_, value) =>
            typeof value === 'object' && value !== null && value.constructor.name === 'Decimal'
                ? value.toNumber()
                : value
        )
    )
}
