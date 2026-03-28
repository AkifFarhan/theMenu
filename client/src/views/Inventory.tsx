import { useState } from 'react';
import { Table, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

interface Item {
  id: number;
  name: string;
  quantity: string;
  category?: string;
}

function loadItems(): Item[] {
  try {
    const stored = localStorage.getItem('inventoryItems');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export default function Inventory() {
  const [items, setItems] = useState<Item[]>(loadItems);
  const navigate = useNavigate();

  const handleDelete = (id: number) => {
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    localStorage.setItem('inventoryItems', JSON.stringify(updated));
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
            <th>Category</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id}>
              <td>{it.name}</td>
              <td>{it.quantity}</td>
              <td>{it.category}</td>
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
