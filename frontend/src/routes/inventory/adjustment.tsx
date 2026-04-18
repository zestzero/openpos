import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Search, Package, ArrowUpDown, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const STORAGE_KEY = 'stock-adjustment-form';

interface FormData {
  variantId: string;
  adjustmentType: 'restock' | 'correction';
  quantity: string;
  reason: string;
  referenceId: string;
}

interface VariantOption {
  id: string;
  sku: string;
  barcode: string | null;
  product_name: string;
  current_stock: number;
}

export const Route = createFileRoute('/inventory/adjustment')({
  component: StockAdjustmentPage,
});

function StockAdjustmentPage() {
  const navigate = useNavigate();
  const [variants, setVariants] = useState<VariantOption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<VariantOption | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    variantId: '',
    adjustmentType: 'restock',
    quantity: '',
    reason: '',
    referenceId: '',
  });

  const loadSavedForm = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData({
          variantId: parsed.variantId || '',
          adjustmentType: parsed.adjustmentType || 'restock',
          quantity: parsed.quantity || '',
          reason: parsed.reason || '',
          referenceId: parsed.referenceId || '',
        });
      }
    } catch (e) {
      console.error('Failed to load saved form:', e);
    }
  }, []);

  useEffect(() => {
    loadSavedForm();
  }, [loadSavedForm]);

  useEffect(() => {
    const handleClickOutside = () => setIsDropdownOpen(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const searchVariants = async (query: string) => {
    if (query.length < 2) {
      setVariants([]);
      return;
    }
    setIsSearching(true);
    try {
      const { searchVariants } = await import('@/lib/api-client');
      const response = await searchVariants(query);
      setVariants(response.variants);
    } catch (error) {
      console.error('Failed to search variants:', error);
      toast.error('Failed to search variants');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setIsDropdownOpen(true);
    searchVariants(value);
  };

  const handleSelectVariant = (variant: VariantOption) => {
    setSelectedVariant(variant);
    setFormData(prev => ({ ...prev, variantId: variant.id }));
    setSearchQuery(`${variant.product_name} - ${variant.sku}`);
    setIsDropdownOpen(false);
    saveForm({ ...formData, variantId: variant.id });
  };

  const saveForm = (data: FormData) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save form:', e);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    saveForm(newData);
  };

  const validateForm = (): string | null => {
    if (!formData.variantId) return 'Please select a variant';
    if (!formData.quantity || parseInt(formData.quantity) <= 0) return 'Quantity must be greater than 0';
    if (!formData.reason || formData.reason.length < 10) return 'Reason must be at least 10 characters';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    setIsLoading(true);

    try {
      const { createInventoryAdjustment } = await import('@/lib/api-client');
      
      const adjustmentData = {
        variant_id: formData.variantId,
        adjustment_type: formData.adjustmentType,
        quantity: parseInt(formData.quantity),
        reason: formData.reason,
        reference_id: formData.referenceId || undefined,
      };

      const response = await createInventoryAdjustment(adjustmentData as any);
      
      toast.success(`Stock adjusted! New balance: ${response.new_balance}`);
      
      localStorage.removeItem(STORAGE_KEY);
      
      setFormData({
        variantId: '',
        adjustmentType: 'restock',
        quantity: '',
        reason: '',
        referenceId: '',
      });
      setSelectedVariant(null);
      setSearchQuery('');
      
    } catch (error) {
      console.error('Failed to create adjustment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create adjustment');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Stock Adjustment</CardTitle>
          <CardDescription>Adjust inventory for restocking or corrections</CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Variant</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by product, SKU, or barcode..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => setIsDropdownOpen(true)}
                  className="pl-9"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
                )}
              </div>
              
              {isDropdownOpen && variants.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {variants.map(variant => (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => handleSelectVariant(variant)}
                      className="w-full px-4 py-2 text-left hover:bg-accent flex items-center gap-2"
                    >
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="font-medium">{variant.product_name}</div>
                        <div className="text-sm text-muted-foreground">
                          SKU: {variant.sku} {variant.barcode && `| Barcode: ${variant.barcode}`}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Stock: {variant.current_stock}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {selectedVariant && (
                <div className="text-sm text-muted-foreground mt-1">
                  Selected: {selectedVariant.product_name} - {selectedVariant.sku} (Current stock: {selectedVariant.current_stock})
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Adjustment Type</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="adjustmentType"
                    value="restock"
                    checked={formData.adjustmentType === 'restock'}
                    onChange={() => handleInputChange('adjustmentType', 'restock')}
                    className="accent-primary"
                  />
                  <ArrowUpDown className="h-4 w-4 text-green-600" />
                  Restock (+)
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="adjustmentType"
                    value="correction"
                    checked={formData.adjustmentType === 'correction'}
                    onChange={() => handleInputChange('adjustmentType', 'correction')}
                    className="accent-primary"
                  />
                  <ArrowUpDown className="h-4 w-4 text-red-600" />
                  Correction (-)
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity *</label>
              <Input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', e.target.value)}
                placeholder="Enter quantity"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Reason *</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.reason}
                onChange={(e) => handleInputChange('reason', e.target.value)}
                placeholder="Enter reason (minimum 10 characters)"
                required
                minLength={10}
              />
              <div className="text-sm text-muted-foreground">
                {formData.reason.length}/10 characters
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Reference ID (Optional)</label>
              <Input
                type="text"
                value={formData.referenceId}
                onChange={(e) => handleInputChange('referenceId', e.target.value)}
                placeholder="e.g., PO-12345"
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex gap-2">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Adjustment'
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                localStorage.removeItem(STORAGE_KEY);
                setFormData({
                  variantId: '',
                  adjustmentType: 'restock',
                  quantity: '',
                  reason: '',
                  referenceId: '',
                });
                setSelectedVariant(null);
                setSearchQuery('');
              }}
            >
              Clear
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
