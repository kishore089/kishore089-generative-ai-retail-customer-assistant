# Requirements Document

## Introduction

Phase 2 of the Generative AI Retail Customer Assistant frontend adds role-based authentication, a users domain, a global customer context, admin-driven customer management, role-aware dashboards, and role-based access control on routing. It also prepares the AI Assistant to send a role-and-customer-scoped payload without connecting to any AI backend.

Phase 2 builds directly on the completed Phase 1 foundation (React 19, TypeScript, Vite, HeroUI v3, Tailwind CSS v4, React Router v7, TanStack Query, Axios, Framer Motion) and reuses its existing building blocks: the Auth context (with its swappable `AuthClient` interface), the AppState context, the ThemeProvider, the interface-first services layer (`ai`, `orders`, `returns`, `payments`, `support`, `profile`), and the routing stack (`ProtectedRoute`, `AppLayout`, `Sidebar`, `TopNavbar`, `paths.ts`, `navItems.ts`, `router.tsx`).

All Phase 2 behavior is mock-only. No Amazon Cognito, no Amazon API Gateway, and no other AWS service is connected in this phase. Every new domain (Authentication, Users, Customers) is placed behind a TypeScript interface so a Cognito- and API Gateway-backed implementation can replace the mock later without changing any consumer. The application must compile successfully at all times.

## Glossary

- **Frontend_Application**: The Phase 2 React single-page application described by this document.
- **Role**: A user classification with exactly one of the values `Customer` or `Admin`.
- **Auth_Service**: The mock authentication service, exposed behind an interface, that validates credentials and returns an authenticated user with a Role. Successor to the Phase 1 `AuthClient`.
- **User_Service**: The mock users service, exposed behind an interface, that provides `User` records.
- **Customer_Service**: The mock customers service, exposed behind an interface, that retrieves and searches `Customer` records.
- **AI_Chat_Service**: The existing chat service shell that accepts a chat payload and returns an assistant reply; not connected to any AI backend in Phase 2.
- **Auth_Context**: The global React context (extending the Phase 1 Auth context) that stores authentication status, the authenticated `User`, and the active Role.
- **Customer_Context**: The new global React context that stores the active customer's identifying and selection data.
- **Role_Route**: The route guard component that enforces Role-based and customer-context-based access to routes.
- **Customer_Search_Page**: The Admin-only page for searching and selecting customers.
- **Customer_Dashboard**: The Role-aware dashboard view presented to a Customer or to an Admin acting on a selected customer.
- **Admin_Dashboard**: The Role-aware dashboard view presented to an Admin.
- **User**: A record with fields `UserID` (string), `CustomerID` (string or null), `Name` (string), `Email` (string), `Role` (`Customer` or `Admin`), and `Status` (string).
- **Customer**: A record identified by `CustomerID` and including at least `Name`, `Email`, and `Phone`.
- **CustomerID**: The unique identifier of a `Customer`. `null` for Admin users until a customer is selected.
- **Active_Customer**: The `Customer` currently loaded into the Customer_Context.
- **Chat_Payload**: The object sent by the AI_Chat_Service, shaped as `{ role: "Customer" | "Admin", customerId: string | null, message: string }`.
- **Customer_Scoped_Route**: A route whose content requires an Active_Customer to be present in the Customer_Context (for example Orders, Returns, Payments, Support, Profile, AI Assistant, Customer Dashboard).
- **Admin_Only_Route**: A route accessible solely to users with Role `Admin` (Admin_Dashboard and Customer_Search_Page).
- **Session_Store**: The browser persistence mechanism (mock) used to retain authentication status, Role, and CustomerID across page reloads.

## Requirements

### Requirement 1: Role-Based Authentication Model

**User Story:** As a product owner, I want the application to support two authenticated roles (Customer and Admin), so that customers and support staff receive experiences appropriate to their responsibilities.

#### Acceptance Criteria

1. THE Auth_Service SHALL represent each authenticated user with a Role whose value is either `Customer` or `Admin`.
2. WHEN the Auth_Service authenticates a user, THE Auth_Context SHALL store the authenticated User and the active Role in global state.
3. THE Auth_Context SHALL expose the active Role to any component in the Frontend_Application through a typed accessor.
4. THE Auth_Service SHALL be defined behind a TypeScript interface so that a Cognito-backed implementation can replace the mock implementation without changing any consumer.
5. IF a component reads the Auth_Context outside an Auth_Context provider, THEN THE Auth_Context SHALL raise a descriptive error identifying the missing provider and SHALL halt with an unhandled exception.

