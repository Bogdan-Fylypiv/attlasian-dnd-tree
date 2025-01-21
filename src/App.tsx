// src/App.tsx
import React from 'react';
import { TreeContext } from '../pragmatic-drag-and-drop/documentation/examples/pieces/tree/tree-context';
import TreeItem from '../pragmatic-drag-and-drop/documentation/examples/pieces/tree/tree-item';

const App: React.FC = () => {
  return (
    <TreeContext>
      <h1>Drag-and-Drop Tree</h1>
      <div>
        {/* Render your tree items here */}
        <TreeItem label="Item 1" />
        <TreeItem label="Item 2">
          <TreeItem label="Item 2.1" />
        </TreeItem>
        <TreeItem label="Item 3" />
      </div>
    </TreeContext>
  );
};

export default App;