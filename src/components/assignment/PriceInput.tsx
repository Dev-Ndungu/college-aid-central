
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DollarSign, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface PriceInputProps {
  assignmentId: string;
  currentPrice?: number | null;
  onPriceUpdate: (assignmentId: string, price: number) => Promise<void>;
}

const PriceInput: React.FC<PriceInputProps> = ({
  assignmentId,
  currentPrice,
  onPriceUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [price, setPrice] = useState(currentPrice?.toString() || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    setIsLoading(true);
    try {
      await onPriceUpdate(assignmentId, numericPrice);
      setIsEditing(false);
      toast.success('Price updated successfully');
    } catch (error) {
      toast.error('Failed to update price');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setPrice(currentPrice?.toString() || '');
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className="flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-gray-500" />
        <span className="font-medium">
          {currentPrice ? `$${currentPrice.toFixed(2)}` : 'No price set'}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(true)}
          className="h-6 px-2 text-xs"
        >
          {currentPrice ? 'Edit' : 'Set Price'}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <DollarSign className="h-4 w-4 text-gray-500" />
      <div className="flex items-center gap-1">
        <Input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="0.00"
          className="w-20 h-6 text-xs"
          step="0.01"
          min="0"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSave}
          disabled={isLoading}
          className="h-6 w-6 p-0"
        >
          <Check className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          disabled={isLoading}
          className="h-6 w-6 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

export default PriceInput;
