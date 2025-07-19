# QR Scanner Testing Guide

**Created:** 2024-12-19  
**Status:** Ready for Testing 🧪  

## Overview

This guide explains how to test the newly implemented QR scanner functionality for worker production management.

## What Was Fixed

### 1. **Camera Access Issues**
- ✅ Improved camera permission handling
- ✅ Better error messages for camera failures
- ✅ Preference for back camera (better for QR scanning)
- ✅ Simplified camera initialization process

### 2. **QR Code Processing**
- ✅ Supports both JSON and plain text QR codes
- ✅ Automatically extracts production order ID
- ✅ Fetches real production order data from API
- ✅ Validates worker access to the production order

### 3. **Enhanced UI**
- ✅ Real production order details display
- ✅ Worker operations listing
- ✅ Status update with notes capability
- ✅ Loading states and error handling

## Testing Steps

### Step 1: Access the QR Scanner
1. Login as a worker user
2. Navigate to `/worker/qr-scanner`
3. You should see two tabs: "Use Camera" and "Upload Image"

### Step 2: Test Camera Functionality
1. Click "Start Camera" button
2. Allow camera permissions when prompted
3. Position a QR code in front of the camera
4. The scanner should automatically detect and process the QR code

**Camera Troubleshooting:**
- If camera doesn't work, check browser permissions
- Try different cameras using the dropdown (if multiple available)
- Use the development "Test Scan" option for testing

### Step 3: Test File Upload
1. Switch to "Upload Image" tab
2. Click "Choose Image" button
3. Select an image file containing a QR code
4. The system should process the image and extract the QR code

### Step 4: Test Production Order Fetching
1. After scanning a QR code, the system should:
   - Display "Fetching details..." loading state
   - Show complete production order information
   - List worker's operations for that order
   - Enable status update if worker has access

### Step 5: Test Status Updates
1. Select a new status from the dropdown
2. Optionally add notes
3. Click "Update Status"
4. Verify the status was updated successfully

## QR Code Formats Supported

### Format 1: Plain Production Order ID
```
PO-2024-001
```

### Format 2: JSON with Production Order ID
```json
{
  "id": "PO-2024-001",
  "type": "production_order"
}
```

### Format 3: JSON with Alternative ID Field
```json
{
  "productionOrderId": "PO-2024-001",
  "orderId": "PO-2024-001"
}
```

## API Endpoints

### 1. Get Production Order Details
```
GET /api/worker/production-order/{id}/details
```

**Response Example:**
```json
{
  "id": "PO-2024-001",
  "product": {
    "id": "prod_123",
    "name": "Blue Cotton T-Shirt",
    "sku": "BCOT-001",
    "description": "Classic blue cotton t-shirt"
  },
  "quantity": 100,
  "completedQuantity": 25,
  "status": "IN_PROGRESS",
  "priority": "HIGH",
  "startDate": "2024-12-19T08:00:00Z",
  "dueDate": "2024-12-22T17:00:00Z",
  "operations": [
    {
      "id": "op_456",
      "status": "IN_PROGRESS",
      "startTime": "2024-12-19T09:00:00Z",
      "endTime": "2024-12-19T17:00:00Z",
      "workCenter": {
        "id": "wc_789",
        "name": "Sewing Line 1"
      }
    }
  ],
  "canUpdate": true
}
```

### 2. Update Production Order Status
```
POST /api/worker/production-order/{id}/update-status
```

**Request Body:**
```json
{
  "status": "IN_PROGRESS",
  "notes": "Started production at 10:30 AM"
}
```

## Error Scenarios

### 1. **Production Order Not Found**
```json
{
  "error": "Production order not found"
}
```

### 2. **Worker Access Denied**
```json
{
  "error": "You don't have access to this production order",
  "details": "No operations assigned to your work centers"
}
```

### 3. **Invalid QR Code**
- QR code doesn't contain valid production order ID
- Image doesn't contain readable QR code
- QR code format is unrecognized

