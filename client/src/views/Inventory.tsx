import { useEffect, useState } from 'react';
import { Alert, Button, Spinner, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import ApiClient from '../api';

interface Item {
  id: number;
  name: string;
  quantity: number;
  unit: string;
}

const api = new ApiClient();

export default function Inventory() {
const [items, setItems] = useState<Item[]>(loadItems);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

const [editId, setEditId] = useState<number | null>(null);
const [editData, setEditData] = useState({ name: '', quantity: '', category: '' });

const navigate = useNavigate();
  const navigate = useNavigate();

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
    } catch {
      // Toast is handled in ApiClient.
    }
  };

  const handleEditStart = (item: Item) => {
    setEditId(item.id);
    setEditData({ name: item.name, quantity: item.quantity, category: item.category || '' });
  };

  const handleEditSave = (id: number) => {
    if (!editData.name.trim()) {
      return;
    }

    const updated = items.map((it) =>
      it.id === id ? { ...it, name: editData.name, quantity: editData.quantity, category: editData.category } : it
    );
    setItems(updated);
    localStorage.setItem('inventoryItems', JSON.stringify(updated));
    setEditId(null);
  };

  const handleEditCancel = () => {
    setEditId(null);
  };

  return (
    <div className="inventory-page page-shell">
      <div className="d-flex align-items-center justify-content-between gap-2 page-heading-row">
        <h3 className="page-heading mb-0">My Inventory</h3>
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
        <th>Category</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {/* 1. Loading State */}
      {isLoading && (
        <tr>
          <td colSpan={4} className="text-center py-4">
            <Spinner animation="border" size="sm" className="me-2" />
            Loading inventory...
          </td>
        </tr>
      )}

      {/* 2. Empty State */}
      {!isLoading && items.length === 0 && (
        <tr>
          <td colSpan={4} className="text-center text-muted py-4">
            Your inventory is empty.
          </td>
        </tr>
      )}

      {/* 3. Data Rows with Edit Logic */}
      {!isLoading &&
        items.map((it) => (
          <tr key={it.id}>
            {editId === it.id ? (
              <>
                <td>
                  <input
                    className="form-control form-control-sm"
                    value={editData.name}
                    onChange={(e) => setEditData((d) => ({ ...d, name: e.target.value }))}
                  />
                </td>
                <td>
                  <input
                    className="form-control form-control-sm"
                    value={editData.quantity}
                    onChange={(e) => setEditData((d) => ({ ...d, quantity: e.target.value }))}
                  />
                </td>
                <td>
                  <input
                    className="form-control form-control-sm"
                    value={editData.category}
                    onChange={(e) => setEditData((d) => ({ ...d, category: e.target.value }))}
                  />
                </td>
                <td>
                  <Button size="sm" variant="success" className="me-2" onClick={() => handleEditSave(it.id)}>
                    Save
                  </Button>
                  <Button size="sm" variant="outline-secondary" onClick={handleEditCancel}>
                    Cancel
                  </Button>
                </td>
              </>
            ) : (
              <>
                <td>{it.name}</td>
                <td>{it.quantity} {it.unit}</td>
                <td>{it.category}</td>
                <td>
                  <Button size="sm" variant="outline-secondary" className="me-2" onClick={() => handleEditStart(it)}>
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
{error && <Alert variant="warning" className="mt-3 mb-0">{error}</Alert>}    </div>
  );
}
