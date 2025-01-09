
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Construction } from "lucide-react"

export default function SettingsPage() {
    return (
        <div className="container mx-auto py-10">
            <Card className="border-2 border-dashed">
                <CardHeader className="text-center">
                    <Construction className="w-12 h-12 mx-auto text-muted-foreground" />
                    <CardTitle className="text-2xl mt-4">Settings Page Coming Soon</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground">
                    <p>We're working hard to bring you amazing new features.</p>
                    <p className="mt-2">Stay tuned for updates!</p>
                </CardContent>
            </Card>
        </div>
    )
}