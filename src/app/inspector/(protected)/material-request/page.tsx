"use client"

import { useState, useEffect } from "react"
// import { MaterialRequestForm } from "@/components/inspectors/material-request/material-request-form"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import MaterialRequestForm from "@/components/module/inspectors/inventory/MaterialRequestForm"
import ProductionHistoryDashboard from "@/components/module/history-logs/production-history-dashboard"
import ProductionHistoryTimeline from "@/components/module/history-logs/production-history-timeline"

interface WorkCenter {
  id: string
  name: string
}

interface InventoryItem {
  id: string
  name: string
  sku: string
  unit: string
  availableQuantity: number
}

export default function MaterialRequestPage() {
  const [showForm, setShowForm] = useState(false)
  const [workCenters, setWorkCenters] = useState<WorkCenter[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [workCentersRes, inventoryRes] = await Promise.all([
          import("../../../../lib/actions/material-request").then((mod) => mod.getWorkCenters()),
          import("../../../../lib/actions/material-request").then((mod) => mod.getInventoryItems()),
        ])

        setWorkCenters(workCentersRes)
        setInventoryItems(inventoryRes)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSubmit = async (data: any) => {
    try {
      const { createMaterialRequest } = await import("../../../../lib/actions/material-request")
      const result = await createMaterialRequest(data)

      if (result.success) {
        alert("Material request created successfully!")
        setShowForm(false)
      } else {
        alert("Failed to create material request")
      }
    } catch (error) {
      console.error("Error submitting request:", error)
      alert("Error creating material request")
    }
  }

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="container mx-auto p-6 space-y-10">
      {/* Material Requests Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Material Requests</h1>
            <p className="text-gray-600">Manage your material requests</p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        </div>

        {showForm && (
          <MaterialRequestForm
            // Uncomment and pass props if needed
            // workCenters={workCenters}
            // inventoryItems={inventoryItems}
            // onSubmit={handleSubmit}
            // onCancel={() => setShowForm(false)}
          />
        )}
      </div>

      {/* Production Order History Section */}
      <div>
        <div>
          <h1 className="text-3xl font-bold mb-2">Production Order History</h1>
          <p className="text-muted-foreground mb-6">
            Comprehensive tracking and visualization of production activities
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <ProductionHistoryDashboard />
          </div>
          <div>
            <ProductionHistoryTimeline />
          </div>
        </div>
      </div>
    </div>
  )
}

// export default function MaterialRequestPage() {
//   const [showForm, setShowForm] = useState(false)
//   const [workCenters, setWorkCenters] = useState<WorkCenter[]>([])
//   const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
//   const [loading, setLoading] = useState(true)

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const [workCentersRes, inventoryRes] = await Promise.all([
//           import("../../../../lib/actions/material-request").then((mod) => mod.getWorkCenters()),
//           import("../../../../lib/actions/material-request").then((mod) => mod.getInventoryItems()),
//         ])

//         setWorkCenters(workCentersRes)
//         setInventoryItems(inventoryRes)
//       } catch (error) {
//         console.error("Error fetching data:", error)
//       } finally {
//         setLoading(false)
//       }
//     }

//     fetchData()
//   }, [])

//   const handleSubmit = async (data: any) => {
//     try {
//       const { createMaterialRequest } = await import("../../../../lib/actions/material-request")
//       const result = await createMaterialRequest(data)

//       if (result.success) {
//         alert("Material request created successfully!")
//         setShowForm(false)
//       } else {
//         alert("Failed to create material request")
//       }
//     } catch (error) {
//       console.error("Error submitting request:", error)
//       alert("Error creating material request")
//     }
//   }

//   if (loading) {
//     return <div className="p-6">Loading...</div>
//   }

//   return (
//     <div className="container mx-auto p-6">
//       <div className="flex items-center justify-between mb-6">
//         <div>
//           <h1 className="text-3xl font-bold">Material Requests</h1>
//           <p className="text-gray-600">Manage your material requests</p>
//         </div>
//         <Button onClick={() => setShowForm(true)}>
//           <Plus className="h-4 w-4 mr-2" />
//           New Request
//         </Button>
//       </div>

//       {showForm && (
//         <MaterialRequestForm
//           // workCenters={workCenters}
//           // inventoryItems={inventoryItems}
//           // onSubmit={handleSubmit}
//           // onCancel={() => setShowForm(false)}
//         />
//       )}
//     </div>
//   )
// }
