import React, { useState } from "react";
import ReactFlow, { Background, Controls } from "reactflow";
import "reactflow/dist/style.css";

// Simple modal component
function Modal({ open, onClose, content }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.3)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", padding: 24, borderRadius: 8, minWidth: 300, maxWidth: 500, boxShadow: "0 2px 16px #0002" }}>
        <div style={{ marginBottom: 16 }}>{content}</div>
        <button onClick={onClose} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 4, padding: "6px 16px", cursor: "pointer" }}>Close</button>
      </div>
    </div>
  );
}

// Props: summary (string), keyPoints (array of strings)
export default function MindMap({ summary, keyPoints }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState("");

  // Improved balanced spacing for better visibility
  const nodeCount = (keyPoints?.length || 0) + 1;
  const nodeWidth = 180;
  const nodeHeight = 80;
  const hSpacing = 200; // horizontal spacing between nodes
  const vSpacing = 200; // vertical spacing between root and key points
  // Calculate total width, but cap at 1200px for scroll
  const totalWidth = Math.min(Math.max(600, nodeCount * hSpacing), 1200);
  const rootX = totalWidth / 2 - nodeWidth / 2;
  const nodes = [
    {
      id: "root",
      data: { label: summary || "Summary" },
      position: { x: rootX, y: 50 },
      draggable: true,
    },
    ...(keyPoints || []).map((point, i) => ({
      id: `kp-${i}`,
      data: { label: point },
      // Distribute horizontally with even spacing
      position: {
        x:
          keyPoints.length === 1
            ? rootX // center if only one key point
            : 40 + i * ((totalWidth - 80) / Math.max(1, keyPoints.length - 1)),
        y: 50 + vSpacing,
      },
      draggable: true,
    })),
  ];
  // Edges: root to each key point
  const edges = (keyPoints || []).map((_, i) => ({
    id: `e-root-kp-${i}`,
    source: "root",
    target: `kp-${i}`,
    animated: true,
  }));


  // Node double-click handler for modal
  const onNodeDoubleClick = (_event, node) => {
    setModalContent(node.data.label);
    setModalOpen(true);
  };

  return (
    <div style={{ width: "100%", height: 400, minWidth: 400, maxWidth: 1200, overflowX: "auto" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodesDraggable={true}
        onNodeDoubleClick={onNodeDoubleClick}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        fitView
        style={{ width: totalWidth, height: 400 }}
      >
        <Controls />
        <Background />
      </ReactFlow>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} content={modalContent} />
    </div>
  );
}