### Requirement 2: Users Service and Data Model

**User Story:** As a developer, I want a mock users service with a typed data model, so that authentication and customer resolution can be developed and tested without a real identity provider.

#### Acceptance Criteria

1. THE User_Service SHALL expose each User with the fields `UserID`, `CustomerID`, `Name`, `Email`, `Role`, and `Status`.
2. THE User_Service SHALL set `CustomerID` to `null` for every User whose Role is `Admin`.
3. THE User_Service SHALL provide a non-empty set of mock User records that includes at least one User with Role `Customer` and at least one User with Role `Admin`.
4. THE User_Service SHALL be defined behind a TypeScript interface so that an API Gateway-backed implementation can replace the mock implementation without changing any consumer.
5. WHEN the User_Service is queried by an `Email` that exists in the mock User records, THE User_Service SHALL return the matching User record regardless of that User's Status or Role.
6. WHEN the User_Service is queried by an `Email` that does not exist in the mock User records, THE User_Service SHALL return an explicit not-found result.

### Requirement 3: Customer Login Flow

**User Story:** As a customer, I want to log in with my credentials, so that I can access my personalized dashboard and account information.

#### Acceptance Criteria

1. WHEN a user submits credentials on the Customer login form, THE Auth_Service SHALL validate the credentials against the mock User records.
2. IF the submitted Customer credentials are invalid, THEN THE Frontend_Application SHALL display an authentication error message and SHALL keep the user on the login page.
3. WHEN Customer credentials are validated successfully, THE Auth_Context SHALL store the authenticated User with Role `Customer` and SHALL store the associated CustomerID in global state.
4. WHEN Customer credentials are validated successfully, THE Frontend_Application SHALL navigate the user to the Customer_Dashboard.
5. WHEN a Customer is authenticated, THE Customer_Service SHALL load the authenticated Customer's information into the Customer_Context.
6. IF loading the authenticated Customer's information fails, THEN THE Frontend_Application SHALL display an error state on the Customer_Dashboard and SHALL retain the authenticated session.

### Requirement 4: Admin Login Flow

**User Story:** As an admin, I want to log in with my credentials, so that I can access the admin dashboard and manage customers.

#### Acceptance Criteria

1. WHEN a user submits credentials on the Admin login form, THE Auth_Service SHALL validate the credentials against the mock User records.
2. IF the submitted Admin credentials are invalid, THEN THE Frontend_Application SHALL display an authentication error message and SHALL keep the user on the login page.
3. WHEN Admin credentials are validated successfully, THE Frontend_Application SHALL clear any authentication error message from the login page.
4. WHEN Admin credentials are validated successfully, THE Auth_Context SHALL store the authenticated User with Role `Admin` in global state.
5. WHEN Admin credentials are validated successfully, THE Customer_Context SHALL contain no Active_Customer and the CustomerID SHALL be `null`.
6. WHEN Admin credentials are validated successfully, THE Frontend_Application SHALL navigate the user to the Admin_Dashboard.

### Requirement 5: Customer Context

**User Story:** As a developer, I want a global customer context, so that customer-scoped pages and services can read the active customer's data from a single source app-wide.

#### Acceptance Criteria

1. THE Customer_Context SHALL store `CustomerID`, `Name`, `Email`, `Phone`, an optional selected order, and an optional selected support ticket for the Active_Customer.
2. THE Customer_Context SHALL expose its stored values to any component in the Frontend_Application through a typed accessor.
3. THE Customer_Context SHALL provide a typed operation that sets the Active_Customer from a `Customer` record.
4. THE Customer_Context SHALL provide a typed operation that clears the Active_Customer, resetting CustomerID to `null` and clearing the selected order and selected support ticket.
5. WHILE no Active_Customer is set, THE Customer_Context SHALL report CustomerID as `null`.
6. WHILE an Active_Customer is set, THE Customer_Context SHALL report CustomerID as the Active_Customer's non-null CustomerID.
7. IF a component reads the Customer_Context outside a Customer_Context provider, THEN THE Customer_Context SHALL raise a descriptive error identifying the missing provider and SHALL halt with an unhandled exception.

### Requirement 6: Admin Customer Management and Search

**User Story:** As an admin, I want to search for a customer and open their account, so that I can assist the customer using their own dashboard and data.

#### Acceptance Criteria

