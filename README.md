# XGen MRP System

[![Netlify Status](https://api.netlify.com/api/v1/badges/1eb5243d-cf88-4513-bac6-d50aa5b156b2/deploy-status)](https://app.netlify.com/projects/xgen-mrp/deploys)


A comprehensive Material Requirements Planning (MRP) system designed for clothing manufacturers, providing end-to-end solutions for production planning, inventory management, quality control, and delivery management.

## System Overview

XGen MRP is built using modern web technologies to provide a flexible, scalable platform for manufacturing resource planning:

- **Frontend**: Next.js, TypeScript, TailwindCSS, Shadcn/UI
- **Backend**: Next.js Server Actions, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **Deployment**: Vercel (Web), Electron (Desktop)

## Key Features

- **Multi-role Access**: Role-based interfaces for admins, workers, inspectors, and delivery personnel
- **Production Planning**: Complete workflow from customer orders to finished goods
- **Inventory Management**: Real-time inventory tracking, stock level management, and material requisitioning
- **Quality Control**: Inspection workflows, defect tracking, and quality reporting
- **Delivery Management**: Delivery assignment, routing, and status tracking

## Module Structure

The system is organized into several key modules:

### Admin Module
- User management
- Product and material configuration
- Production planning and monitoring
- Supplier and customer management

### Worker Module
- Task management and execution
- Inventory operations
- Production status reporting
- Quality issue reporting

### Inspector Module
- Quality checks and inspections
- Defect reporting and tracking
- Material quality verification
- Quality metrics and analytics

### Delivery Module
- Delivery task management
- Customer interaction
- Delivery confirmation
- Route planning and optimization

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- PostgreSQL 14.x or higher
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/xgen-mrp.git
   cd xgen-mrp
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   ```
   cp .env.example .env
   ```
   Then fill in the required environment variables in .env

4. Set up the database:
   ```
   npx prisma migrate dev
   ```

5. Run the development server:
   ```
   npm run dev
   ```

6. Access the application at http://localhost:3000

## Documentation

Comprehensive documentation is available in the [notes](./notes) directory:

- [System Architecture](./notes/System_Architecture.md) - Technical architecture overview
- [MRP System Guide](./notes/MRP_System_Guide.md) - General system overview
- [Development Guidelines](./notes/Development_Guidelines.md) - Development standards
- [Role-Based Features](./notes/Role_Based_Features.md) - User roles and permissions

Module-specific documentation:
- [Worker Module Guide](./notes/Worker_Module_Guide.md)
- [Inspector Module Guide](./notes/Inspector_Module_Guide.md)
- [Delivery Module Guide](./notes/Delivery_Module_Guide.md)

Future plans:
- [Development Roadmap](./notes/Development_Roadmap.md)
- [Missing Features and Improvements](./notes/Missing_Features_and_Improvements.md)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For questions or support, please contact the development team.

#temporary account

Admin user created: {
  email: admin@example.com
  password: admin123
}

Admin user created: {
  email: worker@example.com
  password: worker123
}
```



products need na mins hindi day


dropdown inventory system in navigation 
creating materials page in.

default suyppliers purchase

```
npx prisma generate
npx prisma --version
npx prisma migrate dev --name add_chuchubbells

npx prisma db pull
npx prisma db push
```
