import React, { useState } from 'react';
import { Button, Form } from 'react-bootstrap';

export default function AddFood() {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Submitted list: ' + text);
    setText('');
  };

  return (
    <div style={{ paddingTop: 80 }}>
      <h3>Add Food (Bazar)</h3>
      <Form onSubmit={handleSubmit}>
        <Form.Group>
          <Form.Label>Paste your grocery list</Form.Label>
          <Form.Control as="textarea" rows={6} value={text} onChange={(e) => setText(e.target.value)} />
        </Form.Group>
        <div className="mt-3">
          <Button type="submit">Process</Button>
        </div>
      </Form>
    </div>
  );
}
