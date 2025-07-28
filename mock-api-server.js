const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Mock data for sales orders
const mockSalesOrders = [
  {
    salesOrderId: 1,
    status: 2,
    customerId: 1,
    salesPersonId: 1,
    orderDate: new Date('2024-01-15'),
    shipDate: new Date('2024-01-20'),
    subTotal: 1000.00,
    taxAmt: 80.00,
    freight: 50.00,
    totalDue: 1130.00,
    shipMethod: {
      shipMethodId: 1,
      name: 'Standard Shipping'
    },
    customer: {
      customerId: 1,
      firstName: 'John',
      middleName: null,
      lastName: 'Doe',
      emailAddress: 'john.doe@example.com'
    },
    salesPerson: {
      businessEntityId: 1,
      firstName: 'Jane',
      middleName: null,
      lastName: 'Smith'
    }
  },
  {
    salesOrderId: 2,
    status: 5,
    customerId: 2,
    salesPersonId: 2,
    orderDate: new Date('2024-01-10'),
    shipDate: new Date('2024-01-15'),
    subTotal: 2500.00,
    taxAmt: 200.00,
    freight: 75.00,
    totalDue: 2775.00,
    shipMethod: {
      shipMethodId: 2,
      name: 'Express Shipping'
    },
    customer: {
      customerId: 2,
      firstName: 'Alice',
      middleName: null,
      lastName: 'Johnson',
      emailAddress: 'alice.johnson@example.com'
    },
    salesPerson: {
      businessEntityId: 2,
      firstName: 'Bob',
      middleName: null,
      lastName: 'Wilson'
    }
  },
  {
    salesOrderId: 3,
    status: 1,
    customerId: 3,
    salesPersonId: 1,
    orderDate: new Date('2024-01-20'),
    shipDate: null,
    subTotal: 750.00,
    taxAmt: 60.00,
    freight: 25.00,
    totalDue: 835.00,
    shipMethod: {
      shipMethodId: 1,
      name: 'Standard Shipping'
    },
    customer: {
      customerId: 3,
      firstName: 'Charlie',
      middleName: null,
      lastName: 'Brown',
      emailAddress: 'charlie.brown@example.com'
    },
    salesPerson: {
      businessEntityId: 1,
      firstName: 'Jane',
      middleName: null,
      lastName: 'Smith'
    }
  }
];

// Mock data for sales order details
const mockSalesOrderDetails = [
  {
    salesOrderDetailId: 1,
    salesOrderId: 1,
    productId: 1,
    orderQty: 2,
    unitPrice: 500.00,
    unitPriceDiscount: 0.00,
    lineTotal: 1000.00
  },
  {
    salesOrderDetailId: 2,
    salesOrderId: 1,
    productId: 2,
    orderQty: 1,
    unitPrice: 250.00,
    unitPriceDiscount: 25.00,
    lineTotal: 225.00
  },
  {
    salesOrderDetailId: 3,
    salesOrderId: 2,
    productId: 3,
    orderQty: 3,
    unitPrice: 800.00,
    unitPriceDiscount: 0.00,
    lineTotal: 2400.00
  },
  {
    salesOrderDetailId: 4,
    salesOrderId: 2,
    productId: 4,
    orderQty: 1,
    unitPrice: 100.00,
    unitPriceDiscount: 0.00,
    lineTotal: 100.00
  },
  {
    salesOrderDetailId: 5,
    salesOrderId: 3,
    productId: 5,
    orderQty: 2,
    unitPrice: 375.00,
    unitPriceDiscount: 0.00,
    lineTotal: 750.00
  }
];

