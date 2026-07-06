import { useState, useEffect } from 'react';
import './ComparisonTablePane.css';

function ComparisonTablePane({ socket }) {
  const [rows, setRows] = useState([
    { id: 1, name: 'Product A', score: 85, status: 'Approved' },
    { id: 2, name: 'Product B', score: 72, status: 'Pending' },
    { id: 3, name: 'Product C', score: 91, status: 'Approved' }
  ]);
  const [newRow, setNewRow] = useState({ name: '', score: '', status: 'Pending' });

  useEffect(() => {
    function onTableUpdate(data) {
      setRows(prev => 
        prev.map(row => row.id === data.id ? { ...row, ...data.updates } : row)
      );
    }

    function onTableAddRow(data) {
      setRows(prev => [...prev, data]);
    }

    function onTableRemoveRow(data) {
      setRows(prev => prev.filter(row => row.id !== data.id));
    }

    socket.on('table:update', onTableUpdate);
    socket.on('table:add-row', onTableAddRow);
    socket.on('table:remove-row', onTableRemoveRow);

    return () => {
      socket.off('table:update', onTableUpdate);
      socket.off('table:add-row', onTableAddRow);
      socket.off('table:remove-row', onTableRemoveRow);
    };
  }, [socket]);

  const handleCellChange = (id, field, value) => {
    // Update locally first for immediate feedback
    setRows(prev =>
      prev.map(row => row.id === id ? { ...row, [field]: value } : row)
    );
    // Emit to server
    socket.emit('table:update', {
      id,
      updates: { [field]: value }
    });
  };

  const handleAddRow = (e) => {
    e.preventDefault();
    if (newRow.name && newRow.score) {
      const row = {
        id: Date.now(),
        name: newRow.name,
        score: parseInt(newRow.score, 10),
        status: newRow.status
      };
      setRows(prev => [...prev, row]);
      socket.emit('table:add-row', row);
      setNewRow({ name: '', score: '', status: 'Pending' });
    }
  };

  const handleRemoveRow = (id) => {
    setRows(prev => prev.filter(row => row.id !== id));
    socket.emit('table:remove-row', { id });
  };

  return (
    <div className="comparison-table-pane">
      <div className="pane-header">
        <h2>Comparison Table</h2>
        <span className="row-count">{rows.length} items</span>
      </div>
      <div className="table-container">
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Score</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <input
                    type="text"
                    value={row.name}
                    onChange={(e) => handleCellChange(row.id, 'name', e.target.value)}
                    className="table-input"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={row.score}
                    onChange={(e) => handleCellChange(row.id, 'score', parseInt(e.target.value, 10))}
                    className="table-input"
                  />
                </td>
                <td>
                  <select
                    value={row.status}
                    onChange={(e) => handleCellChange(row.id, 'status', e.target.value)}
                    className="table-select"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </td>
                <td>
                  <button
                    onClick={() => handleRemoveRow(row.id)}
                    className="remove-button"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form className="add-row-form" onSubmit={handleAddRow}>
        <input
          type="text"
          placeholder="Name"
          value={newRow.name}
          onChange={(e) => setNewRow({ ...newRow, name: e.target.value })}
          className="form-input"
          required
        />
        <input
          type="number"
          placeholder="Score"
          value={newRow.score}
          onChange={(e) => setNewRow({ ...newRow, score: e.target.value })}
          className="form-input"
          required
        />
        <select
          value={newRow.status}
          onChange={(e) => setNewRow({ ...newRow, status: e.target.value })}
          className="form-select"
        >
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
        <button type="submit" className="add-button">
          Add Row
        </button>
      </form>
    </div>
  );
}

export default ComparisonTablePane;
