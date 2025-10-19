# SuperAdmin Quick Start Guide

This guide will help you get started with the SuperAdmin portal in under 10 minutes.

## 🚀 First Login

### 1. Access SuperAdmin Portal

**URL:** `http://localhost:3001/superadmin/login` (or your deployed URL)

**Default Credentials:**
- Email: `dev@xgen-mrp.local`
- Password: `dev123!@#`

**Note:** The developer account can access all portals. In production, create dedicated SuperAdmin accounts.

### 2. Dashboard Overview

After login, you'll land on the SuperAdmin Dashboard at `/superadmin/dashboard`.

**What You'll See:**
- Total Users & Active Users
- Customer metrics (orders, total customers)
- Production order count
- Material and product totals
- Support ticket count

**Quick Actions:**
- Click any metric card to navigate to that feature
- Use sidebar navigation for all features

---

## 🎯 Essential Tasks

### Task 1: View All Production Orders (2 minutes)

**Goal:** Understand system-wide production status

1. Click **Production** in the sidebar
2. View the statistics dashboard at the top:
   - Total orders
   - Orders by status
   - Orders by priority
   - Cost variance
3. Scroll down to see the complete orders table
4. **Try:** Click column headers to sort
5. **Try:** Use search box to find specific orders

**What to Look For:**
- Overdue orders (red indicators)
- High variance orders (yellow/red)
- Orders with CRITICAL priority

---

### Task 2: Export Production Data (3 minutes)

**Goal:** Generate Excel report for analysis

1. On the Production page, click **Export** button (top right)
2. Choose **Excel** format
3. Wait for file generation (2-5 seconds)
4. File auto-downloads as `production-orders-{timestamp}.xlsx`

**What You Get:**
- 21 columns including costs, status, priority
- Currency formatting
- Color-coded status indicators

**Use Cases:**
- Share with management
- Analysis in Excel/Google Sheets
- Historical record keeping

---

### Task 3: Reset a User Password (2 minutes)

**Goal:** Help a user who forgot their password

1. Click **Global Users** in the sidebar
2. Find the user in the table (use search if needed)
3. Click the **key icon** (🔑) in the Actions column
4. Enter new password (minimum 8 characters)
5. Confirm password
6. Click **Update Password**

**Important:**
- User will be notified (if email configured)
- Password must be at least 8 characters
- User should change it on next login

---

### Task 4: View Production Order Details (2 minutes)

**Goal:** Inspect a specific production order

1. Navigate to **Production**
2. Click on any order row (or click the order number link)
3. View the detailed page showing:
   - Order header (product, quantity, dates)
   - Material BOM with costs
   - Operations and work centers
   - Quality checks
   - Activity history

**Things to Try:**
- Check material reservations
- View operation progress
- Review cost breakdown

---

### Task 5: Export Database Table (3 minutes)

**Goal:** Extract data directly from database

1. Click **Export Data** in the sidebar
2. See list of all available tables with row counts
3. Click **Export** next to any table (try "User" first)
4. Wait for Excel generation
5. File downloads as `{tableName}-export-{timestamp}.xlsx`

**Powerful Use Cases:**
- Emergency data backup
- Custom analysis not available in UI
- Data migration preparation
- Debugging production issues

**Security Note:** This is a powerful feature - only export what you need!

---

## ⚡ Advanced Tasks

### Force Update Production Order Status (5 minutes)

**Scenario:** An order is stuck in IN_PROGRESS but needs to be marked COMPLETED urgently.

**Steps:**

1. Navigate to **Production**
2. Find the stuck order
3. Click the order to open details
4. Click **Override Actions** dropdown
5. Select **Force Status Update**
6. In the dialog:
   - Select new status: **COMPLETED**
   - Enter reason (required, min 10 chars): "Emergency completion per customer request - ticket #1234"
   - Review warning message
7. Click **Confirm Override**
8. Verify status changed
9. Check audit trail at bottom of page

**What Happens:**
- Status updates immediately
- Normal workflow validation bypassed
- Audit log entry created with your reason
- Activity log updated

**When to Use:**
- Customer emergency requests
- System workflow bugs
- Data correction after system issues

**When NOT to Use:**
- Regular workflow progression (use normal buttons)
- Training/testing (use test environment)

---

### Override Production Order Costs (4 minutes)

**Scenario:** Accounting found an error in material costs that needs correction.

**Steps:**

1. Open production order details
2. Click **Override Actions** → **Override Costs**
3. In the dialog:
   - **Planned Cost:** Enter corrected value
   - **Actual Cost:** Enter corrected value
   - **Variance:** Will auto-calculate or enter manually
   - **Reason:** "Correcting material cost per accounting - invoice #5678"
4. Click **Confirm Override**
5. Verify costs updated
6. Check financial reports reflect changes

**Impact:**
- Affects profit/loss calculations
- Updates variance reports
- Audit trail created

**Coordinate With:**
- Accounting department
- Financial reporting team

