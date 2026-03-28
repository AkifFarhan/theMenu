import { useState } from 'react';
import { Table, Button, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import '../addFood.css';
import ApiClient from '../api';
import toast from 'react-hot-toast';

const CATEGORIES = ['Vegetables', 'Meat', 'Dairy', 'Pantry', 'Other'];
const UNITS = ['g', 'ml', 'piece'] as const;
type Unit = (typeof UNITS)[number];

interface FoodItem {
  id: number;
  name: string;
  quantity: string;
  unit: Unit;
  price: string;
  category: string;
}

const EMPTY_FORM = { name: '', quantity: '', unit: 'piece' as Unit, price: '', category: 'Vegetables' };
const api = new ApiClient();

export default function AddFood() {
  const navigate = useNavigate();
  const [items, setItems] = useState<FoodItem[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<number | null>(null);
  const [editData, setEditData] = useState(EMPTY_FORM);

  const handleAdd = () => {
    if (!form.name.trim()) return;
    setItems(prev => [...prev, { ...form, id: Date.now() }]);
    setForm(EMPTY_FORM);
  };

  const handleDelete = (id: number) => setItems(prev => prev.filter(it => it.id !== id));

  const handleEditStart = (it: FoodItem) => {
    setEditId(it.id);
    setEditData({ name: it.name, quantity: it.quantity, unit: it.unit, price: it.price, category: it.category });
  };

  const handleEditSave = (id: number) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...editData } : it));
    setEditId(null);
  };

  const handleConfirm = () => {
    if (items.length === 0) {
      return;
    }

    const payload = items
      .map((item) => ({
        name: item.name.trim(),
        quantity: Number.parseFloat(item.quantity),
        unit: item.unit,
      }))
      .filter((item) => item.name.length > 0 && Number.isFinite(item.quantity) && item.quantity > 0);

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

  const totalCost = items.reduce((sum, it) => {
    const n = parseFloat(it.price.replace(/[^0-9.]/g, ''));
    return sum + (isNaN(n) ? 0 : n);
  }, 0);

  return (
    <div className="add-food-wrapper">
      <h3>Add Food</h3>

      <div className="add-food-form">
        <h5>New Item</h5>
        <Form>
          <Form.Group className="mb-2">
            <Form.Label>Name</Form.Label>
            <Form.Control
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Chicken breast"
            />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Quantity</Form.Label>
            <Form.Control
              value={form.quantity}
              onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
              placeholder="e.g. 1.5 kg"
            />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Unit</Form.Label>
            <Form.Select
              value={form.unit}
              onChange={e => setForm(f => ({ ...f, unit: e.target.value as Unit }))}
            >
              {UNITS.map((u) => <option key={u}>{u}</option>)}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Price</Form.Label>
            <Form.Control
              value={form.price}
              onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
              placeholder="e.g. $12.00"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Category</Form.Label>
            <Form.Select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            >
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </Form.Select>
          </Form.Group>

          <Button variant="success" onClick={handleAdd}>Add Item</Button>
        </Form>
      </div>

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Name</th>
            <th>Quantity</th>
            <th>Unit</th>
            <th>Price</th>
            <th>Category</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(it => (
            <tr key={it.id}>
              {editId === it.id ? (
                <>
                  <td><Form.Control size="sm" value={editData.name}     onChange={e => setEditData(d => ({ ...d, name: e.target.value }))} /></td>
                  <td><Form.Control size="sm" value={editData.quantity}  onChange={e => setEditData(d => ({ ...d, quantity: e.target.value }))} /></td>
                  <td>
                    <Form.Select size="sm" value={editData.unit} onChange={e => setEditData(d => ({ ...d, unit: e.target.value as Unit }))}>
                      {UNITS.map(u => <option key={u}>{u}</option>)}
                    </Form.Select>
                  </td>
                  <td><Form.Control size="sm" value={editData.price}     onChange={e => setEditData(d => ({ ...d, price: e.target.value }))} /></td>
                  <td>
                    <Form.Select size="sm" value={editData.category} onChange={e => setEditData(d => ({ ...d, category: e.target.value }))}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </Form.Select>
                  </td>
                  <td>
                    <Button size="sm" variant="success" className="me-2" onClick={() => handleEditSave(it.id)}>Save</Button>
                    <Button size="sm" variant="secondary" onClick={() => setEditId(null)}>Cancel</Button>
                  </td>
                </>
              ) : (
                <>
                  <td>{it.name}</td>
                  <td>{it.quantity}</td>
                  <td>{it.unit}</td>
                  <td>{it.price}</td>
                  <td>{it.category}</td>
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
        <span className="total-cost me-4">Total: ${totalCost.toFixed(2)}</span>
        <Button variant="primary" onClick={handleConfirm} disabled={items.length === 0}>
          Confirm to Inventory
        </Button>
      </div>
    </div>
  );
}
