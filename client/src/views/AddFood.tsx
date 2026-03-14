import { useState, useEffect } from 'react';
import { Button, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import ApiClient from '../api';
import toast from 'react-hot-toast';

interface Ingredient {
  id: number;
  name: string;
  base_unit: string;
}

export default function AddFood() {
  const navigate = useNavigate();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedIngredient, setSelectedIngredient] = useState<number | ''>('');
  const [quantity, setQuantity] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const api = new ApiClient();

  useEffect(() => {
    const fetchIngredients = async () => {
      const data = await api.getIngredients();
      if (data) setIngredients(data);
    };
    fetchIngredients();
  }, []);

  const handleAdd = async () => {
    if (!selectedIngredient || !quantity) {
      toast.error('Please select ingredient and enter quantity');
      return;
    }

    const result = await api.addInventory(Number(selectedIngredient), parseFloat(quantity), expiryDate || undefined);
    if (result) {
      toast.success('Added to inventory');
      navigate('/inventory');
    }
  };

  return (
    <div className="add-food-wrapper" style={{ paddingTop: 80 }}>
      <h3>Add Food to Inventory</h3>

      <div className="add-food-form">
        <Form>
          <Form.Group className="mb-2">
            <Form.Label>Ingredient</Form.Label>
            <Form.Select
              value={selectedIngredient}
              onChange={e => setSelectedIngredient(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Select Ingredient</option>
              {ingredients.map(ing => (
                <option key={ing.id} value={ing.id}>{ing.name} ({ing.base_unit})</option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Quantity</Form.Label>
            <Form.Control
              type="number"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              placeholder="e.g. 500"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Expiry Date (optional)</Form.Label>
            <Form.Control
              type="date"
              value={expiryDate}
              onChange={e => setExpiryDate(e.target.value)}
            />
          </Form.Group>

          <Button variant="success" onClick={handleAdd}>Add to Inventory</Button>
        </Form>
      </div>
    </div>
  );
}