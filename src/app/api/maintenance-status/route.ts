import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';
    
    return NextResponse.json({
      isMaintenanceMode,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking maintenance status:', error);
    return NextResponse.json(
      { error: 'Failed to check maintenance status' },
      { status: 500 }
    );
  }
}
