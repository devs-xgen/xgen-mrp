
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getLoggedInInspectorAverageQualityChecks } from '@/lib/actions/inspectors';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface InspectorQualityCheckData {
  inspectorId: string;
  firstName: string;
  lastName: string;
  numberOfQualityChecks: number;
  // Add other properties as needed
}

export function LoggedInInspectorQualityCheckInfo() {
  const { status } = useSession();
  const [inspectorData, setInspectorData] = useState<InspectorQualityCheckData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      const fetchInspectorData = async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await getLoggedInInspectorAverageQualityChecks();
          setInspectorData(data);
        } catch (err: any) {
          setError(err.message || 'Failed to fetch inspector quality check data.');
        } finally {
          setLoading(false);
        }
      };

      fetchInspectorData();
    }
  }, [status]);

  if (loading) {
    return <Card><CardContent>Loading quality check information...</CardContent></Card>;
  }

  if (error) {
    return <Card><CardContent className="text-red-500">Error: {error}</CardContent></Card>;
  }

  if (!inspectorData) {
    return <Card><CardContent>No quality check information available for you.</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Quality Check Work</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Inspector ID: {inspectorData.inspectorId}</p>
        <p>Name: {inspectorData.firstName} {inspectorData.lastName}</p>
        <p>Number of Quality Checks Performed: {inspectorData.numberOfQualityChecks}</p>
        {/* Display other relevant information or calculations here */}
      </CardContent>
    </Card>
  );
}