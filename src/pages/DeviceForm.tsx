import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, ArrowLeft, Plus, X, MapPin, Building2, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { devicesApi, departmentsApi, locationsApi } from '@/lib/api';
import { Department, Location, Device } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';

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
  'UPS',
  'SBC',
  'Other',
];

const DEVICE_STATUS = ['IN_STOCK', 'ASSIGNED', 'MAINTENANCE', 'SCRAPPED'];

export default function DeviceForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [existingDevice, setExistingDevice] = useState<Device | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  const [formData, setFormData] = useState({
    assetTag: '',
    deviceName: '',
    category: '',
    brand: '',
    deviceModel: '',
    serialNumber: '',
    macAddress: '',
    ipAddress: '',
    purchaseDate: '',
    arrivalDate: '',
    vendor: '',
    invoiceNumber: '',
    billDate: '',
    billAmount: '',
    cost: '',
    quantity: '1',
    warrantyStart: '',
    warrantyEnd: '',
    status: 'IN_STOCK',
    departmentId: '',
    locationId: '',
    features: [] as string[],
    notes: '',
  });

  const [newFeature, setNewFeature] = useState('');
  const [noWarrantyExpiry, setNoWarrantyExpiry] = useState(true);
  const [warrantyYears, setWarrantyYears] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const deptRes = await departmentsApi.getDepartments({ limit: 100 });
        setDepartments(deptRes.data.data?.departments || []);

        if (id) {
          const devRes = await devicesApi.getDeviceById(id);
          const dev = devRes.data.data?.device;
          if (dev) {
            setExistingDevice(dev);
            const formatDate = (d?: string) => d ? new Date(d).toISOString().split('T')[0] : '';
            setFormData({
              assetTag: dev.assetTag || '',
              deviceName: dev.deviceName || '',
              category: dev.category || '',
              brand: dev.brand || '',
              deviceModel: dev.deviceModel || '',
              serialNumber: dev.serialNumber || '',
              macAddress: dev.macAddress || '',
              ipAddress: dev.ipAddress || '',
              purchaseDate: formatDate(dev.purchaseDate),
              arrivalDate: formatDate(dev.arrivalDate),
              vendor: dev.vendor || '',
              invoiceNumber: dev.invoiceNumber || '',
              billDate: formatDate(dev.billDate),
              billAmount: dev.billAmount?.toString() || '',
              cost: dev.cost?.toString() || '',
              quantity: dev.quantity?.toString() || '1',
              warrantyStart: formatDate(dev.warrantyStart),
              warrantyEnd: formatDate(dev.warrantyEnd),
              status: dev.status || 'IN_STOCK',
              departmentId: (dev.departmentId as string) || '',
              locationId: (dev.locationId as string) || '',
              features: dev.features || [],
              notes: dev.notes || '',
            });
            setNoWarrantyExpiry(!dev.warrantyEnd);
          }
        }
      } catch (err) {
        console.error('Failed to load form data', err);
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Fetch locations filtered by selected department
  useEffect(() => {
    if (!formData.departmentId || formData.departmentId === 'none') {
      setLocations([]);
      return;
    }
    const fetchLocations = async () => {
      setLocationsLoading(true);
      try {
        const res = await locationsApi.getLocationsByDepartment(formData.departmentId);
        setLocations(res.data.data?.locations || res.data.data || []);
      } catch (err) {
        console.error('Failed to load locations for department:', err);
        setLocations([]);
      } finally {
        setLocationsLoading(false);
      }
    };
    fetchLocations();
  }, [formData.departmentId]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.deviceName.trim()) newErrors.deviceName = 'Device name is required';
    if (!formData.category.trim()) newErrors.category = 'Category is required';
    if (!formData.brand.trim()) newErrors.brand = 'Brand is required';
    if (!formData.deviceModel.trim()) newErrors.deviceModel = 'Model is required';
    if (!formData.serialNumber.trim()) newErrors.serialNumber = 'Serial number is required';
    if (!formData.purchaseDate.trim()) newErrors.purchaseDate = 'Purchase date is required';
    if (!formData.arrivalDate.trim()) newErrors.arrivalDate = 'Arrival date is required';
    if (!formData.vendor.trim()) newErrors.vendor = 'Vendor is required';
    if (!formData.cost || parseFloat(formData.cost) < 0) newErrors.cost = 'Valid cost is required';
    if (!formData.quantity || parseInt(formData.quantity) < 1) newErrors.quantity = 'Quantity must be at least 1';
    if (formData.billAmount && parseFloat(formData.billAmount) < 0) newErrors.billAmount = 'Bill amount must be positive';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      const payload: Record<string, any> = {
        assetTag: formData.assetTag || undefined,
        deviceName: formData.deviceName,
        category: formData.category,
        brand: formData.brand,
        deviceModel: formData.deviceModel,
        serialNumber: formData.serialNumber,
        macAddress: formData.macAddress || undefined,
        ipAddress: formData.ipAddress || undefined,
        purchaseDate: formData.purchaseDate,
        arrivalDate: formData.arrivalDate,
        vendor: formData.vendor,
        invoiceNumber: formData.invoiceNumber || undefined,
        billDate: formData.billDate || undefined,
        billAmount: formData.billAmount ? parseFloat(formData.billAmount) : undefined,
        cost: parseFloat(formData.cost),
        quantity: parseInt(formData.quantity),
        warrantyStart: formData.warrantyStart || undefined,
        warrantyEnd: noWarrantyExpiry ? undefined : (formData.warrantyEnd || undefined),
        status: formData.status,
        departmentId: formData.departmentId && formData.departmentId !== 'none' ? formData.departmentId : undefined,
        locationId: formData.locationId && formData.locationId !== 'none' ? formData.locationId : undefined,
        features: formData.features.length > 0 ? formData.features : undefined,
        notes: formData.notes || undefined,
      };

      if (id) {
        await devicesApi.updateDevice(id, payload);
      } else {
        await devicesApi.createDevice(payload);
      }
      navigate('/inventory');
    } catch (error) {
      setErrors({ submit: 'Failed to save device. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'warrantyEnd') setNoWarrantyExpiry(!value);
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      // Reset location when department changes
      if (name === 'departmentId') {
        updated.locationId = '';
      }
      return updated;
    });
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const getWarrantyBaseDate = () => {
    return formData.warrantyStart || formData.purchaseDate || formData.arrivalDate;
  };

  const applyWarrantyYears = (yearsStr: string) => {
    if (yearsStr === 'manual') return;
    const years = parseInt(yearsStr);
    const base = getWarrantyBaseDate();
    if (!base) return;
    const baseDate = new Date(base);
    baseDate.setFullYear(baseDate.getFullYear() + years);
    const nextEnd = baseDate.toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, warrantyEnd: nextEnd }));
    setNoWarrantyExpiry(false);
  };

  const addFeature = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
      setFormData(prev => ({ ...prev, features: [...prev.features, newFeature.trim()] }));
      setNewFeature('');
    }
  };

  const removeFeature = (feature: string) => {
    setFormData(prev => ({ ...prev, features: prev.features.filter(f => f !== feature) }));
  };

  const getDepartmentName = (deptId?: string) => {
    if (!deptId || deptId === 'none') return 'Not Assigned';
    const dept = departments.find((d: any) => (d._id || d.id) === deptId);
    return dept?.name || 'Unknown';
  };

  const getLocationName = (locId?: string) => {
    if (!locId || locId === 'none') return 'Not Assigned';
    const loc = locations.find((l: any) => (l._id || l.id) === locId);
    return loc ? `${loc.building}, ${loc.floor}, ${loc.room}` : 'Unknown';
  };

  if (dataLoading) {
    return <div className="p-6 lg:p-8 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/20 to-muted/50 p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/inventory')} className="mb-6 hover:bg-muted">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Inventory
        </Button>

        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
            <CardTitle className="text-2xl">{id ? 'Edit Device' : 'Add New Device'}</CardTitle>
            <CardDescription className="text-base">
              {id ? 'Update device information' : 'Register a new device in the inventory'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            {id && existingDevice && (
              <Alert className="mb-8 border-blue-200 bg-blue-50">
                <Info className="h-5 w-5 text-blue-600" />
                <AlertDescription className="text-blue-900 ml-2">
                  <div className="font-semibold mb-2">Current Assignment Status</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <div>
                        <p className="text-xs text-muted-foreground">Department</p>
                        <p className="font-medium">{getDepartmentName(existingDevice.departmentId as string)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <div>
                        <p className="text-xs text-muted-foreground">Location</p>
                        <p className="font-medium text-xs">{getLocationName(existingDevice.locationId as string)}</p>
                      </div>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {errors.submit && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.submit}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="border-b pb-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-1 bg-primary rounded"></div>
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="assetTag">Asset Tag</Label>
                    <Input id="assetTag" name="assetTag" value={formData.assetTag} onChange={handleChange} placeholder="e.g., AST-2024-001" className="bg-white" />
                    <p className="text-xs text-muted-foreground">Auto-generated if left empty</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deviceName">Device Name *</Label>
                    <Input id="deviceName" name="deviceName" value={formData.deviceName} onChange={handleChange} placeholder="e.g., Core Switch 01" className={`bg-white ${errors.deviceName ? 'border-red-500' : ''}`} />
                    {errors.deviceName && <p className="text-sm text-red-500">{errors.deviceName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(v) => handleSelectChange('category', v)}>
                      <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEVICE_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand *</Label>
                    <Input id="brand" name="brand" value={formData.brand} onChange={handleChange} placeholder="e.g., Cisco" className={errors.brand ? 'border-red-500' : ''} />
                    {errors.brand && <p className="text-sm text-red-500">{errors.brand}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deviceModel">Model *</Label>
                    <Input id="deviceModel" name="deviceModel" value={formData.deviceModel} onChange={handleChange} placeholder="e.g., Catalyst 9300" className={errors.deviceModel ? 'border-red-500' : ''} />
                    {errors.deviceModel && <p className="text-sm text-red-500">{errors.deviceModel}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serialNumber">Serial Number *</Label>
                    <Input id="serialNumber" name="serialNumber" value={formData.serialNumber} onChange={handleChange} placeholder="e.g., CSC-98765432" className={errors.serialNumber ? 'border-red-500' : ''} />
                    {errors.serialNumber && <p className="text-sm text-red-500">{errors.serialNumber}</p>}
                  </div>
                </div>
              </div>

              {/* Network */}
              <div className="border-b pb-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-1 bg-primary rounded"></div>
                  <h3 className="text-lg font-semibold">Network Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="macAddress">MAC Address</Label>
                    <Input id="macAddress" name="macAddress" value={formData.macAddress} onChange={handleChange} placeholder="e.g., AA:BB:CC:DD:EE:01" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ipAddress">IP Address</Label>
                    <Input id="ipAddress" name="ipAddress" value={formData.ipAddress} onChange={handleChange} placeholder="e.g., 192.168.1.1" />
                  </div>
                </div>
              </div>

              {/* Purchase & Bill */}
              <div className="border-b pb-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-1 bg-primary rounded"></div>
                  <h3 className="text-lg font-semibold">Purchase & Bill Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="purchaseDate">Purchase Date *</Label>
                    <Input id="purchaseDate" name="purchaseDate" type="date" value={formData.purchaseDate} onChange={handleChange} className={errors.purchaseDate ? 'border-red-500' : ''} />
                    {errors.purchaseDate && <p className="text-sm text-red-500">{errors.purchaseDate}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="arrivalDate">Arrival Date *</Label>
                    <Input id="arrivalDate" name="arrivalDate" type="date" value={formData.arrivalDate} onChange={handleChange} className={errors.arrivalDate ? 'border-red-500' : ''} />
                    {errors.arrivalDate && <p className="text-sm text-red-500">{errors.arrivalDate}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vendor">Vendor *</Label>
                    <Input id="vendor" name="vendor" value={formData.vendor} onChange={handleChange} placeholder="e.g., Tech Solutions Inc." className={errors.vendor ? 'border-red-500' : ''} />
                    {errors.vendor && <p className="text-sm text-red-500">{errors.vendor}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invoiceNumber">Invoice Number</Label>
                    <Input id="invoiceNumber" name="invoiceNumber" value={formData.invoiceNumber} onChange={handleChange} placeholder="e.g., INV-2024-0001" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billDate">Bill Date</Label>
                    <Input id="billDate" name="billDate" type="date" value={formData.billDate} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billAmount">Bill Amount</Label>
                    <Input id="billAmount" name="billAmount" type="number" step="0.01" value={formData.billAmount} onChange={handleChange} placeholder="0.00" className={errors.billAmount ? 'border-red-500' : ''} />
                    {errors.billAmount && <p className="text-sm text-red-500">{errors.billAmount}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cost">Cost *</Label>
                    <Input id="cost" name="cost" type="number" step="0.01" value={formData.cost} onChange={handleChange} placeholder="0.00" className={errors.cost ? 'border-red-500' : ''} />
                    {errors.cost && <p className="text-sm text-red-500">{errors.cost}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input id="quantity" name="quantity" type="number" min="1" value={formData.quantity} onChange={handleChange} className={errors.quantity ? 'border-red-500' : ''} />
                    {errors.quantity && <p className="text-sm text-red-500">{errors.quantity}</p>}
                  </div>
                </div>
              </div>

              {/* Warranty */}
              <div className="border-b pb-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-1 bg-primary rounded"></div>
                  <h3 className="text-lg font-semibold">Warranty Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="warrantyStart">Warranty Start Date</Label>
                    <Input id="warrantyStart" name="warrantyStart" type="date" value={formData.warrantyStart} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="warrantyEnd">Warranty End Date</Label>
                      <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Checkbox
                          checked={noWarrantyExpiry}
                          onCheckedChange={(value) => {
                            const checked = Boolean(value);
                            setNoWarrantyExpiry(checked);
                            if (checked) {
                              setFormData(prev => ({ ...prev, warrantyEnd: '' }));
                              setWarrantyYears('');
                            }
                          }}
                        />
                        No Expiry
                      </label>
                    </div>
                    <Input id="warrantyEnd" name="warrantyEnd" type="date" value={formData.warrantyEnd} onChange={handleChange} disabled={noWarrantyExpiry} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="warrantyYears">Add Years</Label>
                    <Select value={warrantyYears} onValueChange={(v) => { setWarrantyYears(v); applyWarrantyYears(v); }}>
                      <SelectTrigger><SelectValue placeholder="Select years" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual Entry</SelectItem>
                        <SelectItem value="1">1 Year</SelectItem>
                        <SelectItem value="2">2 Years</SelectItem>
                        <SelectItem value="3">3 Years</SelectItem>
                        <SelectItem value="5">5 Years</SelectItem>
                        <SelectItem value="10">10 Years</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Uses warranty start, purchase, or arrival date.</p>
                  </div>
                </div>
              </div>

              {/* Assignment */}
              <div className="border-b pb-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-1 bg-primary rounded"></div>
                  <h3 className="text-lg font-semibold">Assignment Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(v) => handleSelectChange('status', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DEVICE_STATUS.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="departmentId">Department</Label>
                    <Select value={formData.departmentId} onValueChange={(v) => handleSelectChange('departmentId', v)}>
                      <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not Assigned</SelectItem>
                        {departments.map((dept: any) => <SelectItem key={dept._id || dept.id} value={dept._id || dept.id}>{dept.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="locationId">Location</Label>
                    <Select
                      value={formData.locationId}
                      onValueChange={(v) => handleSelectChange('locationId', v)}
                      disabled={!formData.departmentId || formData.departmentId === 'none' || locationsLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={locationsLoading ? 'Loading locations...' : (!formData.departmentId || formData.departmentId === 'none') ? 'Select a department first' : 'Select location'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not Assigned</SelectItem>
                        {locations.map((loc: any) => <SelectItem key={loc._id || loc.id} value={loc._id || loc.id}>{loc.building} - {loc.floor} - {loc.room}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="border-b pb-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-1 bg-primary rounded"></div>
                  <h3 className="text-lg font-semibold">Features</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      placeholder="Add a feature (e.g., SFP Ports, PoE Support)"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                    />
                    <Button type="button" onClick={addFeature} variant="outline"><Plus className="h-4 w-4" /></Button>
                  </div>
                  {formData.features.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.features.map(feature => (
                        <div key={feature} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                          {feature}
                          <button type="button" onClick={() => removeFeature(feature)} className="text-blue-600 hover:text-blue-900">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="border-b pb-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-1 bg-primary rounded"></div>
                  <h3 className="text-lg font-semibold">Additional Notes</h3>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} placeholder="Additional notes or remarks about the device" rows={4} className="bg-white" />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-6 justify-between">
                <Button type="button" variant="outline" onClick={() => navigate('/inventory')} disabled={isLoading} className="px-8">Cancel</Button>
                <Button type="submit" disabled={isLoading} className="px-8 bg-primary hover:bg-primary/90">
                  {isLoading ? 'Saving...' : id ? 'Update Device' : 'Create Device'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
