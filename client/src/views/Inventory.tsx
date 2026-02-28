import React, { useState } from 'react';
import { Table, Button, Form } from 'react-bootstrap';

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

  const handleDelete = (id: number) => {
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    localStorage.setItem('inventoryItems', JSON.stringify(updated));
  };

  return (
    <div style={{ paddingTop: 80 }}>
      <h3>My Inventory</h3>
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
