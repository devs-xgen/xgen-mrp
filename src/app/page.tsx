import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Inventory Management System</CardTitle>
          <CardDescription>Please select your login type to continue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link href="/admin/login" className="w-full block">
            <Button className="w-full" variant="default" size="lg">
              Admin Login
            </Button>
          </Link>
          <Link href="/worker/login" className="w-full block">
            <Button className="w-full" variant="outline" size="lg">
              Worker Login
            </Button>
          </Link>
        </CardContent>
      </Card>
    </main>
  )
}