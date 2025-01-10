import { getCountries, getCountryCallingCode } from 'libphonenumber-js'

export const countryCodes = getCountries().map(country => ({
    code: getCountryCallingCode(country),
    country: new Intl.DisplayNames(['en'], { type: 'region' }).of(country) || country,
    flag: country.replace(/./g, char =>
        String.fromCodePoint(char.charCodeAt(0) + 127397)
    )
})).sort((a, b) => a.country.localeCompare(b.country)) 