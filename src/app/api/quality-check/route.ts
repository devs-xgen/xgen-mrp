// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/db";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";
// import { qualityCheckSchema } from "@/lib/qualitycheck";

// interface RouteParams {
//     params: {
//         id: string;
//     };
// }

// // POST /api/quality-checks - Create a new quality check
// export async function POST(req: Request) {
//     try {
//         const session = await getServerSession(authOptions);
//         if (!session) {
//             return new NextResponse("Unauthorized", { status: 401 });
//         }

//         const json = await req.json();
//         const body = qualityCheckSchema.parse(json);

//         const qualityCheck = await prisma.qualityCheck.create({
//             data: {
//                 ...body,
//                 createdBy: session.user.id,
//                 updatedAt: new Date(),
//             },
//         });

//         return NextResponse.json(qualityCheck, { status: 201 });
//     } catch (error: any) {
//         console.error("Quality check creation error:", error);
//         return NextResponse.json(
//             { error: "Error creating quality check" },
//             { status: 500 }
//         );
//     }
// }

// // GET /api/quality-checks/[id] - Get a single quality check
// export async function GET(_: Request, { params }: RouteParams) {
//     try {
//         const session = await getServerSession(authOptions);
//         if (!session) {
//             return new NextResponse("Unauthorized", { status: 401 });
//         }

//         const qualityCheck = await prisma.qualityCheck.findUnique({
//             where: {
//                 id: params.id,
//             },
//             include: {
//                 productionOrder: true,
//             },
//         });

//         if (!qualityCheck) {
//             return NextResponse.json(
//                 { error: "Quality check not found" },
//                 { status: 404 }
//             );
//         }

//         return NextResponse.json(qualityCheck);
//     } catch (error) {
//         console.error("Error fetching quality check:", error);
//         return NextResponse.json(
//             { error: "Error fetching quality check" },
//             { status: 500 }
//         );
//     }
// }


import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { qualityCheckSchema } from "@/lib/qualitycheck";

interface RouteParams {
    params: {
        id: string;
    };
}

// POST /api/quality-checks - Create a new quality check
export async function POST(req: Request) {
    try {
        const json = await req.json();
        const body = qualityCheckSchema.parse(json);

        const qualityCheck = await prisma.qualityCheck.create({
            data: {
                ...body,
                updatedAt: new Date(),
            },
        });

        return NextResponse.json(qualityCheck, { status: 201 });
    } catch (error: any) {
        console.error("Quality check creation error:", error);
        return NextResponse.json(
            { error: "Error creating quality check" },
            { status: 500 }
        );
    }
}




// GET /api/quality-checks - Get all quality checks
export async function GET() {
    try {
        const qualityChecks = await prisma.qualityCheck.findMany({
            include: {
                productionOrder: true,
            },
            orderBy: {
                createdAt: "desc", // Sorting by newest first
            },
        });

        return NextResponse.json(qualityChecks);
    } catch (error) {
        console.error("Error fetching quality checks:", error);
        return NextResponse.json(
            { error: "Error fetching quality checks" },
            { status: 500 }
        );
    }
}
    
// GET /api/quality-checks/[id] - Get a single quality check
// export async function GET(_: Request, { params }: RouteParams) {
//     try {
//         const qualityCheck = await prisma.qualityCheck.findUnique({
//             where: {
//                 id: params.id,
//             },
//             include: {
//                 productionOrder: true,
//             },
//         });

//         if (!qualityCheck) {
//             return NextResponse.json(
//                 { error: "Quality check not found" },
//                 { status: 404 }
//             );
//         }

//         return NextResponse.json(qualityCheck);
//     } catch (error) {
//         console.error("Error fetching quality check:", error);
//         return NextResponse.json(
//             { error: "Error fetching quality check" },
//             { status: 500 }
//         );
//     }
// }