1. WHERE the active Role is `Admin`, THE Frontend_Application SHALL provide access to the Customer_Search_Page.
2. WHEN an Admin submits a search on the Customer_Search_Page, THE Customer_Service SHALL search the mock Customer records by CustomerID, by Email, or by Phone Number according to the submitted search input.
3. WHEN the Customer_Service returns search matches, THE Customer_Search_Page SHALL display one customer card per match showing the Customer Name, CustomerID, Email, and Phone.
4. IF a Customer_Service search returns no matches, THEN THE Customer_Search_Page SHALL display a no-results message and SHALL NOT display any customer card.
5. WHILE customer cards are displayed, THE Customer_Search_Page SHALL NOT display a no-results message.
6. WHEN an Admin selects a displayed customer card, THE Customer_Context SHALL load the selected Customer as the Active_Customer.
7. WHEN an Admin selects a displayed customer card, THE Frontend_Application SHALL navigate the Admin to the Customer_Dashboard for the selected Customer.
8. WHILE no customer cards are displayed, THE Customer_Search_Page SHALL NOT permit customer card selection.

### Requirement 7: Role-Aware Dashboard

**User Story:** As an authenticated user, I want a dashboard tailored to my role, so that I see the information and actions relevant to me.

#### Acceptance Criteria

1. WHILE the active Role is `Customer`, THE Customer_Dashboard SHALL display a welcome message, a customer profile summary, recent orders, recent returns, and an AI Assistant quick-access entry for the Active_Customer.
2. WHILE the active Role is `Admin` and no Active_Customer is set, THE Admin_Dashboard SHALL display a customer-search entry point, customer statistics, a recent-customers list, and quick navigation.
3. WHEN an Admin has selected an Active_Customer, THE Frontend_Application SHALL render the Customer_Dashboard using the Active_Customer's data.
4. IF the Customer_Dashboard is rendered while no Active_Customer is available, THEN THE Frontend_Application SHALL redirect the user according to the redirect-by-role rules in Requirement 9.
5. IF the Frontend_Application cannot determine the correct dashboard for the active Role, THEN THE Frontend_Application SHALL display an error state and SHALL NOT render a dashboard for an incorrect Role.

### Requirement 8: Role-Aware Navigation Structure

**User Story:** As an authenticated user, I want navigation that matches my role, so that I can move through the flows available to me without encountering options I cannot use.

#### Acceptance Criteria

1. WHILE the active Role is `Customer`, THE Frontend_Application SHALL present navigation to Dashboard, AI Assistant, Orders, Returns, Payments, Support, Profile, and Settings, and SHALL NOT present any Admin_Only_Route navigation item.
2. WHILE the active Role is `Admin`, THE Frontend_Application SHALL present navigation to Admin_Dashboard and Customer_Search_Page.
3. WHILE the active Role is `Admin` and an Active_Customer is set, THE Frontend_Application SHALL present navigation to the customer-scoped pages Customer Dashboard, AI Assistant, Orders, Returns, Payments, Support, and Profile for the Active_Customer.
4. THE Frontend_Application SHALL derive presented navigation items from the active Role and the presence of an Active_Customer.

### Requirement 9: Role-Based Access Control and Redirect-by-Role

**User Story:** As a security-conscious product owner, I want routes guarded by role and customer context, so that users can only reach pages they are authorized to use.

#### Acceptance Criteria

1. WHILE a user is unauthenticated, THE Role_Route SHALL redirect any request for a guarded route to the login route and SHALL preserve the originally requested path for restoration after sign-in.
2. IF an authenticated user whose Role is `Customer` requests an Admin_Only_Route, THEN THE Role_Route SHALL deny access and SHALL redirect the user to the Customer_Dashboard.
3. WHEN an authenticated user with Role `Customer` completes login, THE Frontend_Application SHALL redirect the user to the Customer_Dashboard.
4. WHEN an authenticated user with Role `Admin` completes login, THE Frontend_Application SHALL redirect the user to the Admin_Dashboard.
5. IF an authenticated user with Role `Admin` and no Active_Customer requests a Customer_Scoped_Route, THEN THE Role_Route SHALL redirect the user to the Customer_Search_Page.
6. WHILE an authenticated user with Role `Customer` accesses a Customer_Scoped_Route, THE Role_Route SHALL treat the Customer's own CustomerID as the Active_Customer for that route.
7. WHILE the authentication status is being resolved, THE Role_Route SHALL display a loading indicator and SHALL NOT render guarded content.
8. IF an authenticated user with Role `Admin` and an Active_Customer requests the Admin_Dashboard, THEN THE Role_Route SHALL redirect the user to the Customer_Dashboard for the Active_Customer.

