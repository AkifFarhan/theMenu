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
  const [editId, setEditId] = useState<number | null>(null);
  const [editData, setEditData] = useState({ name: '', quantity: '', category: '' });
  const navigate = useNavigate();

  const handleDelete = (id: number) => {
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    localStorage.setItem('inventoryItems', JSON.stringify(updated));
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
      <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap page-heading-row">
        <div className="inventory-chip">My Inventory</div>
        <Button className="btn-navy" onClick={() => navigate('/recipes')}>
          Generate Recipes
        </Button>
      </div>

      <div className="themed-card mt-3">
        <Table className="themed-table mb-0" responsive>
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
                    <td>{it.quantity}</td>
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
    </div>
  );
}
