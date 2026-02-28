import React from 'react';
import { ListGroup, Button } from 'react-bootstrap';

const sample = [
  { title: 'Chicken Curry', pct: 90 },
  { title: 'Tomato Soup', pct: 100 },
  { title: 'Garlic Bread', pct: 80 },
];

export default function Recipes() {
  const handleGenerate = () => {
    alert('Generating new AI recipe...');
  };

  return (
    <div style={{ paddingTop: 80 }}>
      <h3>Matchmaker Results</h3>
      <ListGroup className="mt-3">
        {sample.map((r, i) => (
          <ListGroup.Item key={i} className="d-flex justify-content-between align-items-center">
            <div>{r.title}</div>
            <div>{r.pct}% Match</div>
          </ListGroup.Item>
        ))}
      </ListGroup>

      <div className="mt-3">
        <Button variant="secondary" onClick={handleGenerate}>Generate New AI Recipe with current items</Button>
      </div>
    </div>
  );
}
