import { useState, useEffect } from 'react';
import { Table, Button, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import '../addFood.css';
import ApiClient from '../api';
import toast from 'react-hot-toast';

interface Ingredient {
  id: number;
  name: string;
  base_unit: string;
}

interface FoodItem {
  id: number;
  ingredient_id: number;
  ingredient_name: string;
  quantity: string;
  unit: string;
  expiry_date: string;
}

const EMPTY_FORM = { ingredient_id: '', quantity: '', expiry_date: '' };
const api = new ApiClient();

export default function AddFood() {
  const navigate = useNavigate();
  const [items, setItems] = useState<FoodItem[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [editId, setEditId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<FoodItem>>({});
  const [loading, setLoading] = useState(true);

  // Load ingredients on mount
  useEffect(() => {
    const loadIngredients = async () => {
      try {
        const response = await api.getIngredients();
        setIngredients(response.ingredients || []);
      } catch (error) {
        toast.error('Failed to load ingredients');
        setIngredients([]);
      } finally {
        setLoading(false);
      }
    };
    loadIngredients();
  }, []);

  // Get ingredient details by ID
  const getIngredient = (ingredientId: number) => {
    return ingredients.find(ing => ing.id === ingredientId);
  };

  const handleAdd = () => {
    if (!form.ingredient_id || !form.quantity.trim()) {
      toast.error('Please select an ingredient and enter a quantity');
      return;
    }

    const ingredientId = parseInt(form.ingredient_id);
    const ingredient = getIngredient(ingredientId);

    if (!ingredient) {
      toast.error('Selected ingredient not found');
      return;
    }

    setItems(prev => [...prev, {
      id: Date.now(),
      ingredient_id: ingredientId,
      ingredient_name: ingredient.name,
      quantity: form.quantity,
      unit: ingredient.base_unit,
      expiry_date: form.expiry_date
    }]);
    setForm(EMPTY_FORM);
  };

  const handleDelete = (id: number) => setItems(prev => prev.filter(it => it.id !== id));

  const handleEditStart = (it: FoodItem) => {
    setEditId(it.id);
    setEditData({
      ingredient_id: it.ingredient_id,
      ingredient_name: it.ingredient_name,
      quantity: it.quantity,
      unit: it.unit,
      expiry_date: it.expiry_date
    });
  };

  const handleEditSave = (id: number) => {
    if (!editData.quantity || !editData.quantity.toString().trim()) {
      toast.error('Please enter a quantity');
      return;
    }

    setItems(prev => prev.map(it => it.id === id ? { ...it, ...editData } as FoodItem : it));
    setEditId(null);
  };

  const handleConfirm = () => {
    if (items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    const payload = items
      .map((item) => ({
        ingredient_id: item.ingredient_id,
        quantity: parseFloat(item.quantity),
        expiry_date: item.expiry_date || null
      }))
      .filter((item) => Number.isFinite(item.quantity) && item.quantity > 0);

    if (payload.length === 0) {
      toast.error('Add at least one valid item with a numeric quantity.');
      return;
    }

    api
      .addInventoryItems(payload)
      .then(() => {
        toast.success('Inventory saved successfully');
        setItems([]);
        navigate('/inventory');
      })
      .catch(() => {
        // Toast is handled in ApiClient.
      });
  };

  return (
    <div className="add-food-wrapper">
      <div className="inventory-chip add-food-chip">Add Food</div>

      {loading ? (
        <div className="text-center py-4">Loading ingredients...</div>
      ) : (
        <>
          <div className="add-food-form">
            <h5>New Item</h5>
            <Form>
              <Form.Group className="mb-2">
                <Form.Label>Ingredient</Form.Label>
                <Form.Select
                  value={form.ingredient_id}
                  onChange={e => setForm(f => ({ ...f, ingredient_id: e.target.value }))}
                >
                  <option value="">-- Select an ingredient --</option>
                  {ingredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label>Quantity</Form.Label>
                <Form.Control
                  value={form.quantity}
                  onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                  placeholder="e.g. 500"
                  type="number"
                  step="0.01"
                />
              </Form.Group>

              {form.ingredient_id && (
                <Form.Group className="mb-2">
                  <Form.Label>Unit</Form.Label>
                  <Form.Control
                    value={getIngredient(parseInt(form.ingredient_id))?.base_unit || ''}
                    disabled
                  />
                </Form.Group>
              )}

              <Form.Group className="mb-3">
                <Form.Label>Expiry Date (Optional)</Form.Label>
                <Form.Control
                  type="date"
                  value={form.expiry_date}
                  onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))}
                />
              </Form.Group>

              <Button variant="success" onClick={handleAdd}>Add Item</Button>
            </Form>
          </div>

          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Ingredient</th>
                <th>Quantity</th>
                <th>Unit</th>
                <th>Expiry Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={it.id}>
                  {editId === it.id ? (
                    <>
                      <td>{it.ingredient_name}</td>
                      <td>
                        <Form.Control
                          size="sm"
                          type="number"
                          step="0.01"
                          value={editData.quantity}
                          onChange={e => setEditData(d => ({ ...d, quantity: e.target.value }))}
                        />
                      </td>
                      <td>{it.unit}</td>
                      <td>
                        <Form.Control
                          size="sm"
                          type="date"
                          value={editData.expiry_date || ''}
                          onChange={e => setEditData(d => ({ ...d, expiry_date: e.target.value }))}
                        />
                      </td>
                      <td>
                        <Button size="sm" variant="success" className="me-2" onClick={() => handleEditSave(it.id)}>Save</Button>
                        <Button size="sm" variant="secondary" onClick={() => setEditId(null)}>Cancel</Button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{it.ingredient_name}</td>
                      <td>{it.quantity}</td>
                      <td>{it.unit}</td>
                      <td>{it.expiry_date || '-'}</td>
                      <td>
                        <Button size="sm" variant="outline-secondary" className="me-2" onClick={() => handleEditStart(it)}>Edit</Button>
                        <Button size="sm" variant="danger" onClick={() => handleDelete(it.id)}>Delete</Button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>

          <div className="add-food-confirm">
            <span className="me-4">{items.length} item(s) added</span>
            <Button variant="primary" onClick={handleConfirm} disabled={items.length === 0}>
              Confirm to Inventory
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