## Development Testing

### Using the Test Function
1. Set `NODE_ENV=development`
2. Look for the "..." menu button next to "Start Camera"
3. Click "Test Scan" to simulate scanning a production order
4. **Note:** Update the `testProductionOrderId` in the code to match an actual production order in your database

### Creating Test QR Codes
1. Use any QR code generator
2. Create QR codes with production order IDs from your database
3. Test both plain text and JSON formats

## Required Database Setup

### Ensure you have:
1. **Production Orders** with valid IDs
2. **Work Centers** assigned to worker users
3. **Operations** linking production orders to work centers
4. **Worker user** assigned to work centers via `UserWorkCenter`

### Sample SQL to verify setup:
```sql
-- Check worker's work centers
SELECT uw.*, wc.name as work_center_name 
FROM "UserWorkCenter" uw 
JOIN "WorkCenter" wc ON uw."workCenterId" = wc.id 
WHERE uw."userId" = 'your-worker-user-id';

-- Check operations for work centers
SELECT o.*, po.id as production_order_id 
FROM "Operation" o 
JOIN "ProductionOrder" po ON o."productionOrderId" = po.id 
WHERE o."workCenterId" IN (worker-work-center-ids);
```

## Security Features

### 1. **Worker Access Validation**
- Only workers assigned to work centers can access operations
- Production orders are filtered by worker's work center assignments
- Status updates require proper authentication

### 2. **Data Validation**
- Production order existence validation
- Worker permission validation
- Status transition validation

## Troubleshooting

### Camera Issues
1. **Permission Denied:** Check browser settings for camera access
2. **Camera Not Found:** Ensure device has camera or try different browser
3. **Camera In Use:** Close other applications using camera

### QR Code Issues
1. **Invalid Format:** Ensure QR code contains production order ID
2. **Not Detected:** Improve lighting and QR code clarity
3. **Wrong Order:** QR code contains ID not assigned to worker

### API Issues
1. **Unauthorized:** Check user authentication
2. **Not Found:** Verify production order exists in database
3. **Access Denied:** Ensure worker is assigned to relevant work centers

## Next Steps

After successful testing, consider implementing:

1. **Material Consumption via QR**
   - Scan materials for consumption tracking
   - Real-time inventory updates

2. **Quality Check Integration**
   - QR codes for quality check initiation
   - Inspector workflow integration

3. **Batch/Lot Tracking**
   - QR codes with batch information
   - Traceability throughout production

4. **Production Analytics**
   - QR scan frequency analysis
   - Worker efficiency metrics

## Files Modified

### New Files
- `src/app/api/worker/production-order/[id]/details/route.ts` - Production order details API
- `notes/QR_Scanner_Testing_Guide.md` - This testing guide

### Modified Files
- `src/components/module/worker/tasks/QRScanner.tsx` - Complete rewrite with improved functionality

### Dependencies
- Existing database schema and relationships
- `html5-qrcode` library for QR scanning
- Existing authentication and authorization system 

## Comprehensive Camera Troubleshooting

### 🔧 **Enhanced Camera Error Handling**

The QR scanner now includes multiple fallback mechanisms and detailed error reporting:

#### **1. Protocol Requirements**
- **HTTPS Required**: Camera access only works on HTTPS or localhost
- **Check your URL**: `http://` sites will fail, must be `https://` or `localhost`
- **Solution**: Deploy to HTTPS or test on `localhost`

#### **2. Browser Compatibility**
- **Supported**: Chrome, Firefox, Safari, Edge (modern versions)
- **Not Supported**: Internet Explorer, very old browser versions
- **Solution**: Update browser or try different browser

#### **3. Permission Issues**
- **Manual Permission Grant**: Click "Allow" when browser asks for camera access
- **Browser Settings**: Check site permissions in browser settings
- **Solution Steps**:
  1. Click the 🔒 or 🛡️ icon in address bar
  2. Set Camera permission to "Allow"
  3. Refresh the page
  4. Try scanner again

