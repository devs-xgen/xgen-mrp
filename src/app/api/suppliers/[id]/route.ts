import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

interface RouteParams {
    params: {
        id: string;
    };
}

// suppliers Patch
export async function PATCH(req: Request, { params }: RouteParams) {
    try {
        const json = await req.json();
        const supplier = await prisma.supplier.update({
            where: {
                id: params.id,
            },
            data: {
                name: json.name,
                code: json.code,
                contactPerson: json.contactPerson,
                email: json.email,
                phone: json.phone,
                address: json.address || '',
                city: json.city || '',
                state: json.state || '',
                country: json.country || '',
                postalCode: json.postalCode || '',
                paymentTerms: json.paymentTerms || '',
                leadTime: json.leadTime || 0,
                status: json.status || 'ACTIVE',
                notes: json.notes || '',
                modifiedBy: json.modifiedBy || '',
                updatedAt: new Date(),
            },
        });
        return NextResponse.json(supplier);
    } catch (error: any) {
        console.error('Supplier update error:', error);
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: "A supplier with this unique code already exists" },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: "Error updating supplier" },
            { status: 500 }
        );
    }
}

// suppliers DELETE
export async function DELETE(_: Request, { params }: RouteParams) {
    try {
        await prisma.supplier.delete({
            where: {
                id: params.id,
            },
        });
        return new NextResponse('', { status: 204 });
    } catch (error) {
        console.error('Supplier deletion error:', error);
        return NextResponse.json(
            { error: "Error deleting supplier" },
            { status: 500 }
        );
    }
}

// suppliers GET

export async function GET(_: Request, { params }: RouteParams) {
    try {
        const supplier = await prisma.supplier.findUnique({
            where: {
                id: params.id,
            },
            include: {
                materials: true,
                purchaseOrders: true,
            },
        });

        if (!supplier) {
            return NextResponse.json(
                { error: "Supplier not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(supplier);
    } catch (error) {
        console.error('Error fetching supplier:', error);
        return NextResponse.json(
            { error: "Error fetching supplier" },
            { status: 500 }
        );
    }
}
