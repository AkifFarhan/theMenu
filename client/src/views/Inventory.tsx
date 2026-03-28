import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Spinner, Table, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import ApiClient from '../api';
import toast from 'react-hot-toast';

interface Item {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  expiry_date?: string;
  ingredient_id: number;
}

const api = new ApiClient();

export default function Inventory() {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editData, setEditData] = useState<{ quantity: string; expiry_date: string }>({ quantity: '', expiry_date: '' });
  const navigate = useNavigate();

  // Check if an item is expired
  const isExpired = (expiryDate?: string): boolean => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const loadInventory = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.getInventory();
      setItems(Array.isArray(response.items) ? response.items : []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load inventory.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await api.deleteInventoryItem(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      toast.success('Item deleted successfully');
    } catch {
      // Toast is handled in ApiClient.
    }
  };

  const handleEditStart = (item: Item) => {
    setEditId(item.id);
    setEditData({
      quantity: item.quantity.toString(),
      expiry_date: item.expiry_date || ''
    });
  };

  const handleEditSave = async (id: number) => {
    if (!editData.quantity || isNaN(parseFloat(editData.quantity)) || parseFloat(editData.quantity) <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    try {
      await api.updateInventoryItem(id, {
        quantity: parseFloat(editData.quantity),
        expiry_date: editData.expiry_date || null
      });
      
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: parseFloat(editData.quantity),
                expiry_date: editData.expiry_date
              }
            : item
        )
      );
      setEditId(null);
      toast.success('Item updated successfully');
    } catch {
      // Toast is handled in ApiClient.
    }
  };

  const handleEditCancel = () => {
    setEditId(null);
  };

  return (
    <div className="inventory-page page-shell">
      <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap page-heading-row">
        <div className="inventory-chip">My Inventory</div>
        <Button className="btn-navy" onClick={() => navigate('/recipes')}>
          Generate Recipes
        </Button>
      </div>
<div className="themed-card mt-3">
  <Table className="themed-table mb-0" responsive striped bordered hover>
    <thead>
      <tr>
        <th>Name</th>
        <th>Quantity</th>
        <th>Expiry Date</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {/* 1. Loading State */}
      {isLoading && (
        <tr>
          <td colSpan={5} className="text-center py-4">
            <Spinner animation="border" size="sm" className="me-2" />
            Loading inventory...
          </td>
        </tr>
      )}

      {/* 2. Empty State */}
      {!isLoading && items.length === 0 && (
        <tr>
          <td colSpan={5} className="text-center text-muted py-4">
            Your inventory is empty.
          </td>
        </tr>
      )}

      {/* 3. Data Rows */}
      {!isLoading &&
        items.map((it) => (
          <tr key={it.id} className={isExpired(it.expiry_date) ? 'table-danger' : ''}>
            {editId === it.id ? (
              <>
                <td>{it.name}</td>
                <td>
                  <Form.Control
                    size="sm"
                    type="number"
                    step="0.01"
                    value={editData.quantity}
                    onChange={(e) => setEditData((prev) => ({ ...prev, quantity: e.target.value }))}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    type="date"
                    value={editData.expiry_date}
                    onChange={(e) => setEditData((prev) => ({ ...prev, expiry_date: e.target.value }))}
                  />
                </td>
                <td>-</td>
                <td>
                  <Button
                    size="sm"
                    variant="success"
                    className="me-2"
                    onClick={() => handleEditSave(it.id)}
                  >
                    Save
                  </Button>
                  <Button size="sm" variant="secondary" onClick={handleEditCancel}>
                    Cancel
                  </Button>
                </td>
              </>
            ) : (
              <>
                <td>{it.name}</td>
                <td>
                  {it.quantity} {it.unit}
                </td>
                <td>{it.expiry_date || '-'}</td>
                <td>
                  {isExpired(it.expiry_date) ? (
                    <Badge bg="danger">Expired</Badge>
                  ) : it.expiry_date ? (
                    <Badge bg="success">Good</Badge>
                  ) : (
                    <Badge bg="secondary">No date</Badge>
                  )}
                </td>
                <td>
                  <Button
                    size="sm"
                    variant="outline-primary"
                    className="me-2"
                    onClick={() => handleEditStart(it)}
                  >
                    Edit
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(it.id)}>
                    Delete
                  </Button>
                </td>
              </>
            )}
          </tr>
        ))}
    </tbody>
  </Table>
</div>

{/* 4. Error Alert */}
{error && <Alert variant="warning" className="mt-3 mb-0">{error}</Alert>}
    </div>
  );
}
