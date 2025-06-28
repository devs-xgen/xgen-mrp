// Production Order Process Flow Graph
export const PRODUCTION_ORDER_PROCESS_FLOW = `graph TD
    A["1. Customer Order Created<br/>📋 Order placed with products & quantities"] --> B["2. Analyze Order Lines<br/>🔍 System analyzes each product requirement"]
    B --> C["3. Check Stock Availability<br/>📦 Verify current inventory levels"]
    C --> D["4. Check Material Availability<br/>🔧 Verify raw materials for production"]
    D --> E["5. Generate Production Options<br/>⚙️ Create production recommendations"]
    E --> F["6. User Reviews & Decides<br/>👥 Admin reviews and approves options"]
    F --> G["7. Create Production Orders<br/>🏭 Generate manufacturing orders"]
    G --> H["8. Create ProductionBOM<br/>📋 Generate bill of materials"]
    H --> I["9. Create Operations<br/>🔧 Define work center operations"]
    I --> J["10. Link to Customer Order<br/>🔗 Connect production to original order"]
    
    style A fill:#dbeafe,stroke:#3b82f6,stroke-width:2px,color:#1e40af
    style B fill:#e0e7ff,stroke:#6366f1,stroke-width:2px,color:#3730a3
    style C fill:#dcfce7,stroke:#22c55e,stroke-width:2px,color:#166534
    style D fill:#d1fae5,stroke:#10b981,stroke-width:2px,color:#065f46
    style E fill:#fef3c7,stroke:#f59e0b,stroke-width:2px,color:#92400e
    style F fill:#fed7aa,stroke:#ea580c,stroke-width:2px,color:#9a3412
    style G fill:#fecaca,stroke:#ef4444,stroke-width:2px,color:#991b1b
    style H fill:#fce7f3,stroke:#ec4899,stroke-width:2px,color:#be185d
    style I fill:#f3e8ff,stroke:#a855f7,stroke-width:2px,color:#7c2d12
    style J fill:#ede9fe,stroke:#8b5cf6,stroke-width:2px,color:#6b21a8`;

// Function to load graph content
export async function loadGraphFile(graphName: string): Promise<string> {
  switch (graphName) {
    case "production-order-process-flow":
      return PRODUCTION_ORDER_PROCESS_FLOW;
    default:
      throw new Error(`Graph file "${graphName}" not found`);
  }
}

// Graph metadata
export interface GraphMetadata {
  name: string;
  title: string;
  description: string;
  category: string;
}

export const AVAILABLE_GRAPHS: GraphMetadata[] = [
  {
    name: "production-order-process-flow",
    title: "Production Order Creation Process",
    description:
      "Complete workflow from customer order to production execution",
    category: "Manufacturing",
  },
];

// Function to get graph metadata
export function getGraphMetadata(graphName: string): GraphMetadata | null {
  return AVAILABLE_GRAPHS.find((graph) => graph.name === graphName) || null;
}