#### **4. Camera Hardware Issues**
- **External Camera**: Ensure USB camera is properly connected
- **Built-in Camera**: Check if camera works in other apps
- **Camera in Use**: Close other applications using camera (Zoom, Teams, etc.)
- **Solution**: Test camera in other apps first

#### **5. Multiple Fallback Strategies**
The scanner now tries multiple configurations automatically:
1. **Environment Camera**: Back camera with ideal settings
2. **User Camera**: Front camera with ideal settings  
3. **Relaxed Settings**: Lower quality but more compatible
4. **Manual Device Selection**: Fallback to detected cameras

### 🚨 **Common Error Messages & Solutions**

#### **"Camera access requires HTTPS or localhost"**
- **Cause**: Using `http://` instead of `https://`
- **Solution**: Access site via HTTPS or localhost
- **Dev Solution**: Use `npm run dev` on localhost

#### **"Camera permission denied"**
- **Cause**: User clicked "Block" or browser blocked access
- **Solution**: 
  1. Click camera icon in address bar
  2. Change permission to "Allow"
  3. Refresh page

#### **"Camera is in use by another application"**
- **Cause**: Another app (Zoom, Teams, etc.) is using camera
- **Solution**: Close other camera apps and try again

#### **"No cameras detected"**
- **Cause**: No camera hardware or drivers missing
- **Solution**: 
  1. Check device manager (Windows) or System Preferences (Mac)
  2. Install camera drivers if needed
  3. Try external USB camera

#### **"Media Devices API not supported"**
- **Cause**: Very old browser
- **Solution**: Update browser to latest version

### 🔄 **Reset & Recovery Options**

#### **Reset Camera Button**
- Stops current camera session
- Clears all camera state
- Reloads page to fresh state
- Use when camera gets "stuck"

#### **Browser Camera Settings**
- Chrome: `chrome://settings/content/camera`
- Firefox: `about:preferences#privacy`
- Safari: Safari → Preferences → Websites → Camera

#### **Manual Testing Steps**
1. **Test in Browser Camera App**: Verify camera works in browser
2. **Test Different Browsers**: Try Chrome, Firefox, Safari
3. **Test Different Devices**: Phone, tablet, different computer
4. **Use Upload Feature**: Fallback option if camera fails

### 📱 **Mobile Device Considerations**

#### **iOS Safari**
- **Requirement**: iOS 11+ 
- **Permission**: Must explicitly allow camera access
- **Back Camera**: Usually works better for QR scanning

#### **Android Chrome**
- **Requirement**: Android 5+
- **Multiple Cameras**: Scanner automatically selects best camera
- **Permission**: Grant camera permission in browser settings

### 🔍 **Debug Information**

The enhanced scanner now logs detailed information to browser console:

```javascript
// Open Developer Tools → Console to see:
console.log("Starting camera detection...");
console.log("Available cameras:", devices);
console.log("Selected camera:", selectedCamera);
console.log("Trying camera configuration 1:", cameraConfig);
```

#### **How to Check Console Logs**
1. **Chrome/Firefox**: Press `F12` → Console tab
2. **Safari**: Enable Developer Menu → Show Web Inspector → Console
3. **Look for**: Camera detection messages and error details

### ⚡ **Quick Fix Checklist**

When camera fails, try these in order:

1. ✅ **Check URL**: Must be HTTPS or localhost
2. ✅ **Grant Permission**: Click "Allow" when prompted  
3. ✅ **Close Other Apps**: Quit Zoom, Teams, etc.
4. ✅ **Refresh Page**: Simple page reload often helps
5. ✅ **Try Different Browser**: Chrome usually most reliable
6. ✅ **Use Upload Tab**: Alternative to camera scanning
7. ✅ **Reset Camera**: Use "Reset Camera" button
8. ✅ **Check Console**: Look for detailed error messages

