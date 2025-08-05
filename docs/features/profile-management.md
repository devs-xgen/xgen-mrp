# Profile Management System

## Overview

A comprehensive, reusable profile management system that provides consistent user profile and security functionality across all user roles (Admin, Inspector, Worker) in the XGen MRP application.

## Features

### Core Functionality
- **Profile Information Management**: Edit personal details, contact information, and work details
- **Inline Edit Mode**: Toggle between view and edit modes with a single button
- **Password Management**: Secure password changes with validation and eligibility checks
- **Emergency Contact Management**: Maintain emergency contact information
- **Session-based Authentication**: Secure access using NextAuth.js sessions
- **Role-agnostic Design**: Works seamlessly across all user roles

### Security Features
- Password strength validation (minimum 8 characters, uppercase, lowercase, numbers, special characters)
- Password change eligibility checks (prevents frequent changes)
- Session-based authorization for all operations
- Secure server-side validation and processing

## Architecture

### File Structure
```
src/
├── types/shared/
│   └── profile.ts                    # Shared type definitions
├── lib/actions/shared/
│   └── profile.ts                    # Server actions for profile operations
├── components/shared/profile/
│   ├── index.ts                      # Component exports
│   ├── profile-management.tsx        # Main profile management component
│   ├── profile-edit-form.tsx         # Profile editing form
│   └── password-change-form.tsx      # Password change form
└── app/[role]/(protected)/settings/
    └── page.tsx                      # Settings pages for each role
```

### Components

#### ProfileManagement
**Purpose**: Main container component that orchestrates profile display and editing functionality.

**Related Files**:
- `src/components/shared/profile/profile-management.tsx`

**Key Features**:
- Fetches and displays user profile data
- Provides tabbed interface for different profile sections
- Integrates ProfileEditForm and PasswordChangeForm
- Handles loading states and error handling
- Responsive design with proper accessibility

**Flow**: Session Check → Data Fetch → Display Profile → Enable Editing → Handle Updates

#### ProfileEditForm
**Purpose**: Reusable form component for editing user profile information.

**Related Files**:
- `src/components/shared/profile/profile-edit-form.tsx`
- `src/types/shared/profile.ts` (ProfileUpdateData interface)

**Key Features**:
- Form validation using react-hook-form and Zod
- Handles personal information, address, and work details
- Real-time validation feedback
- Toast notifications for success/error states
- Optimistic UI updates

**Parameters**:
- `initialData`: UserProfileData - Current user profile data
- `onSuccess`: () => void - Callback for successful updates

**Return Types**: JSX.Element

#### PasswordChangeForm
**Purpose**: Secure password change functionality with validation and eligibility checks.

**Related Files**:
- `src/components/shared/profile/password-change-form.tsx`
- `src/types/shared/profile.ts` (PasswordChangeData interface)

**Key Features**:
- Password strength validation
- Current password verification
- Password confirmation matching
- Eligibility checks (prevents frequent changes)
- Secure password visibility toggles

**Parameters**: None (uses session context)

**Return Types**: JSX.Element

### Server Actions

#### getUserProfile
**Purpose**: Fetches complete user profile data for the current session.

**Related Files**:
- `src/lib/actions/shared/profile.ts`

**Flow**: Session Validation → Database Query → Data Transformation → Return Profile

#### updateUserProfile
**Purpose**: Updates user profile information with validation and authorization.

**Parameters**:
- `data`: ProfileUpdateData - Profile update payload

**Flow**: Session Check → Data Validation → Database Update → Cache Revalidation → Response

#### updateUserPassword
**Purpose**: Securely updates user password with eligibility and strength validation.

**Parameters**:
- `data`: PasswordChangeData - Password change payload

**Flow**: Session Check → Eligibility Check → Current Password Verification → New Password Validation → Hash & Update → Response

#### canChangePassword
**Purpose**: Checks if user is eligible to change password (prevents frequent changes).

**Flow**: Session Check → Last Change Query → Time Calculation → Eligibility Response

### Type Definitions

#### UserProfileData
```typescript
interface UserProfileData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  department?: string;
  position?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  dateOfBirth?: Date;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  lastPasswordChange?: Date;
}
```

#### ProfileUpdateData
```typescript
interface ProfileUpdateData {
  firstName: string;
  lastName: string;
  phone?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  dateOfBirth?: Date;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}
```

#### PasswordChangeData
```typescript
interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
```

## Implementation Guide

### Adding to New User Role

1. **Create Settings Page**:
```typescript
// src/app/[role]/(protected)/settings/page.tsx
import { ProfileManagement } from "@/components/shared/profile";

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <ProfileManagement />
    </div>
  );
}
```

2. **Update Navigation** (if needed):
Add settings link to role-specific navigation configuration.

### Customization Options

#### Theme Integration
The components automatically inherit theme styles and support both light and dark modes.

#### Validation Rules
Modify validation schemas in the component files to adjust field requirements.

#### UI Customization
Components use Tailwind CSS classes and can be easily customized by modifying the className props.

## Security Considerations

### Authentication
- All operations require valid NextAuth.js session
- Server actions validate session before processing
- Unauthorized access returns appropriate error responses

### Password Security
- Minimum 8 characters with complexity requirements
- Current password verification for changes
- Password change frequency limitations (24-hour cooldown)
- Secure password hashing using bcrypt

### Data Validation
- Client-side validation using Zod schemas
- Server-side validation for all inputs
- SQL injection prevention through Prisma ORM
- XSS prevention through proper data sanitization

## Performance Optimizations

### Caching Strategy
- Server actions revalidate relevant paths after updates
- Optimistic UI updates for better user experience
- Efficient database queries with selective field fetching

### Bundle Optimization
- Shared components reduce code duplication
- Tree-shaking friendly exports
- Lazy loading for non-critical components

## Testing Strategy

### Unit Tests
- Component rendering and interaction tests
- Form validation testing
- Server action testing with mocked dependencies

### Integration Tests
- End-to-end profile update workflows
- Authentication and authorization testing
- Database interaction testing

### Accessibility Tests
- Keyboard navigation support
- Screen reader compatibility
- WCAG 2.1 compliance validation

## Maintenance

### Code Quality
- TypeScript for type safety
- ESLint and Prettier for code consistency
- Comprehensive error handling and logging

### Monitoring
- Error tracking for failed operations
- Performance monitoring for slow queries
- User activity logging for security audits

## Future Enhancements

### Planned Features
- Profile picture upload and management
- Two-factor authentication setup
- Account activity history
- Data export functionality
- Advanced privacy settings

### Scalability Considerations
- Microservice architecture support
- Multi-tenant data isolation
- Horizontal scaling capabilities
- CDN integration for static assets