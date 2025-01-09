// suppliers POST
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const json = await req.json();

        const supplier = await prisma.supplier.create({
            data: {
                id: json.id || undefined, // Use generated ID if not provided
                name: json.name,
                code: json.code,
                contactPerson: json.contactPerson || '',
                email: json.email || '',
                phone: json.phone || '',
                address: json.address || '',
                city: json.city || '',
                state: json.state || '',
                country: json.country || '',
                postalCode: json.postalCode || '',
                paymentTerms: json.paymentTerms || '',
                leadTime: json.leadTime || 0, // Default to 0 if not provided
                status: json.status || 'ACTIVE',
                notes: json.notes || '',
                createdBy: json.createdBy || 'admin',
                modifiedBy: json.modifiedBy || 'admin',
            },
        });

        return NextResponse.json(supplier);
    } catch (error: any) {
        console.error('Supplier creation error:', error);
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: "A Supplier with this unique code already exists" },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: "Error creating Supplier" },
            { status: 500 }
        );
    }
}

// suppliers GET
export async function GET() {
    try {
        const suppliers = await prisma.supplier.findMany({
            orderBy: {
                name: "asc",
            },
        });
        return NextResponse.json(suppliers);
    } catch (error) {
        console.error("Error fetching suppliers:", error);
        return NextResponse.json(
            { error: "Error fetching suppliers" },
            { status: 500 }
        );
    }
}
