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
import { Input } from "@/components/ui/input";
import Image from "next/image";

const XgenLogo = ({
  className,
  color = "#000",
}: {
  className?: string;
  color?: string;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="120"
    height="40"
    viewBox="0 0 120 40"
    fill="none"
    className={className}
  >
    <text
      x="0"
      y="28"
      fontFamily="sans-serif"
      fontSize="32"
      fontWeight="bold"
      fill={color}
    >
      XGEN
    </text>
  </svg>
);

export default function Home() {
  return (
    <main className="min-h-screen flex bg-white">
      {/* Left side - Background Image */}
      <div className="w-1/2 relative overflow-hidden my-10 rounded-tr-xl rounded-br-xl">
        <Image
          src="/images/mainPage-bg.jpg"
          alt="Background"
          fill
          priority
          style={{ objectFit: "cover" }}
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center z-10">
          <XgenLogo className="w-40 h-auto" color="#fff" />
        </div>
      </div>

      {/* Right side */}
      <div className="w-1/2 p-12 flex flex-col justify-center bg-white">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-10">
            <XgenLogo className="mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">Welcome to XGEN MRP</h2>
            <p className="text-gray-500">
              Please select your login type to continue
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-12">
            <Link href="/admin/login" className="block">
              <Button
                className="w-full h-36 flex flex-col items-center justify-center gap-3 rounded-xl shadow-sm hover:shadow-md transition-all"
                variant="default"
              >
                <Shield className="h-10 w-10" />
                <span className="font-medium">Admin Login</span>
              </Button>
            </Link>
            <Link href="/worker/login" className="block">
              <Button
                className="w-full h-36 flex flex-col items-center justify-center gap-3 rounded-xl shadow-sm hover:shadow-md transition-all"
                variant="outline"
              >
                <User className="h-10 w-10" />
                <span className="font-medium">Worker Login</span>
              </Button>
            </Link>
            <Link href="/inspector/login" className="block">
              <Button
                className="w-full h-36 flex flex-col items-center justify-center gap-3 rounded-xl shadow-sm hover:shadow-md transition-all"
                variant="outline"
              >
                <Clipboard className="h-10 w-10" />
                <span className="font-medium">Inspector Login</span>
              </Button>
            </Link>
            <Link href="/delivery/login" className="block">
              <Button
                className="w-full h-36 flex flex-col items-center justify-center gap-3 rounded-xl shadow-sm hover:shadow-md transition-all"
                variant="outline"
              >
                <Truck className="h-10 w-10" />
                <span className="font-medium">Delivery Login</span>
              </Button>
            </Link>
          </div>

          <div className="flex justify-center space-x-6">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600"
              disabled
            >
              Download our app
            </Button>
            {/* LALAGYAN TO NG GOOGLE FORM */}
            <Button variant="ghost" size="sm" className="text-gray-600">
              Help & Support
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
