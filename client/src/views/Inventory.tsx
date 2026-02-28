import React, { useState } from 'react';
import { Table, Button, Form } from 'react-bootstrap';

interface Item {
  id: number;
  name: string;
  quantity: string;
  category?: string;
}

export default function Inventory() {
  const [items, setItems] = useState<Item[]>([
    { id: 1, name: 'Tomato', quantity: '3', category: 'Vegetable' },
    { id: 2, name: 'Onion', quantity: '5', category: 'Vegetable' },
    { id: 3, name: 'Chicken', quantity: '1', category: 'Meat' },
  ]);

  const handleDelete = (id: number) => setItems((s) => s.filter((i) => i.id !== id));

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
