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

interface EditingItem {
  quantity: string;
  expiry_date: string;
}

const api = new ApiClient();

// Helper function to format date for display (YYYY-MM-DD)
const formatDateForDisplay = (dateString?: string): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  } catch {
    return dateString;
  }
};

// Helper function to format date for input field
const formatDateForInput = (dateString?: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  } catch {
    return dateString;
  }
};

export default function Inventory() {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingIds, setEditingIds] = useState<Set<number>>(new Set());
  const [editData, setEditData] = useState<Map<number, EditingItem>>(new Map());
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
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
    // Show confirmation dialog
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      await api.deleteInventoryItem(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      toast.success('Item deleted successfully');
    } catch {
      // Toast is handled in ApiClient.
    }
  };

  const handleEditStart = (item: Item) => {
    const newEditingIds = new Set(editingIds);
    newEditingIds.add(item.id);
    setEditingIds(newEditingIds);

    const newEditData = new Map(editData);
    newEditData.set(item.id, {
      quantity: item.quantity.toString(),
      expiry_date: formatDateForInput(item.expiry_date)
    });
    setEditData(newEditData);
  };

  const handleEditChange = (id: number, field: 'quantity' | 'expiry_date', value: string) => {
    const newEditData = new Map(editData);
    const current = newEditData.get(id) || { quantity: '', expiry_date: '' };
    newEditData.set(id, { ...current, [field]: value });
    setEditData(newEditData);
  };

  const handleEditCancel = (id: number) => {
    const newEditingIds = new Set(editingIds);
    newEditingIds.delete(id);
    setEditingIds(newEditingIds);

    const newEditData = new Map(editData);
    newEditData.delete(id);
    setEditData(newEditData);
  };

  const handleSaveAllChanges = async () => {
    // Validate all changes
    for (const [, data] of editData.entries()) {
      if (!data.quantity || isNaN(parseFloat(data.quantity)) || parseFloat(data.quantity) <= 0) {
        toast.error('Please enter valid quantities for all items');
        return;
      }
    }

    setIsSaving(true);
    try {
      const updatePromises = Array.from(editData.entries()).map(([id, data]) =>
        api.updateInventoryItem(id, {
          quantity: parseFloat(data.quantity),
          expiry_date: data.expiry_date || null
        })
      );

      await Promise.all(updatePromises);

      // Update local state
      setItems((prev) =>
        prev.map((item) => {
          const editedData = editData.get(item.id);
          if (editedData) {
            return {
              ...item,
              quantity: parseFloat(editedData.quantity),
              expiry_date: editedData.expiry_date
            };
          }
          return item;
        })
      );

      setEditingIds(new Set());
      setEditData(new Map());
      toast.success('All changes saved successfully');
    } catch {
      // Toast is handled in ApiClient.
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardAllChanges = () => {
    if (!window.confirm('Discard all unsaved changes?')) {
      return;
    }
    setEditingIds(new Set());
    setEditData(new Map());
  };

  // Pagination calculations
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = items.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
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
        paginatedItems.map((it) => {
          const isEditing = editingIds.has(it.id);
          const currentEditData = editData.get(it.id);

          return (
            <tr key={it.id} className={`${isExpired(it.expiry_date) ? 'table-danger' : ''} ${isEditing ? 'table-light' : ''}`}>
              {isEditing && currentEditData ? (
                <>
                  <td>{it.name}</td>
                  <td>
                    <Form.Control
                      size="sm"
                      type="number"
                      step="0.01"
                      value={currentEditData.quantity}
                      onChange={(e) => handleEditChange(it.id, 'quantity', e.target.value)}
                      autoFocus
                      min="0"
                    />
                  </td>
                  <td>
                    <Form.Control
                      size="sm"
                      type="date"
                      value={currentEditData.expiry_date}
                      onChange={(e) => handleEditChange(it.id, 'expiry_date', e.target.value)}
                    />
                  </td>
                  <td>-</td>
                  <td>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleEditCancel(it.id)}
                    >
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
                  <td>{formatDateForDisplay(it.expiry_date)}</td>
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
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(it.id)}
                      disabled={editingIds.size > 0}
                    >
                      Delete
                    </Button>
                  </td>
                </>
              )}
            </tr>
          );
        })}
    </tbody>
  </Table>
</div>

{/* Pagination Controls */}
{totalPages > 1 && !isLoading && items.length > 0 && (
  <div className="mt-3 d-flex gap-2 align-items-center justify-content-between">
    <Button
      variant="outline-secondary"
      onClick={handlePreviousPage}
      disabled={currentPage === 1 || isSaving}
    >
      ← Previous
    </Button>
    <span className="text-muted">
      Page {currentPage} of {totalPages} ({items.length} total items)
    </span>
    <Button
      variant="outline-secondary"
      onClick={handleNextPage}
      disabled={currentPage === totalPages || isSaving}
    >
      Next →
    </Button>
  </div>
)}

{/* Bulk Action Buttons */}
{editingIds.size > 0 && (
  <div className="mt-3 d-flex gap-2 align-items-center">
    <span className="text-muted">
      {editingIds.size} item{editingIds.size !== 1 ? 's' : ''} being edited
    </span>
    <Button
      variant="success"
      onClick={handleSaveAllChanges}
      disabled={isSaving}
    >
      {isSaving ? 'Saving...' : '✓ Update Changes'}
    </Button>
    <Button
      variant="outline-danger"
      onClick={handleDiscardAllChanges}
      disabled={isSaving}
    >
      ✕ Discard Changes
    </Button>
  </div>
)}

{/* 4. Error Alert */}
{error && <Alert variant="warning" className="mt-3 mb-0">{error}</Alert>}
    </div>
  );
}
