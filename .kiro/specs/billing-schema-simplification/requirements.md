# Requirements Document

## Introduction

This feature aims to simplify and fix the billing system schema in the MRP system. The current schema has complex nullable relationships that make it difficult to understand the billing workflow. We need to streamline the relationships between BillingStatement, SalesInvoice, and DeliveryReceipt to create a clearer, more maintainable billing system.

## Requirements

### Requirement 1

**User Story:** As a developer, I want a simplified billing schema, so that I can easily understand and maintain the billing workflow.

#### Acceptance Criteria

1. WHEN creating a billing statement THEN the system SHALL require either customerId OR customerOrderId to identify the customer
2. WHEN a billing statement is created THEN the system SHALL automatically derive customerName from the customer or customer order
3. WHEN a sales invoice is created THEN the system SHALL be directly linked to a billing statement
4. IF a billing statement exists THEN a sales invoice SHALL be created from it
5. WHEN a delivery receipt is created THEN the system SHALL only store essential delivery information

### Requirement 2

**User Story:** As an admin user, I want clear billing relationships, so that I can track the order-to-cash workflow efficiently.

#### Acceptance Criteria

1. WHEN viewing a billing statement THEN the system SHALL show clear customer information
2. WHEN a customer order exists THEN the billing statement SHALL link to it directly
3. WHEN a production order is completed THEN it SHALL optionally link to a billing statement
4. WHEN delivery is confirmed THEN the delivery receipt SHALL link to the billing statement
5. WHEN payment is processed THEN the billing statement status SHALL be updated accordingly

### Requirement 3

**User Story:** As a system administrator, I want simplified delivery receipts, so that only necessary delivery data is stored.

#### Acceptance Criteria

1. WHEN creating a delivery receipt THEN the system SHALL only require essential delivery fields
2. WHEN delivery is confirmed THEN the system SHALL store delivery date, recipient, and address
3. WHEN proof is needed THEN the system SHALL optionally store signature and photo evidence
4. WHEN tracking delivery THEN the system SHALL optionally store tracking information
5. WHEN delivery is complete THEN the receipt SHALL link to the related billing statement

### Requirement 4

**User Story:** As a developer, I want consistent database relationships, so that queries are efficient and maintainable.

#### Acceptance Criteria

1. WHEN querying billing data THEN the system SHALL use proper foreign key relationships
2. WHEN a billing statement is deleted THEN related records SHALL be handled appropriately
3. WHEN updating billing status THEN the system SHALL maintain data integrity
4. WHEN generating reports THEN the system SHALL efficiently join related tables
5. WHEN migrating data THEN the system SHALL preserve existing relationships