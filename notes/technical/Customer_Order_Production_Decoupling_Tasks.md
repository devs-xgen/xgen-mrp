# Customer Order & Production Decoupling - Task List

**Project**: Customer Order & Production Planning Decoupling  
**Document Version**: 2.0  
**Date**: January 7, 2025  
**Status**: Revised for Correct Implementation  

---

## 📋 Task Overview

This task list corresponds to the revised PRD for properly separating customer order creation from production planning. The key insight is that "unified" means consistent UI design, not mixed functionality in one form.

**Total Phases**: 4  
**Estimated Timeline**: 12-16 working days (2.5-3 weeks)  
**Priority**: High  

---

## ✅ Completed Tasks

### General Planning
- [x] **📋 PRD: Customer Order & Production Decoupling** - Created comprehensive PRD document with 6 phases and 25-31 day timeline
- [x] **🔄 PRD Revision** - Corrected understanding of client requirements and implementation approach

---

## 🔄 Phase 1: Separate Customer Order Creation (3-4 days)

### Task 1.1: Create Dedicated Customer Order Form
- [ ] **🎯 PHASE 1.1: Create dedicated customer order creation form at /admin/customer-orders/create**
  - **New File**: `/src/app/admin/(protected)/customer-orders/create/page.tsx`
  - **New Component**: `/src/components/module/admin/customer-orders/create/CustomerOrderCreateClient.tsx`
  - **Features**: Customer selection, product/variant selection, quantity/pricing, order notes
  - **Critical**: NO production planning integration
  - **Priority**: HIGH - Core functionality

### Task 1.2: Update Customer Orders Page Navigation
- [ ] **🔗 PHASE 1.2: Update "Create Order" button to point to customer order creation instead of production create**
  - **File**: `/src/app/admin/(protected)/customer-orders/page.tsx`
  - **Action**: Change button href from `/admin/production/create` to `/admin/customer-orders/create`
  - **Priority**: HIGH - Navigation fix

### Task 1.3: Customer Order Creation Actions
- [ ] **⚡ PHASE 1.3: Ensure createCustomerOrder() creates orders independently without production planning**
  - **File**: `/src/lib/actions/customer-order.ts`
  - **Action**: Verify no production order creation logic in customer order creation
  - **Focus**: Order archiving and data integrity
  - **Priority**: HIGH - Core functionality

---

## 🏭 Phase 2: Production Planning Separation (4-5 days)

### Task 2.1: Refactor Production Create Form
- [ ] **🔧 PHASE 2.1: Remove customer order creation functionality from production create form**
  - **File**: `/src/components/module/admin/production/create/ProductionCreateClient.tsx`
  - **Action**: Remove "From Customer Order" source option
  - **Focus**: Standalone production orders only
  - **Priority**: HIGH - Separation of concerns

### Task 2.2: Update Production Create Page
- [ ] **📝 PHASE 2.2: Update production create page to focus only on production order creation**
  - **File**: `/src/app/admin/(protected)/production/create/page.tsx`
  - **Action**: Remove customer order data fetching
  - **Update**: Metadata and descriptions to reflect production-only focus
  - **Priority**: MEDIUM - UI/UX clarity

### Task 2.3: Production Planning Dashboard Enhancement
- [ ] **📊 PHASE 2.3: Enhance production planning dashboard as primary interface for production planning**
  - **File**: `/src/app/admin/(protected)/production/planning/page.tsx`
  - **Enhancements**: Support batch production order creation from customer order analysis
  - **Features**: Link to customer order analysis results
  - **Priority**: HIGH - Production planning workflow

---

## 🔍 Phase 3: Order Analysis Integration (3-4 days)

### Task 3.1: Customer Order Analysis Workflow
- [ ] **🎯 PHASE 3.1: Enhance customer order analysis as bridge between orders and production planning**
  - **File**: `/src/app/admin/(protected)/customer-orders/[id]/analyze/page.tsx`
  - **Enhancements**: Clear navigation to production planning
  - **Features**: Support stock allocation for available items
  - **Priority**: HIGH - Workflow integration

### Task 3.2: Analysis to Production Planning Flow
- [ ] **🔗 PHASE 3.2: Create production planning actions component for analysis page**
  - **New Component**: `/src/components/module/admin/customer-orders/analysis/ProductionPlanningActions.tsx`
  - **Features**: "Create Production Orders" button, "Allocate Stock" button
  - **Navigation**: To production planning dashboard
  - **Priority**: HIGH - Workflow completion

---

## 🎨 Phase 4: UI/UX Consistency (2-3 days)

### Task 4.1: Unified Design System
- [ ] **🎨 PHASE 4.1: Ensure consistent form layouts and design across customer order and production creation**
  - **Files**: Multiple component files
  - **Goals**: Unified button styles, card layouts, spacing, validation patterns
  - **Priority**: MEDIUM - User experience

### Task 4.2: Navigation and Workflow Clarity
- [ ] **🧭 PHASE 4.2: Implement clear navigation and workflow progression indicators**
  - **Files**: Multiple page files
  - **Features**: Breadcrumb navigation, consistent headers, back navigation
  - **Priority**: MEDIUM - User experience

---

## 🔄 Legacy Tasks (For Reference - What We Fixed)

### High-Level Tasks (What We Corrected)
- [x] **❌ REMOVED: Unify customer order and production creation in one form**
- [x] **❌ REMOVED: Mix production planning with customer order creation**
- [x] **✅ ADDED: Separate customer order creation workflow**
- [x] **✅ ADDED: Independent production planning workflow**
- [x] **✅ ADDED: Unified UI design (not unified functionality)**

---

## 📝 Implementation Notes

### Critical Dependencies:
1. **Phase 1** must be completed before Phase 2
2. **Customer order creation** must be completely independent
3. **Production planning** should only happen after order analysis
4. **UI consistency** across all forms is crucial

### Risk Mitigation:
- Test each phase thoroughly before proceeding
- Maintain rollback procedures for critical changes
- Document all changes for user training
- Ensure clear separation of workflows

### Success Metrics:
- ✅ Customer orders can be created independently
- ✅ Production planning is separate and optional
- ✅ Orders are saved for archiving immediately
- ✅ Clear workflow separation maintained
- ✅ Consistent UI design across forms

### Key Insights:
- **"Unified"** = Consistent UI design and user experience
- **"Separate"** = Independent workflows for different business processes  
- **"Flexible"** = Production planning only when needed, not forced

---

**Document Status**: 📋 Revised for Correct Implementation  
**Next Action**: Begin Phase 1.1 - Create Dedicated Customer Order Form  
**Last Updated**: January 7, 2025