---

### Bulk Update Multiple Orders (5 minutes)

**Scenario:** Need to change priority on 10 orders due to customer deadline.

**Steps:**

1. Navigate to **Production**
2. Filter orders (if needed) using search/filters
3. Use checkboxes to select orders:
   - Click checkbox next to each order
   - Or use "Select All" if filtering
4. Click **Bulk Update** button (appears after selection)
5. In the dialog:
   - Choose **Priority**: HIGH (or status change)
   - Enter reason: "Customer deadline moved up - bulk priority change"
6. Click **Apply to Selected Orders**
7. Wait for confirmation (all orders update)
8. Single audit log entry created for batch

**Best Practices:**
- Verify selection before confirming
- Use specific reasons
- Maximum recommended: 50 orders at once
- For larger batches, coordinate with dev team

---

## 📋 Daily Workflow

### Morning Routine (10 minutes)

1. **Check Dashboard** (2 min)
   - Review system health metrics
   - Check for critical alerts
   - Note any anomalies

2. **Review Production Status** (5 min)
   - Check overdue orders count
   - Review high variance orders
   - Identify bottlenecks

3. **Check User Activity** (3 min)
   - Review recent password reset requests
   - Check for unusual access patterns
   - Verify active user count

### Weekly Tasks

- **Monday:** Export production data for management review
- **Wednesday:** Review audit logs for override operations
- **Friday:** Check material variance reports, export if needed

---

## 🔐 Security Best Practices

### 1. Override Operations

**Always Include:**
- Ticket numbers (e.g., "Per ticket #1234")
- Customer references (e.g., "Customer ABC urgent request")
- Internal approvals (e.g., "Approved by production manager John Doe")

**Never:**
- Use vague reasons ("fixing issue", "needed update")
- Override without communication
- Bypass accounting coordination for cost changes

### 2. Password Resets

**Do:**
- Verify user identity before reset
- Use strong temporary passwords
- Communicate reset to user
- Log support ticket reference

**Don't:**
- Reset without user request
- Use simple passwords
- Share passwords via insecure channels

### 3. Data Exports

**Approved Use:**
- Management reporting
- Analysis for decision-making
- Backup before major changes
- Support ticket investigation

**Restricted Use:**
- Exporting customer PII without approval
- Sharing exports outside organization
- Regular exports without purpose

---

## 🆘 Common Problems & Solutions

### Problem: "Unauthorized" error on production page

**Solution:**
1. Check you're logged in as SUPER_ADMIN role
2. Check session hasn't expired (8-hour limit)
3. Try logout and login again
4. Verify in database: `User.role` = 'SUPER_ADMIN'

---

### Problem: Override dialog not saving

**Possible Causes:**
- Reason field too short (minimum 10 characters)
- Network timeout
- Database connection issue

**Solution:**
1. Check reason field length
2. Check browser console for errors
3. Try again with longer reason
4. Check network connection

---

### Problem: Export not downloading

**Solution:**
1. Check browser popup blocker
2. Check download folder permissions
3. Try different browser
4. Check file size (very large exports may timeout)

---

### Problem: Can't find specific production order

**Solution:**
1. Use search box (searches order number, product name)
2. Try clearing filters
3. Check if order was deleted (check audit logs)
4. Verify order exists in database export

---

## 📚 Next Steps

### Week 1: Familiarization
- ✅ Complete all essential tasks above
- ✅ Export and review all available data
- ✅ Practice navigation
- ✅ Read full README documentation

### Week 2: Basic Operations
- ✅ Perform supervised override operations
- ✅ Reset user passwords
- ✅ Generate weekly reports
- ✅ Review audit trails

### Week 3: Advanced Operations
- ✅ Independent override operations
- ✅ Bulk updates
- ✅ Cost adjustments (with accounting)
- ✅ Emergency procedures

### Week 4: Mastery
- ✅ Train other admins
- ✅ Develop reporting templates
- ✅ Optimize daily workflows
- ✅ Document best practices for your organization

---

## 🔗 Related Documentation

- **[SuperAdmin README](./README.md)** - Complete feature documentation
- **[Main Documentation](../../README.md)** - System overview
- **[Admin Documentation](../admin/README.md)** - Regular admin comparison
- **[Technical Documentation](../../technical/README.md)** - Advanced topics

---

## 💡 Pro Tips

1. **Bookmark Production Page:** You'll use it most often
2. **Create Custom Filters:** Save time finding specific orders
3. **Export Before Major Changes:** Always backup data before bulk operations
4. **Document Your Reasons:** Future you (and auditors) will thank you
5. **Review Audit Trail Weekly:** Catch issues early
6. **Coordinate With Teams:** Override operations affect multiple departments
7. **Test in Development:** If available, test override operations there first

---

**Ready to dive deeper?** Continue to the [full SuperAdmin documentation](./README.md) for comprehensive feature coverage.

---

*Last Updated: 2025-10-19*
