import React, { useState, useEffect } from 'react';

// Mock utility functions to avoid external dependencies
const formatCurrencyPHP = (amount) => {
  if (typeof amount !== 'number') return 'N/A';
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// Mock components to avoid external dependencies
const Card = ({ children }) => <div className="bg-white rounded-xl shadow-lg p-6 mb-6">{children}</div>;
const CardHeader = ({ children }) => <div className="mb-4">{children}</div>;
const CardTitle = ({ children }) => <h3 className="text-xl font-semibold text-gray-900">{children}</h3>;
const CardContent = ({ children }) => <div className="text-sm">{children}</div>;
const Button = ({ children, variant, onClick }) => {
  let classes = "px-4 py-2 font-medium rounded-lg transition-colors duration-200";
  if (variant === "secondary") classes += " bg-gray-200 text-gray-800 hover:bg-gray-300";
  if (variant === "outline") classes += " border border-gray-300 text-gray-700 hover:bg-gray-100";
  if (variant === "primary" || !variant) classes += " bg-blue-600 text-white hover:bg-blue-700";
  return <button className={classes} onClick={onClick}>{children}</button>;
};

const Badge = ({ children, className }) => <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>{children}</span>;
const Separator = () => <div className="my-4 h-px bg-gray-200" />;
const Tabs = ({ children, value, onValueChange }) => <div className="space-y-4">{children}</div>;
const TabsList = ({ children }) => <div className="flex bg-gray-200 rounded-lg p-1 space-x-1">{children}</div>;
const TabsTrigger = ({ children, value, onClick, active }) => (
  <button
    className={`flex-1 py-2 px-4 rounded-md transition-colors duration-200 ${active ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:bg-gray-300'}`}
    onClick={() => onClick(value)}
  >
    {children}
  </button>
);
const TabsContent = ({ children, value, active }) => active ? <div className="space-y-6">{children}</div> : null;

// Mock Lucide React icons
const Icon = ({ className, children }) => <span className={`inline-block ${className}`}>{children}</span>;
const Edit = () => <Icon className="w-4 h-4 mr-2">✏️</Icon>;
const Save = () => <Icon className="w-4 h-4 mr-2">💾</Icon>;
const User = () => <Icon className="w-4 h-4 mr-2">👤</Icon>;
const Calendar = () => <Icon className="w-4 h-4 mr-2">🗓️</Icon>;
const Receipt = () => <Icon className="w-4 h-4 mr-2">🧾</Icon>;

const OrderEditPage = ({ orderData }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [order, setOrder] = useState(orderData);
  const [editableOrder, setEditableOrder] = useState(orderData);
  const [activeTab, setActiveTab] = useState("overview");

  // Sync internal state with external prop changes if needed
  useEffect(() => {
    setOrder(orderData);
    setEditableOrder(orderData);
  }, [orderData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setEditableOrder(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setEditableOrder(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = () => {
    // In a real application, this is where you would call an API
    // to update the database with the editableOrder state.
    console.log("Saving changes:", editableOrder);
    setOrder(editableOrder);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans antialiased">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900">Edit Order Details</h1>
          {isEditing ? (
            <Button variant="primary" onClick={handleSave}>
              <Save />
              Save Changes
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit />
              Edit Order
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview" onClick={setActiveTab} active={activeTab === "overview"}>
              Overview
            </TabsTrigger>
            <TabsTrigger value="items" onClick={setActiveTab} active={activeTab === "items"}>
              Order Items
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" active={activeTab === "overview"}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle><User />Customer Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-gray-700 font-medium mb-1">Customer Name</label>
                      <input
                        type="text"
                        name="customer.name"
                        value={editableOrder.customer?.name || ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-1">Email</label>
                      <input
                        type="email"
                        name="customer.email"
                        value={editableOrder.customer?.email || ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-1">Phone</label>
                      <input
                        type="tel"
                        name="customer.phone"
                        value={editableOrder.customer?.phone || ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                      />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-gray-700 font-medium mb-1">Address</label>
                      <textarea
                        name="customer.address"
                        value={editableOrder.customer?.address || ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        rows="3"
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle><Calendar />Order Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 font-medium mb-1">Order Date</label>
                      <input
                        type="date"
                        name="orderDate"
                        value={editableOrder.orderDate ? editableOrder.orderDate.slice(0, 10) : ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-1">Required Date</label>
                      <input
                        type="date"
                        name="requiredDate"
                        value={editableOrder.requiredDate ? editableOrder.requiredDate.slice(0, 10) : ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                      />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-gray-700 font-medium mb-1">Notes</label>
                      <textarea
                        name="notes"
                        value={editableOrder.notes || ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        rows="3"
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="items" active={activeTab === "items"}>
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.orderLines && order.orderLines.length > 0 ? (
                    order.orderLines.map((line) => (
                      <div key={line.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-lg">{line.name}</h4>
                          <p className="text-sm text-gray-500">
                            {line.quantity} units @ {formatCurrencyPHP(line.unitPrice)}
                          </p>
                        </div>
                        <Badge className="bg-gray-200 text-gray-800">
                          {line.fulfillmentStatus}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-8">No order items found.</div>
                  )}
                  <div className="pt-4">
                    <Button variant="outline" disabled={!isEditing}>
                      <Edit />
                      Edit Line Items
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default OrderEditPage;
