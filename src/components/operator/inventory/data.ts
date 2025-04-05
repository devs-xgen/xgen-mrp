

export type InventoryItem = {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  unit: string;
  minStock: number;
  location: string;
  status: 'normal' | 'low' | 'critical';
};

export async function getInventoryItems(search?: string): Promise<InventoryItem[]> {
  try {
    // In a real implementation, this would fetch from the database
    // For now, we'll return mock data
    const items = [
      {
        id: "MAT-001",
        name: "Cotton Fabric",
        category: "Raw Materials",
        currentStock: 240,
        unit: "yards",
        minStock: 200,
        location: "Warehouse A, Shelf B12",
      },
      {
        id: "MAT-002",
        name: "Buttons (Small)",
        category: "Components",
        currentStock: 1250,
        unit: "pcs",
        minStock: 1000,
        location: "Warehouse A, Bin C45",
      },
      {
        id: "MAT-003",
        name: "Zippers (20cm)",
        category: "Components",
        currentStock: 50,
        unit: "pcs",
        minStock: 100,
        location: "Warehouse A, Bin D12",
      },
      {
        id: "MAT-004",
        name: "Thread (Black)",
        category: "Consumables",
        currentStock: 30,
        unit: "spools",
        minStock: 50,
        location: "Warehouse B, Shelf A3",
      },
      {
        id: "PRD-001",
        name: "T-Shirt (Medium)",
        category: "Finished Goods",
        currentStock: 120,
        unit: "pcs",
        minStock: 80,
        location: "Warehouse C, Section F",
      },
    ];

    // Add status based on stock levels
    const itemsWithStatus = items.map(item => {
      let status: 'normal' | 'low' | 'critical' = 'normal';
      
      if (item.currentStock < item.minStock) {
        status = 'low';
      }
      
      if (item.currentStock < item.minStock / 2) {
        status = 'critical';
      }
      
      return {
        ...item,
        status
      };
    });

    // Filter by search term if provided
    if (search) {
      const searchLower = search.toLowerCase();
      return itemsWithStatus.filter(item => 
        item.name.toLowerCase().includes(searchLower) || 
        item.id.toLowerCase().includes(searchLower) ||
        item.category.toLowerCase().includes(searchLower)
      );
    }

    return itemsWithStatus;
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    throw new Error('Failed to fetch inventory items');
  }
}

export async function getInventoryStats() {
  try {
    const items = await getInventoryItems();
    
    const totalItems = items.length;
    const lowStockItems = items.filter(item => item.status === 'low').length;
    const criticalItems = items.filter(item => item.status === 'critical').length;
    
    return {
      totalItems,
      lowStockItems,
      criticalItems
    };
  } catch (error) {
    console.error('Error fetching inventory stats:', error);
    throw new Error('Failed to fetch inventory statistics');
  }
} 