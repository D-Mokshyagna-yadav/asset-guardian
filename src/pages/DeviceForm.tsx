import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, ArrowLeft, Plus, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { mockDevices, mockDepartments, mockLocations } from '@/data/mockData';
import { Device } from '@/types';

const DEVICE_CATEGORIES = [
  'Network Switch',
  'Wireless AP',
  'Server',
  'Printer',
  'Laptop',
  'Desktop',
  'Monitor',
  'Router',
  'Access Point',
  'Firewall',
  'Storage',
  'Other',
];

const DEVICE_STATUS = ['IN_STOCK', 'ISSUED', 'INSTALLED', 'MAINTENANCE', 'SCRAPPED'];

export default function DeviceForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Find existing device if editing
  const existingDevice = id ? mockDevices.find(d => d.id === id) : null;

  const [formData, setFormData] = useState({
    assetTag: existingDevice?.assetTag || '',
    deviceName: existingDevice?.deviceName || '',
    category: existingDevice?.category || '',
    brand: existingDevice?.brand || '',
    model: existingDevice?.model || '',
    serialNumber: existingDevice?.serialNumber || '',
    macAddress: existingDevice?.macAddress || '',
    ipAddress: existingDevice?.ipAddress || '',
    purchaseDate: existingDevice?.purchaseDate || '',
    arrivalDate: existingDevice?.arrivalDate || '',
    vendor: existingDevice?.vendor || '',
    invoiceNumber: existingDevice?.invoiceNumber || '',
    billDate: existingDevice?.billDate || '',
    billAmount: existingDevice?.billAmount || '',
    cost: existingDevice?.cost || '',
    quantity: existingDevice?.quantity || '1',
    warrantyStart: existingDevice?.warrantyStart || '',
    warrantyEnd: existingDevice?.warrantyEnd || '',
    status: existingDevice?.status || 'IN_STOCK',
    departmentId: existingDevice?.departmentId || '',
    locationId: existingDevice?.locationId || '',
    inchargeUserId: existingDevice?.inchargeUserId || '',
    features: existingDevice?.features || [],
    notes: existingDevice?.notes || '',
  });

  const [newFeature, setNewFeature] = useState('');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.deviceName.trim()) newErrors.deviceName = 'Device name is required';
    if (!formData.category.trim()) newErrors.category = 'Category is required';
    if (!formData.brand.trim()) newErrors.brand = 'Brand is required';
    if (!formData.model.trim()) newErrors.model = 'Model is required';
    if (!formData.serialNumber.trim()) newErrors.serialNumber = 'Serial number is required';
    if (!formData.purchaseDate.trim()) newErrors.purchaseDate = 'Purchase date is required';
    if (!formData.arrivalDate.trim()) newErrors.arrivalDate = 'Arrival date is required';
    if (!formData.vendor.trim()) newErrors.vendor = 'Vendor is required';
    if (!formData.cost || parseFloat(formData.cost.toString()) < 0) newErrors.cost = 'Valid cost is required';
    if (!formData.quantity || parseInt(formData.quantity.toString()) < 1) newErrors.quantity = 'Quantity must be at least 1';
    if (formData.billAmount && parseFloat(formData.billAmount.toString()) < 0) newErrors.billAmount = 'Bill amount must be positive';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const newDevice: Device = {
        id: id || `dev-${Date.now()}`,
        assetTag: formData.assetTag || `AST-${Date.now()}`,
        deviceName: formData.deviceName,
        category: formData.category,
        brand: formData.brand,
        model: formData.model,
        serialNumber: formData.serialNumber,
        macAddress: formData.macAddress || undefined,
        ipAddress: formData.ipAddress || undefined,
        purchaseDate: formData.purchaseDate,
        arrivalDate: formData.arrivalDate,
        vendor: formData.vendor,
        invoiceNumber: formData.invoiceNumber || undefined,
        billDate: formData.billDate || undefined,
        billAmount: formData.billAmount ? parseFloat(formData.billAmount.toString()) : undefined,
        cost: parseFloat(formData.cost.toString()),
        quantity: parseInt(formData.quantity.toString()),
        warrantyStart: formData.warrantyStart || undefined,
        warrantyEnd: formData.warrantyEnd || undefined,
        status: formData.status as any,
        departmentId: formData.departmentId || undefined,
        locationId: formData.locationId || undefined,
        inchargeUserId: formData.inchargeUserId || undefined,
        features: formData.features.length > 0 ? formData.features : undefined,
        notes: formData.notes || undefined,
        createdBy: existingDevice?.createdBy || '1',
        createdAt: existingDevice?.createdAt || new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      };

      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('Device saved:', newDevice);
      navigate('/inventory');
    } catch (error) {
      setErrors({ submit: 'Failed to save device. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const addFeature = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()],
      }));
      setNewFeature('');
    }
  };

  const removeFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter(f => f !== feature),
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/inventory')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Inventory
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{id ? 'Edit Device' : 'Add New Device'}</CardTitle>
            <CardDescription>
              {id ? 'Update device information' : 'Register a new device in the inventory'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {errors.submit && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.submit}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Device Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="assetTag">Asset Tag</Label>
                    <Input
                      id="assetTag"
                      name="assetTag"
                      value={formData.assetTag}
                      onChange={handleChange}
                      placeholder="e.g., AST-2024-001"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deviceName">Device Name *</Label>
                    <Input
                      id="deviceName"
                      name="deviceName"
                      value={formData.deviceName}
                      onChange={handleChange}
                      placeholder="e.g., Core Switch 01"
                      className={errors.deviceName ? 'border-red-500' : ''}
                    />
                    {errors.deviceName && (
                      <p className="text-sm text-red-500">{errors.deviceName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => handleSelectChange('category', value)}>
                      <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEVICE_CATEGORIES.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.category && (
                      <p className="text-sm text-red-500">{errors.category}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand *</Label>
                    <Input
                      id="brand"
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                      placeholder="e.g., Cisco"
                      className={errors.brand ? 'border-red-500' : ''}
                    />
                    {errors.brand && (
                      <p className="text-sm text-red-500">{errors.brand}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="model">Model *</Label>
                    <Input
                      id="model"
                      name="model"
                      value={formData.model}
                      onChange={handleChange}
                      placeholder="e.g., Catalyst 9300"
                      className={errors.model ? 'border-red-500' : ''}
                    />
                    {errors.model && (
                      <p className="text-sm text-red-500">{errors.model}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="serialNumber">Serial Number *</Label>
                    <Input
                      id="serialNumber"
                      name="serialNumber"
                      value={formData.serialNumber}
                      onChange={handleChange}
                      placeholder="e.g., CSC-98765432"
                      className={errors.serialNumber ? 'border-red-500' : ''}
                    />
                    {errors.serialNumber && (
                      <p className="text-sm text-red-500">{errors.serialNumber}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Network Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Network Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="macAddress">MAC Address</Label>
                    <Input
                      id="macAddress"
                      name="macAddress"
                      value={formData.macAddress}
                      onChange={handleChange}
                      placeholder="e.g., AA:BB:CC:DD:EE:01"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ipAddress">IP Address</Label>
                    <Input
                      id="ipAddress"
                      name="ipAddress"
                      value={formData.ipAddress}
                      onChange={handleChange}
                      placeholder="e.g., 192.168.1.1"
                    />
                  </div>
                </div>
              </div>

              {/* Purchase & Bill Details */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Purchase & Bill Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="purchaseDate">Purchase Date *</Label>
                    <Input
                      id="purchaseDate"
                      name="purchaseDate"
                      type="date"
                      value={formData.purchaseDate}
                      onChange={handleChange}
                      className={errors.purchaseDate ? 'border-red-500' : ''}
                    />
                    {errors.purchaseDate && (
                      <p className="text-sm text-red-500">{errors.purchaseDate}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="arrivalDate">Arrival Date *</Label>
                    <Input
                      id="arrivalDate"
                      name="arrivalDate"
                      type="date"
                      value={formData.arrivalDate}
                      onChange={handleChange}
                      className={errors.arrivalDate ? 'border-red-500' : ''}
                    />
                    {errors.arrivalDate && (
                      <p className="text-sm text-red-500">{errors.arrivalDate}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vendor">Vendor *</Label>
                    <Input
                      id="vendor"
                      name="vendor"
                      value={formData.vendor}
                      onChange={handleChange}
                      placeholder="e.g., Tech Solutions Inc."
                      className={errors.vendor ? 'border-red-500' : ''}
                    />
                    {errors.vendor && (
                      <p className="text-sm text-red-500">{errors.vendor}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="invoiceNumber">Invoice Number</Label>
                    <Input
                      id="invoiceNumber"
                      name="invoiceNumber"
                      value={formData.invoiceNumber}
                      onChange={handleChange}
                      placeholder="e.g., INV-2024-0001"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billDate">Bill Date</Label>
                    <Input
                      id="billDate"
                      name="billDate"
                      type="date"
                      value={formData.billDate}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billAmount">Bill Amount</Label>
                    <Input
                      id="billAmount"
                      name="billAmount"
                      type="number"
                      step="0.01"
                      value={formData.billAmount}
                      onChange={handleChange}
                      placeholder="0.00"
                      className={errors.billAmount ? 'border-red-500' : ''}
                    />
                    {errors.billAmount && (
                      <p className="text-sm text-red-500">{errors.billAmount}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cost">Cost *</Label>
                    <Input
                      id="cost"
                      name="cost"
                      type="number"
                      step="0.01"
                      value={formData.cost}
                      onChange={handleChange}
                      placeholder="0.00"
                      className={errors.cost ? 'border-red-500' : ''}
                    />
                    {errors.cost && (
                      <p className="text-sm text-red-500">{errors.cost}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      name="quantity"
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={handleChange}
                      className={errors.quantity ? 'border-red-500' : ''}
                    />
                    {errors.quantity && (
                      <p className="text-sm text-red-500">{errors.quantity}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Warranty Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Warranty Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="warrantyStart">Warranty Start Date</Label>
                    <Input
                      id="warrantyStart"
                      name="warrantyStart"
                      type="date"
                      value={formData.warrantyStart}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="warrantyEnd">Warranty End Date</Label>
                    <Input
                      id="warrantyEnd"
                      name="warrantyEnd"
                      type="date"
                      value={formData.warrantyEnd}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Assignment Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Assignment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => handleSelectChange('status', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DEVICE_STATUS.map(status => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="departmentId">Department</Label>
                    <Select value={formData.departmentId} onValueChange={(value) => handleSelectChange('departmentId', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Not Assigned</SelectItem>
                        {mockDepartments.map(dept => (
                          <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="locationId">Location</Label>
                    <Select value={formData.locationId} onValueChange={(value) => handleSelectChange('locationId', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Not Assigned</SelectItem>
                        {mockLocations.map(loc => (
                          <SelectItem key={loc.id} value={loc.id}>
                            {loc.building} - {loc.floor} - {loc.room}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="inchargeUserId">In-Charge User ID</Label>
                    <Input
                      id="inchargeUserId"
                      name="inchargeUserId"
                      value={formData.inchargeUserId}
                      onChange={handleChange}
                      placeholder="User ID"
                    />
                  </div>
                </div>
              </div>

              {/* Features */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Features</h3>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      placeholder="Add a feature (e.g., SFP Ports, PoE Support)"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                    />
                    <Button
                      type="button"
                      onClick={addFeature}
                      variant="outline"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {formData.features.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.features.map(feature => (
                        <div
                          key={feature}
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                        >
                          {feature}
                          <button
                            type="button"
                            onClick={() => removeFeature(feature)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Additional notes or remarks about the device"
                  rows={4}
                />
              </div>

              {/* Form Actions */}
              <div className="flex gap-4 pt-6 border-t">
                <Button
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : id ? 'Update Device' : 'Create Device'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/inventory')}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