### 🎯 **Testing Protocol**

#### **Systematic Testing Approach**
1. **Environment Check**: HTTPS, modern browser, camera available
2. **Permission Test**: Grant camera access, check browser settings
3. **Camera Selection**: Try different cameras if multiple available
4. **Fallback Test**: Try upload feature as alternative
5. **Console Debug**: Check detailed error messages

#### **Multi-Device Testing**
- **Desktop**: Chrome, Firefox, Safari
- **Mobile**: iOS Safari, Android Chrome
- **Laptop**: Built-in camera vs external USB camera
- **Different Networks**: Sometimes network security affects camera access 

## ✅ **Latest Fixes Applied (December 2024)**

### 🔧 **Camera Element Timing Issue - RESOLVED**

**Problem**: "HTML Element with id=qr-reader not found" error even when camera detection worked fine.

**Root Cause**: The Html5Qrcode library tried to initialize before the DOM element was fully rendered.

**Solution Applied**:
```typescript
// Added DOM element validation and timing delay
await new Promise(resolve => setTimeout(resolve, 100));

const qrReaderElement = document.getElementById("qr-reader");
if (!qrReaderElement) {
  throw new Error("QR reader element not found in DOM. Please try again.");
}
```

### 🎨 **Responsive Design Overhaul - COMPLETED**

**Problems Fixed**:
- ❌ Layout overlapping when showing errors
- ❌ Not tablet-friendly
- ❌ Poor mobile experience
- ❌ Error messages hard to read

**Solutions Applied**:
- ✅ **Responsive Grid Layout**: Uses CSS Grid with breakpoints (sm, md, lg)
- ✅ **Error Message Redesign**: Better spacing, icons, and action buttons
- ✅ **Tablet Optimization**: Optimized for tablet screen sizes
- ✅ **Mobile-First Design**: Works great on all screen sizes
- ✅ **Better Typography**: Improved text hierarchy and readability

### 📱 **Mobile & Tablet Improvements**

**New Responsive Features**:
- **Tab Labels**: Show full text on larger screens, short labels on mobile
- **Button Layouts**: Stack vertically on mobile, horizontal on larger screens  
- **Camera Preview**: Scales appropriately for device size
- **Error Display**: Takes full width with proper spacing
- **Action Buttons**: Full-width on mobile, auto-width on desktop

### 🚀 **Enhanced User Experience**

**Camera Integration**:
- **Multiple Fallback Attempts**: 4 different camera configurations tried automatically
- **Better Error Classification**: Specific error messages with targeted solutions
- **DOM Element Validation**: Ensures element exists before scanner initialization
- **Reset Functionality**: Complete camera reset with page reload option

**Visual Improvements**:
- **Professional Layout**: Clean, modern design with proper spacing
- **Loading States**: Better loading indicators and feedback
- **Status Updates**: Improved production order display
- **Responsive Tables**: Operations table adapts to screen size

## 🧪 **Updated Testing Protocol**

### **Step 1: Basic Functionality Test**
1. **Navigate to** `/worker/qr-scanner`
2. **Check Layout**: Should be responsive and well-spaced
3. **Open Browser Console** (`F12`) for detailed logs
4. **Verify Camera Detection**: Should see "Available cameras" in console

### **Step 2: Camera Element Test**
1. **Click "Start Camera"**
2. **Check Console**: Should see "Starting scanner with camera ID"
3. **Should NOT see**: "HTML Element with id=qr-reader not found"
4. **If successful**: Camera preview should appear

### **Step 3: Responsive Design Test**
1. **Desktop View**: Check layout on full screen
2. **Tablet View**: Resize to tablet width (768px-1024px)
3. **Mobile View**: Resize to mobile width (<768px)
4. **Error Display**: Trigger camera error and check layout
5. **Production Details**: Scan QR and check details layout

