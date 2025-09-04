# XGen MRP System

[![Netlify Status](https://api.netlify.com/api/v1/badges/1eb5243d-cf88-4513-bac6-d50aa5b156b2/deploy-status)](https://app.netlify.com/projects/xgen-mrp/deploys)

A comprehensive Material Requirements Planning (MRP) system designed for clothing manufacturers, providing end-to-end solutions for production planning, inventory management, quality control, and delivery management.

## 🚀 Quick Installation

### 🎯 For End Users (Easiest)
**Want to use XGEN-MRP? Start here:**

1. **📋 [EASY_INSTALL.md](./EASY_INSTALL.md)** - Super simple 3-step installation
2. **📖 [QUICK_INSTALL.md](./QUICK_INSTALL.md)** - Detailed user-friendly guide with troubleshooting

### 🔧 For Developers
**Want to modify or contribute to XGEN-MRP?**

1. **🐳 [DOCKER_TUTORIAL.md](./DOCKER_TUTORIAL.md)** - Complete Docker development guide
2. **📚 [Development Setup](#development-setup)** - Traditional development environment

---

## 🎯 Choose Your Installation Method

| User Type | Recommended Guide | What You Get |
|-----------|-------------------|-------------|
| **👥 End Users** | [EASY_INSTALL.md](./EASY_INSTALL.md) | Ready-to-use system in 5 minutes |
| **👨‍💻 Developers** | [DOCKER_TUTORIAL.md](./DOCKER_TUTORIAL.md) | Dev + Prod environments |
| **🏢 IT Teams** | [DEPLOYMENT_DOCKER.md](./DEPLOYMENT_DOCKER.md) | Enterprise deployment guide |

## System Architecture

### Technology Stack

- **Frontend**: Next.js 14, TypeScript, TailwindCSS, Shadcn/UI
- **Backend**: Next.js Server Actions, Prisma ORM, tRPC
- **Database**: PostgreSQL with comprehensive schema design
- **Authentication**: NextAuth.js with role-based access control
- **Deployment**: Vercel (Web), Electron (Desktop application)
- **Testing**: Vitest, React Testing Library
- **Styling**: TailwindCSS with custom component library

### Database Structure Overview

The system uses a comprehensive PostgreSQL schema with 50+ interconnected tables covering:

#### Core Entities

- **Users & Authentication**: Complete user management with profiles, roles, and permissions
- **Products & Materials**: Full product lifecycle with variants, BOMs, and inventory tracking
- **Production Management**: Production orders, operations, work centers, and resource allocation
- **Inventory Control**: Real-time stock tracking, movements, reservations, and adjustments
- **Quality Assurance**: Inspection workflows, defect tracking, and quality metrics
- **Customer Management**: Customer orders, billing, delivery, and relationship management
- **Supplier Management**: Supplier relationships, purchase orders, and procurement

#### Key Schema Features

- **Multi-tenant support** with role-based access control
- **Product variant system** supporting size/color/style variations
- **Comprehensive BOM management** with inheritance and overrides
- **Real-time inventory tracking** with reservation and consumption workflows
- **Production planning** with capacity management and scheduling
- **Quality control integration** throughout production lifecycle
- **Financial integration** with billing, invoicing, and cost tracking
- **Audit trail** for all critical operations and changes

## Module Structure & User Roles

### Role-Based Architecture

#### Admin Interface

- **User Management**: Complete CRUD operations for all user types
- **System Configuration**: Product categories, material types, units of measure
- **Production Oversight**: Monitor all production orders and resource allocation
- **Financial Management**: Billing statements, sales invoices, and cost analysis
- **Master Data Management**: Suppliers, customers, work centers, and routing

#### Worker Interface

- **Task Dashboard**: Personalized task assignments and work queues
- **Production Operations**: Execute production orders with real-time updates
- **Inventory Transactions**: Material consumption, transfers, and adjustments
- **Quality Reporting**: Submit quality issues and production feedback
- **Performance Tracking**: Individual productivity metrics and history

#### Inspector Interface

- **Quality Dashboard**: Inspection queues and quality metrics
- **Inspection Workflows**: Structured quality checks with photo documentation
- **Defect Management**: Comprehensive defect tracking and analysis
- **Material Verification**: Incoming material quality validation
- **Compliance Reporting**: Quality metrics and regulatory compliance

#### Delivery Interface

- **Delivery Queue**: Assigned delivery tasks with customer details
- **Route Optimization**: GPS-based routing and delivery sequencing
- **Customer Interaction**: Digital signatures and delivery confirmation
- **Real-time Tracking**: Live delivery status updates
- **Proof of Delivery**: Photo documentation and digital receipts

## Production Workflow

### End-to-End Process Flow

1. **Customer Order Management**

   - Order creation with line items and variants
   - Automatic production planning based on stock availability
   - Customer communication and status updates

2. **Production Planning**

   - Automatic BOM explosion and material requirements
   - Capacity planning across work centers
   - Resource reservation and allocation
   - Priority-based scheduling

3. **Material Management**

   - Real-time inventory tracking with reservations
   - Automated purchase order generation for shortages
   - Material requisition and approval workflows
   - Supplier performance tracking

4. **Production Execution**

   - Work center task assignment
   - Real-time production status updates
   - Material consumption tracking
   - Quality checkpoints integration

5. **Quality Control**

   - In-process quality checks
   - Final inspection workflows
   - Defect tracking and resolution
   - Quality metrics and reporting

6. **Delivery & Billing**

   - Automated delivery assignment
   - Customer communication and confirmation
   - Digital delivery receipts
   - Automated billing and invoicing

## Data Model Highlights

### Product & Inventory System
- **Product Variants**: Support for size, color, and style variations
- **BOM Management**: Hierarchical BOM with inheritance and overrides
- **Real-time Inventory**: Live stock levels with reservation system
- **Variant Templates**: Reusable product configuration templates

### Production Management
- **Work Center Management**: Capacity planning and resource allocation
- **Operation Scheduling**: Priority-based task assignment
- **Material Reservations**: Real-time material allocation
- **Cost Tracking**: Actual vs planned cost analysis

### Quality & Compliance
- **Inspection Workflows**: Configurable quality checkpoints
- **Defect Tracking**: Comprehensive defect categorization and analysis
- **Quality Metrics**: Real-time quality dashboards and reporting
- **Audit Trail**: Complete history of all quality activities

### Financial Integration
- **Cost Variance Analysis**: Real-time cost tracking and analysis
- **Billing Automation**: Automated billing statement generation
- **Invoice Management**: Complete invoice lifecycle management
- **Payment Tracking**: Customer payment status and history

## Development Setup

### Prerequisites

- **Node.js**: 18.x or higher
- **PostgreSQL**: 14.x or higher
- **npm**: Latest stable version
- **Git**: For version control

### Installation Steps

1. **Clone Repository**

   ```bash
   git clone https://github.com/yourusername/xgen-mrp.git
   cd xgen-mrp
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Environment Configuration**

   ```bash
   cp .env.example .env
   # Edit .env with your database and API credentials
   ```

4. **Database Setup**

   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run migrations
   npx prisma migrate dev
   
   # Seed database with sample data (optional)
   npm run seed
   ```

5. **Development Server**

   ```bash
   npm run dev
   # Access at http://localhost:3000
   ```

6. **Testing**

   ```bash
   # Run all tests
   npm test
   
   # Run specific test suites
   npm run test:unit
   npm run test:integration
   npm run test:e2e
   ```

### Environment Variables

Required environment variables:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/xgen_mrp"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# API Keys (if using external services)
# Add your specific API keys here
```

## Database Management

### Schema Overview
The database contains 50+ interconnected tables covering:
- User management and authentication
- Product and material master data
- Production planning and execution
- Inventory management and control
- Quality assurance and compliance
- Customer and supplier management
- Financial transactions and billing

### Key Relationships
- **Users** → **Roles** → **Permissions** → **Access Control**
- **Products** → **Variants** → **BOMs** → **Materials**
- **Customer Orders** → **Production Orders** → **Operations** → **Quality Checks**
- **Inventory** → **Movements** → **Reservations** → **Consumption**

### Sample Data
The system includes comprehensive seed data for:
- Sample products with variants
- Material master data
- Supplier and customer records
- Production orders and operations
- Quality inspection templates

## Documentation & Resources

### 📋 Comprehensive Documentation

#### Role-Based Documentation
- **[Admin Role Documentation](./docs/roles/admin/README.md)** - Complete system administration guide covering user management, production oversight, financial management, and system configuration
- **[Worker Role Documentation](./docs/roles/worker/README.md)** - Production team guide covering task execution, inventory management, quality reporting, and mobile features
- **[Inspector Role Documentation](./docs/roles/inspector/README.md)** - Quality control guide covering inspection workflows, defect management, compliance, and quality metrics
- **[Delivery Role Documentation](./docs/roles/delivery/README.md)** - Delivery management guide covering route optimization, customer service, mobile features, and performance tracking

#### Feature-Specific Documentation
- **[Production Management](./docs/features/production/README.md)** - Complete production planning, execution, and monitoring guide
- **[Inventory Management](./docs/features/inventory/README.md)** - Comprehensive inventory tracking, replenishment, and analytics guide
- **[Quality Control](./docs/features/quality/README.md)** - Quality assurance guide covering inspection planning, defect tracking, and compliance
- **[Customer Management](./docs/features/customer-management/README.md)** - Customer relationship management, sales order processing, and delivery management
- **[Billing & Invoicing](./docs/features/billing/README.md)** - Financial management guide covering invoice generation, payment processing, and revenue recognition
- **[Technical Documentation](./docs/technical/README.md)** - System administration guide covering deployment, configuration, security, and troubleshooting

### Architecture Documentation
- **[System Architecture](./notes/System_Architecture.md)**: Complete technical architecture overview including database design, API structure, and deployment strategies
- **[Database Schema](./notes/Database_Schema.md)**: Detailed database documentation with ERD diagrams and relationship explanations
- **[API Documentation](./notes/API_Documentation.md)**: Complete REST and GraphQL API documentation with examples
- **[Development Guidelines](./notes/Development_Guidelines.md)**: Coding standards, testing practices, and deployment procedures

### Technical Resources
- **[Component Library](./notes/Component_Library.md)**: Reusable UI components and design system
- **[Testing Guide](./notes/Testing_Guide.md)**: Comprehensive testing strategy and implementation
- **[Deployment Guide](./notes/Deployment_Guide.md)**: Production deployment procedures and best practices
- **[Troubleshooting](./notes/Troubleshooting.md)**: Common issues and their solutions

### Development Resources
- **[Code Examples](./examples/)**: Working code examples for common use cases
- **[Database Queries](./queries/)**: Optimized SQL queries for reporting and analytics
- **[Integration Guides](./integrations/)**: Third-party system integration documentation

### Future Development
- **[Development Roadmap](./notes/Development_Roadmap.md)**: Planned features and development timeline
- **[Missing Features](./notes/Missing_Features_and_Improvements.md)**: Known gaps and enhancement opportunities
- **[Technical Debt](./notes/Technical_Debt.md)**: Identified technical debt and refactoring plans

## API Reference

### Core Endpoints
- **Production API**: `/api/production/*` - Production order management
- **Inventory API**: `/api/inventory/*` - Stock movements and adjustments
- **Quality API**: `/api/quality/*` - Quality checks and inspections
- **Customer API**: `/api/customers/*` - Customer and order management
- **Billing API**: `/api/billing/*` - Financial transactions and invoicing

### Authentication
- **JWT-based authentication** with role-based access control
- **Session management** with automatic expiration
- **API rate limiting** for security and performance
- **Audit logging** for all user actions

## Support & Contributing

### Getting Help
- **GitHub Issues**: Report bugs and request features
- **Discussions**: General questions and community support
- **Documentation**: Comprehensive guides and tutorials
- **Examples**: Working code samples and use cases

### Contributing
- **Development Setup**: Complete development environment setup
- **Code Standards**: ESLint, Prettier, and TypeScript configuration
- **Testing Requirements**: Unit, integration, and e2e testing standards
- **Pull Request Process**: Step-by-step contribution guidelines

### Community
- **Discord**: Real-time community support and discussions
- **Stack Overflow**: Technical questions and answers
- **GitHub**: Source code, issues, and project management

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For questions or support, please contact the development team.

### Temporary Test Accounts

For testing purposes, the following accounts are available:

**Admin Account:**
- Email: admin@example.com
- Password: admin123

**Worker Account:**
- Email: worker@example.com
- Password: worker123
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



# 1. Push current schema to create tables
npx prisma db push

# 2. Generate Prisma client
npx prisma generate

# 3. Run seed files to populate data
npm run seed
# OR run individual seed files:
npx tsx prisma/seed.ts
npx tsx prisma/customers-suppliers-seed.ts
npx tsx prisma/materials-products-seed.ts
npx tsx prisma/developer-seed.ts