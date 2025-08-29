"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"

interface CountryCode {
    code: string
    country: string
    flag: string
}

interface PhoneInputProps {
    value?: string
    onChange?: (value: string) => void
    className?: string
    // Limit selectable country codes by numeric dialing codes (e.g., ["63"]) 
    allowedCountryCodes?: string[]
    // Visual status styling for the input border
    status?: "error" | "success"
}

export function PhoneInput({ value = "", onChange, className, allowedCountryCodes, status }: PhoneInputProps) {
    const [countryCodes, setCountryCodes] = React.useState<CountryCode[]>([])
    const [selectedCode, setSelectedCode] = React.useState("63")
    const [phoneNumber, setPhoneNumber] = React.useState("")
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        async function fetchCountryCodes() {
            try {
                const response = await fetch('https://restcountries.com/v3.1/all?fields=name,idd,flags')
                const data = await response.json()

                let codes: CountryCode[] = data
                    .filter((country: any) => country.idd.root) // Filter out countries without calling codes
                    .map((country: any) => ({
                        code: country.idd.root.replace('+', '') + (country.idd.suffixes?.[0] || ''),
                        country: country.name.common,
                        flag: country.flags.emoji
                    }))
                    .sort((a: any, b: any) => a.country.localeCompare(b.country))

                // Apply optional restriction
                if (allowedCountryCodes && allowedCountryCodes.length > 0) {
                    codes = codes.filter((c: CountryCode) => allowedCountryCodes.includes(c.code))
                }

                setCountryCodes(codes)
            } catch (error) {
                console.error('Failed to fetch country codes:', error)
                // Fallback to Philippines as default
                const fallbackCode = allowedCountryCodes?.[0] || "63"
                const fallbackCountry = fallbackCode === "63" ? "Philippines" : `+${fallbackCode}`
                setCountryCodes([{ code: fallbackCode, country: fallbackCountry, flag: fallbackCode === "63" ? "🇵🇭" : "" }])
            } finally {
                setLoading(false)
            }
        }

        fetchCountryCodes()
    }, [allowedCountryCodes])

    // If restricted to a single country, preselect it
    React.useEffect(() => {
        if (allowedCountryCodes && allowedCountryCodes.length === 1) {
            setSelectedCode(allowedCountryCodes[0])
        }
    }, [allowedCountryCodes])

    // Sync internal state from external value (e.g., when editing existing data)
    React.useEffect(() => {
        if (!value) return
        const digits = value.replace(/\D/g, "")
        if (!digits) return

        const availableCodes = (countryCodes.length > 0
            ? countryCodes.map((c) => c.code)
            : (allowedCountryCodes && allowedCountryCodes.length > 0 ? allowedCountryCodes : ["63"]))
            .sort((a, b) => b.length - a.length)

        const matched = availableCodes.find((code) => digits.startsWith(code))
        if (matched) {
            setSelectedCode(matched)
            setPhoneNumber(digits.slice(matched.length))
        } else {
            setPhoneNumber(digits)
        }
    }, [value, countryCodes, allowedCountryCodes])

    // Handle phone number input
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newNumber = e.target.value.replace(/\D/g, "") // Remove non-digits
        setPhoneNumber(newNumber)
        onChange?.(formatPhoneNumber(selectedCode, newNumber))
    }

    // Handle country code selection
    const handleCountrySelect = (code: string) => {
        setSelectedCode(code)
        onChange?.(formatPhoneNumber(code, phoneNumber))
    }

    // Format the phone number with country code
    const formatPhoneNumber = (code: string, number: string) => {
        return number ? `+${code}${number}` : ""
    }

    if (loading) {
        return <div>Loading country codes...</div>
    }

    const selectDisabled = !!(allowedCountryCodes && allowedCountryCodes.length === 1)
    const inputBorderClass = status === 'error'
        ? 'border-red-500 focus:border-red-500'
        : status === 'success'
        ? 'border-green-500 focus:border-green-500'
        : ''

    return (
        <div className={`flex gap-2 ${className ?? ''}`}>
            <Select
                value={selectedCode}
                onValueChange={handleCountrySelect}
            >
                <SelectTrigger className={`w-[140px] ${selectDisabled ? 'pointer-events-none opacity-60' : ''}`}>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent className="h-[200px] p-0">
                    <ScrollArea className="h-full">
                        {countryCodes.map((country) => (
                            <SelectItem
                                key={country.code}
                                value={country.code}
                                className="cursor-pointer"
                            >
                                <span className="flex items-center gap-2">
                                    <span className="w-6">{country.flag}</span>
                                    <span>+{country.code}</span>
                                    <span className="text-muted-foreground text-sm">
                                        {country.country}
                                    </span>
                                </span>
                            </SelectItem>
                        ))}
                    </ScrollArea>
                </SelectContent>
            </Select>
            <Input
                type="tel"
                placeholder="Phone number"
                value={phoneNumber}
                onChange={handlePhoneChange}
                className={`flex-1 ${inputBorderClass}`}
            />
        </div>
    )
}