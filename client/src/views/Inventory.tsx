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
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  return (
    <div style={{ paddingTop: 80 }}>
      <div className="d-flex align-items-center justify-content-between gap-2">
        <h3 className="mb-0">My Inventory</h3>
        <Button variant="secondary" onClick={() => navigate('/recipes')}>
          Generate Recipes
        </Button>
      </div>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Name</th>
            <th>Quantity</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr>
              <td colSpan={3} className="text-center py-4">
                <Spinner animation="border" size="sm" className="me-2" />
                Loading inventory...
              </td>
            </tr>
          )}

          {!isLoading && items.length === 0 && (
            <tr>
              <td colSpan={3} className="text-center text-muted py-4">
                Your inventory is empty.
              </td>
            </tr>
          )}

          {!isLoading &&
            items.map((it) => (
              <tr key={it.id}>
                <td>{it.name}</td>
                <td>{it.quantity} {it.unit}</td>
                <td>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(it.id)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
        </tbody>
      </Table>

      {error && <Alert variant="warning" className="mt-3 mb-0">{error}</Alert>}
    </div>
  );
}
