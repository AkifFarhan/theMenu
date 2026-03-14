import { useState, useEffect } from 'react';
import { Table, Button } from 'react-bootstrap';
import ApiClient from '../api';

interface InventoryItem {
  id: number;
  user_id: number;
  ingredient_id: number;
  quantity: number;
  expiry_date: string | null;
  ingredient: {
    id: number;
    name: string;
    base_unit: string;
  };
}

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const api = new ApiClient();

  useEffect(() => {
    const fetchInventories = async () => {
      const data = await api.getInventories();
      if (data) setItems(data);
    };
    fetchInventories();
  }, []);

  const handleDelete = async (id: number) => {
    // For now, just remove from state
    setItems(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div style={{ paddingTop: 80 }}>
      <h3>My Inventory</h3>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Name</th>
            <th>Quantity</th>
            <th>Unit</th>
            <th>Expiry Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id}>
              <td>{it.ingredient.name}</td>
              <td>{it.quantity}</td>
              <td>{it.ingredient.base_unit}</td>
              <td>{it.expiry_date}</td>
              <td>
                <Button size="sm" variant="outline-secondary" className="me-2">Edit</Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(it.id)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