### **Step 4: Cross-Device Testing**
- **Desktop Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile Devices**: iOS Safari, Android Chrome
- **Tablet Devices**: iPad, Android tablets
- **Different Screen Sizes**: Test various viewport sizes

## 🎯 **Expected Results After Fixes**

### **✅ Camera Should Work When**:
- Page loads successfully
- Camera permissions granted
- Element timing issue resolved
- Multiple fallback configurations available

### **✅ Layout Should Be**:
- **Responsive**: Adapts to all screen sizes
- **Clean**: No overlapping or crowded elements  
- **Professional**: Modern, consistent design
- **Accessible**: Easy to read and navigate

### **✅ Error Handling Should Show**:
- **Clear Messages**: Specific error descriptions
- **Action Buttons**: Reset Camera, Camera Settings
- **Help Text**: Troubleshooting tips and suggestions
- **Good Spacing**: No layout overlap or crowding

## 📊 **Before vs After Comparison**

### **Before (Issues)**:
```
❌ HTML Element not found error
❌ Layout overlapping on errors  
❌ Not tablet-friendly
❌ Poor error message design
❌ Camera timing issues
```

### **After (Fixed)**:
```
✅ DOM element validation prevents timing issues
✅ Responsive layout with proper spacing
✅ Tablet and mobile optimized
✅ Professional error message design  
✅ Multiple camera fallback strategies
✅ Better user feedback and loading states
```

## 🚀 **Quick Test Guide (After Latest Fixes)**

### **✅ What's Fixed Now**
- ✅ **Square QR Box**: Camera overlay is now perfectly square
- ✅ **No Console Spam**: Removed normal scanning error messages  
- ✅ **Better Tabs**: Improved tab styling and layout
- ✅ **Better Error Messages**: User-friendly API error handling
- ✅ **Responsive Design**: Works well on tablets and mobile

### **🧪 Testing the Fixes**

#### **1. Test Camera Square QR Box**
1. Navigate to `/worker/qr-scanner`
2. Click "Start Camera" 
3. **Check**: QR detection box should be perfectly square (not rectangular)
4. **Console**: Should NOT see "NotFoundException" or "QR code parse error" repeatedly

#### **2. Test Tab Styling**
1. **Check tabs**: Should have proper background, rounded corners, smooth transitions
2. **Active tab**: Should be highlighted with white background and shadow
3. **Responsive**: Test on different screen sizes

#### **3. Test Error Handling**
1. **API Errors**: Try scanning non-existent production order
2. **Should see**: User-friendly error messages, not technical errors
3. **Work Center Error**: If not assigned to work centers, should get clear message

### **🔧 Common Setup Issues**

#### **Issue: "Worker is not assigned to any work centers"**
This means your user needs to be assigned to work centers in the admin panel.

**Solution**:
1. Login as admin
2. Go to Admin → Work Centers  
3. Find a work center and assign your worker user
4. Go to Admin → Production → Create production order with operations for that work center
5. Login as worker and try QR scanner again

#### **Issue: "Production order not found"**
**Solution**: Use the development "Test Scan" button or create actual production orders

#### **Issue: Camera still not working**
**Solution**: 
1. Check if you're on HTTPS or localhost
2. Allow camera permissions
3. Close other camera apps
4. Try "Upload Image" tab as alternative

### **📝 Testing Checklist**

- [ ] **Tabs look good**: Proper styling, no "destroyed" appearance
- [ ] **Square QR box**: Detection overlay is square, not rectangular  
- [ ] **No console spam**: Normal scanning doesn't flood console
- [ ] **Error messages**: User-friendly, not technical
- [ ] **Responsive**: Works on tablet and mobile
- [ ] **Camera works**: Can start camera without element errors
- [ ] **File upload works**: Can upload QR code images
- [ ] **Production details**: Shows properly formatted order info 