### Requirement 10: AI Assistant Payload Preparation

**User Story:** As a developer, I want the chat service to send a role-and-customer-scoped payload, so that the future AI backend can be connected without changing the frontend contract.

#### Acceptance Criteria

1. WHEN the AI_Chat_Service sends a message, THE AI_Chat_Service SHALL send a Chat_Payload shaped as `{ role: "Customer" | "Admin", customerId: string | null, message: string }`.
2. WHILE the active Role is `Customer`, THE AI_Chat_Service SHALL set the Chat_Payload `customerId` to the Customer's non-null CustomerID from the Customer_Context.
3. WHILE the active Role is `Admin` and an Active_Customer is set, THE AI_Chat_Service SHALL set the Chat_Payload `customerId` to the Active_Customer's CustomerID.
4. WHILE the active Role is `Admin` and no Active_Customer is set, THE AI_Chat_Service SHALL set the Chat_Payload `customerId` to `null`.
5. IF the active Role is `Customer` and no Active_Customer is available in the Customer_Context, THEN THE AI_Chat_Service SHALL reject the message and SHALL NOT send a Chat_Payload.
6. WHEN the AI_Chat_Service sends a message, THE AI_Chat_Service SHALL set the Chat_Payload `role` to the active Role from the Auth_Context.
7. IF the Chat_Payload `role` does not match the active Role in the Auth_Context, THEN THE AI_Chat_Service SHALL reject the message and SHALL NOT send the Chat_Payload.
8. THE AI_Chat_Service SHALL remain behind its interface and SHALL NOT connect to any AI backend in Phase 2.

### Requirement 11: Swappable Mock Service Architecture

**User Story:** As an architect, I want the Authentication, Users, and Customers services to be mock implementations behind interfaces, so that they can be replaced with Cognito and API Gateway implementations later without changing consumers.

#### Acceptance Criteria

1. THE Auth_Service SHALL be provided as a mock implementation of its TypeScript interface using in-memory mock data.
2. THE User_Service SHALL be provided as a mock implementation of its TypeScript interface using in-memory mock data.
3. THE Customer_Service SHALL be provided as a mock implementation of its TypeScript interface using in-memory mock data.
4. THE Frontend_Application SHALL access authentication, users, and customers functionality exclusively through the Auth_Service, User_Service, and Customer_Service interfaces and SHALL NOT depend on their concrete mock implementations.
5. THE Frontend_Application SHALL NOT establish a network connection to Amazon Cognito, Amazon API Gateway, or any other AWS service in Phase 2.
6. THE Frontend_Application SHALL NOT import or declare a dependency on any AWS SDK.
7. THE Frontend_Application SHALL compile successfully with the mock service implementations in place.

### Requirement 12: Sign-Out and Context Reset

**User Story:** As an authenticated user, I want signing out to clear my session and customer data, so that no residual information remains for the next user of the application.

#### Acceptance Criteria

1. WHEN a user signs out, THE Auth_Context SHALL clear the authenticated User and the active Role and SHALL set the authentication status to unauthenticated.
2. WHEN a user signs out, THE Customer_Context SHALL clear the Active_Customer, resetting CustomerID to `null` and clearing the selected order and selected support ticket.
3. WHEN a user signs out, THE Frontend_Application SHALL remove the persisted authentication status, Role, and CustomerID from the Session_Store.
4. WHEN a user signs out, THE Frontend_Application SHALL navigate the user to the login route.

### Requirement 13: Session and Role Persistence

**User Story:** As an authenticated user, I want my session and role to persist across page reloads, so that I do not have to log in again after refreshing the application.

#### Acceptance Criteria

1. WHEN a user is authenticated, THE Frontend_Application SHALL persist the authentication status, the active Role, and the CustomerID to the Session_Store.
2. WHEN the Frontend_Application starts and a persisted authenticated session is present in the Session_Store, THE Auth_Context SHALL restore the authentication status and the active Role from the Session_Store.
3. WHEN the Frontend_Application starts and a persisted CustomerID is present in the Session_Store, THE Customer_Context SHALL restore the Active_Customer for that CustomerID using the Customer_Service.
4. IF the persisted session data in the Session_Store is absent or malformed, THEN THE Auth_Context SHALL initialize as unauthenticated and THE Customer_Context SHALL initialize with no Active_Customer.