// Routes
app.get('/api/v1/sales-orders', (req, res) => {
  console.log('GET /api/v1/sales-orders called with query:', req.query);
  
  let filteredOrders = [...mockSalesOrders];
  
  // Apply search filter
  if (req.query.q) {
    const searchTerm = req.query.q.toLowerCase();
    filteredOrders = filteredOrders.filter(order => 
      order.salesOrderId.toString().includes(searchTerm) ||
      order.customer.firstName.toLowerCase().includes(searchTerm) ||
      order.customer.lastName.toLowerCase().includes(searchTerm) ||
      order.shipMethod.name.toLowerCase().includes(searchTerm) ||
      order.salesPerson.firstName.toLowerCase().includes(searchTerm) ||
      order.salesPerson.lastName.toLowerCase().includes(searchTerm)
    );
  }
  
  // Apply status filter
  if (req.query.status) {
    filteredOrders = filteredOrders.filter(order => order.status.toString() === req.query.status);
  }
  
  // Apply customer filter
  if (req.query.customerId) {
    filteredOrders = filteredOrders.filter(order => order.customerId.toString() === req.query.customerId);
  }
  
  console.log(`Returning ${filteredOrders.length} sales orders`);
  res.json(filteredOrders);
});

app.get('/api/v1/sales-orders/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const order = mockSalesOrders.find(o => o.salesOrderId === id);
  
  if (order) {
    res.json(order);
  } else {
    res.status(404).json({ message: 'Sales order not found' });
  }
});

app.get('/api/v1/sales-orders/:id/details', (req, res) => {
  const id = parseInt(req.params.id);
  const order = mockSalesOrders.find(o => o.salesOrderId === id);
  
  if (order) {
    // Get details for this sales order
    const details = mockSalesOrderDetails.filter(d => d.salesOrderId === id);
    console.log(`Returning ${details.length} details for sales order ${id}`);
    res.json(details);
  } else {
    res.status(404).json({ message: 'Sales order not found' });
  }
});

// Sales order details CRUD operations
app.get('/api/v1/sales-order-details/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const detail = mockSalesOrderDetails.find(d => d.salesOrderDetailId === id);
  
  if (detail) {
    res.json(detail);
  } else {
    res.status(404).json({ message: 'Sales order detail not found' });
  }
});

app.post('/api/v1/sales-orders/:id/details', (req, res) => {
  const salesOrderId = parseInt(req.params.id);
  const newDetail = {
    salesOrderDetailId: Math.floor(Math.random() * 1000) + 1,
    salesOrderId: salesOrderId,
    ...req.body
  };
  
  // Add to mock data
  mockSalesOrderDetails.push(newDetail);
  
  console.log('Created new sales order detail:', newDetail);
  res.status(201).json(newDetail);
});

app.put('/api/v1/sales-order-details/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const detailIndex = mockSalesOrderDetails.findIndex(d => d.salesOrderDetailId === id);
  
  if (detailIndex !== -1) {
    const updatedDetail = {
      ...mockSalesOrderDetails[detailIndex],
      ...req.body,
      salesOrderDetailId: id
    };
    mockSalesOrderDetails[detailIndex] = updatedDetail;
    res.json(updatedDetail);
  } else {
    res.status(404).json({ message: 'Sales order detail not found' });
  }
});

app.delete('/api/v1/sales-order-details/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const detailIndex = mockSalesOrderDetails.findIndex(d => d.salesOrderDetailId === id);
  
  if (detailIndex !== -1) {
    mockSalesOrderDetails.splice(detailIndex, 1);
    res.status(204).send();
  } else {
    res.status(404).json({ message: 'Sales order detail not found' });
  }
});

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'OK', message: 'Mock API server is running' });
});

app.listen(port, () => {
  console.log(`Mock API server running at http://localhost:${port}`);
  console.log(`Available endpoints:`);
  console.log(`  GET /api/v1/health - Health check`);
  console.log(`  GET /api/v1/sales-orders - List all sales orders`);
  console.log(`  GET /api/v1/sales-orders/:id - Get specific sales order`);
  console.log(`  GET /api/v1/sales-orders/:id/details - Get sales order details`);
  console.log(`  GET /api/v1/sales-order-details/:id - Get specific sales order detail`);
  console.log(`  POST /api/v1/sales-orders/:id/details - Create sales order detail`);
  console.log(`  PUT /api/v1/sales-order-details/:id - Update sales order detail`);
  console.log(`  DELETE /api/v1/sales-order-details/:id - Delete sales order detail`);
}); 