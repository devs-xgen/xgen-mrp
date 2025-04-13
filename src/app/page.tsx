import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { User, Shield, Truck, Clipboard } from "lucide-react";
import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <Image
        src="/xgenLogo.png"
        alt="Company Logo"
        width={200}
        height={100}
        priority
        className="mb-4"
      />
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Production Management System
          </CardTitle>
          <CardDescription>
            Please select your login type to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Link href="/admin/login" className="block">
            <Button
              className="w-full h-32 flex flex-col items-center justify-center gap-2"
              variant="default"
            >
              <Shield className="h-8 w-8" />
              Admin Login
            </Button>
          </Link>
          <Link href="/worker/login" className="block">
            <Button
              className="w-full h-32 flex flex-col items-center justify-center gap-2"
              variant="outline"
            >
              <User className="h-8 w-8" />
              Worker Login
            </Button>
          </Link>
          <Link href="/inspector/login" className="block">
            <Button
              className="w-full h-32 flex flex-col items-center justify-center gap-2"
              variant="outline"
            >
              <Clipboard className="h-8 w-8" />
              Inspector Login
            </Button>
          </Link>
          <Link href="/delivery/login" className="block">
            <Button
              className="w-full h-32 flex flex-col items-center justify-center gap-2"
              variant="outline"
            >
              <Truck className="h-8 w-8" />
              Delivery Login
            </Button>
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
