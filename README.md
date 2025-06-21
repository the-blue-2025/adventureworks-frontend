# AdventureWorks Data Management Application

A comprehensive Angular-based data management application for managing AdventureWorks business entities using Bootstrap and ng-bootstrap for styling.

## Features

### 🏠 Dashboard
- Overview of all data entities
- Quick access to management pages
- Visual cards with entity counts and actions

### 👥 Persons Management
- List all persons with search and filtering
- Create, view, edit, and delete persons
- Filter by person type (Employee, Store Contact, Vendor Contact, etc.)
- Real-time search functionality

### 🏢 Vendors Management
- Complete vendor lifecycle management
- Search by name or account number
- Credit rating visualization
- Status indicators (Active/Inactive, Preferred/Standard)
- Web service URL management

### 🚚 Ship Methods Management
- Configure shipping methods and rates
- Base rate and additional rate management
- Total rate calculation display
- Search and filter capabilities

### 📦 Purchase Orders Management
- Full purchase order lifecycle
- Status tracking (Pending, Approved, Rejected, Complete)
- Vendor and employee associations
- Financial calculations (Sub Total, Tax, Freight, Total Due)
- Ship method integration

## Technology Stack

- **Frontend Framework**: Angular 20 (Standalone Components)
- **UI Framework**: Bootstrap 5.3.7
- **Angular Bootstrap**: ng-bootstrap 19.0.0
- **Icons**: Bootstrap Icons
- **State Management**: Angular Signals
- **HTTP Client**: Angular HttpClient with RxJS
- **Routing**: Angular Router with lazy loading

## Architecture

### Components Structure
```
src/app/components/
├── dashboard/
│   └── dashboard.component.ts
├── persons/
│   ├── persons.component.ts
│   └── person-form.component.ts
├── vendors/
│   ├── vendors.component.ts
│   └── vendor-form.component.ts
├── ship-methods/
│   ├── ship-methods.component.ts
│   └── ship-method-form.component.ts
└── purchase-orders/
    ├── purchase-orders.component.ts
    └── purchase-order-form.component.ts
```

### Services
- **PersonService**: Manages person data with reactive signals
- **VendorService**: Handles vendor operations and filtering
- **ShipMethodService**: Manages shipping methods and rates
- **PurchaseOrderService**: Complex purchase order management with details

### Models
- **PersonDto**: Customer and employee information
- **VendorDto**: Supplier and vendor data
- **ShipMethodDto**: Shipping configuration
- **PurchaseOrderDto**: Order management with relationships

## Key Features

### 🔍 Search & Filtering
- Real-time search across all entities
- Type-based filtering for persons
- Status filtering for purchase orders
- Credit rating filtering for vendors

### 📊 Data Visualization
- Status badges with color coding
- Financial data formatting
- Date formatting and display
- Responsive table layouts

### ⚡ Performance
- Lazy-loaded components
- Reactive state management with signals
- Optimized HTTP requests
- Efficient data caching

### 🎨 User Experience
- Modern Bootstrap styling
- Responsive design
- Loading states and error handling
- Confirmation dialogs for destructive actions
- Form validation with visual feedback

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

## API Integration

The application expects a RESTful API with the following endpoints:

- `/persons` - Person management
- `/vendors` - Vendor management  
- `/ship-methods` - Ship method management
- `/purchase-orders` - Purchase order management

Each endpoint supports standard CRUD operations (GET, POST, PUT, DELETE) and search functionality.

## Styling

The application uses Bootstrap 5 with custom styling:
- Responsive grid system
- Component-based styling
- Consistent color scheme
- Modern UI patterns
- Accessibility features

## Future Enhancements

- [ ] Advanced filtering and sorting
- [ ] Data export functionality
- [ ] Bulk operations
- [ ] Real-time notifications
- [ ] User authentication and authorization
- [ ] Audit trail and logging
- [ ] Mobile-optimized views
- [ ] Data visualization charts
