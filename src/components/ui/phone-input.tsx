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
}

export function PhoneInput({ value = "", onChange, className }: PhoneInputProps) {
    const [countryCodes, setCountryCodes] = React.useState<CountryCode[]>([])
    const [selectedCode, setSelectedCode] = React.useState("63")
    const [phoneNumber, setPhoneNumber] = React.useState("")
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        async function fetchCountryCodes() {
            try {
                const response = await fetch('https://restcountries.com/v3.1/all?fields=name,idd,flags')
                const data = await response.json()

                const codes = data
                    .filter((country: any) => country.idd.root) // Filter out countries without calling codes
                    .map((country: any) => ({
                        code: country.idd.root.replace('+', '') + (country.idd.suffixes?.[0] || ''),
                        country: country.name.common,
                        flag: country.flags.emoji
                    }))
                    .sort((a: any, b: any) => a.country.localeCompare(b.country))

                setCountryCodes(codes)
            } catch (error) {
                console.error('Failed to fetch country codes:', error)
                // Fallback to Philippines as default
                setCountryCodes([{ code: "63", country: "Philippines", flag: "🇵🇭" }])
            } finally {
                setLoading(false)
            }
        }

        fetchCountryCodes()
    }, [])

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

    return (
        <div className="flex gap-2">
            <Select
                value={selectedCode}
                onValueChange={handleCountrySelect}
            >
                <SelectTrigger className="w-[140px]">
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
                className="flex-1"
            />
        </div>
    )
} 