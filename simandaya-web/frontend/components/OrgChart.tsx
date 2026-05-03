"use client";

import React, { useCallback, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Handle,
  Position,
  NodeProps,
  Background,
  Controls,
  ConnectionLineType,
} from '@xyflow/react';
import dagre from 'dagre';

import '@xyflow/react/dist/style.css';

// Custom Node for the Org Chart
const OrgNode = ({ data }: NodeProps) => {
  return (
    <div className="min-w-[300px] rounded-lg border border-border bg-card px-6 py-5 text-center shadow-sm transition-colors hover:border-primary/40">
      <Handle type="target" position={Position.Top} className="h-3 w-3 bg-muted-foreground" />
      <div className="flex flex-col gap-2">
        {!data.assignable ? (
          <div className="h-7" />
        ) : data.names && (data.names as string[]).length > 0 ? (
          (data.names as string[]).map((name, idx) => (
            <div key={idx} className="text-base font-semibold leading-tight text-foreground md:text-lg">
              {name}
            </div>
          ))
        ) : (
          <div className="text-base font-semibold italic text-muted-foreground">Belum Diisi</div>
        )}
        <div className="mt-1 border-t border-border pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:text-sm">
          {data.role as string}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="h-3 w-3 bg-muted-foreground" />
    </div>
  );
};

const nodeTypes = {
  org: OrgNode,
};

const nodeWidth = 320;
const nodeHeight = 120;

const getLayoutedElements = (nodes: any[], edges: any[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction, ranksep: 90, nodesep: 70 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    
    // Safety check to prevent crash if node is not found in graph
    const position = nodeWithPosition 
      ? { x: nodeWithPosition.x - nodeWidth / 2, y: nodeWithPosition.y - nodeHeight / 2 }
      : { x: Math.random() * 400, y: Math.random() * 400 };

    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position,
    };
  });

  return { nodes: layoutedNodes, edges };
};

interface OrgChartProps {
  civitas: any[];
}

const HIERARCHY = [
  { role: "Komite Madrasah", id: "KM", parent: null },
  { role: "Kepala Madrasah", id: "KEP", parent: "KM" },
  { role: "Kepala Tata Usaha", id: "TU", parent: "KEP" },
  
  // Wakamad Level (Level 4) - Child of TU to push them down
  { role: "Wakamad Bid. Kurikulum", id: "KUR", parent: "TU" },
  { role: "Wakamad Bid. Kesiswaan", id: "KES", parent: "TU" },
  { role: "Wakamad Bid. Sarpras", id: "SAR", parent: "TU" },
  { role: "Wakamad Bid. Humas", id: "HUM", parent: "TU" },

  // Sub-units (Level 5)
  { role: "Tim IT", id: "IT", parent: "KUR" },
  { role: "Pengembang Madrasah", id: "PM", parent: "KUR" },
  { role: "Kepala Laboratorium Terpadu", id: "KLT", parent: "KUR" },
  { role: "Wali Kelas", id: "WK", parent: "KUR" },

  { role: "Bimbingan Konseling", id: "BK", parent: "KES" },
  { role: "Tim Pendidikan Karakter", id: "TPK", parent: "KES" },
  { role: "Pembina Ekstrakurikuler", id: "PE", parent: "KES" },

  { role: "Laboratorium Komputer", id: "LABK", parent: "SAR" },
  { role: "Tim Adiwiyata", id: "ADI", parent: "SAR" },

  { role: "Publikasi dan Informasi", id: "PUB", parent: "HUM" },
  { role: "Multimedia dan Studio", id: "MMS", parent: "HUM" },

  // Specific Level 6 Nodes
  { role: "Satuan Pendidikan Ramah Anak", id: "SPRA", parent: "BK" },
  { role: "Satgas Anti Narkoba", id: "SAN", parent: "TPK" },
  { role: "OSIS", id: "OSIS", parent: "TPK" },
  { role: "MPK", id: "MPK", parent: "TPK" },
  { role: "PIKR", id: "PIKR", parent: "TPK" },
  
  { role: "KIR", id: "KIR", parent: "PE" },
  { role: "Robotik", id: "ROBO", parent: "PE" },
  { role: "Koord. OSN/KSN", id: "OSN", parent: "PE" },
  { role: "PMR dan UKS", id: "PMR", parent: "PE" },
  { role: "Olahraga", id: "OLAH", parent: "PE" },
  { role: "Seni", id: "SENI", parent: "PE" },
  { role: "Pecinta Alam", id: "PA", parent: "PE" },
  { role: "Corps Mubaligh", id: "CM", parent: "PE" },
  { role: "Pramuka", id: "PRAM", parent: "PE" },
];

const COORDINATION_LINES = [
  { source: "WK", target: "BK" },
  { source: "BK", target: "TPK" },
];

const NON_ASSIGNABLE_ROLES = new Set<string>([
  "Tim IT",
  "Pengembang Madrasah",
  "Kepala Laboratorium Terpadu",
  "Wali Kelas",
  "Bimbingan Konseling",
  "Satuan Pendidikan Ramah Anak",
  "Tim Pendidikan Karakter",
  "Tim Penjaminan Karakter",
  "Pembina Ekstrakurikuler",
  "Laboratorium Komputer",
  "Publikasi dan Informasi",
  "Multimedia dan Studio",
  "Tim Adiwiyata",
  "Satgas Anti Narkoba",
  "OSIS",
  "MPK",
  "PIKR",
  "KIR",
  "Robotik",
  "Koord. OSN/KSN",
  "Koord. OSN/KSM",
  "PMR dan UKS",
  "Olahraga",
  "Seni",
  "Pecinta Alam",
  "Corps Mubaligh",
  "Pramuka",
]);

export const OrgChart: React.FC<OrgChartProps> = ({ civitas }) => {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const roleGroups: Record<string, string[]> = {};
    civitas.forEach((p) => {
      if (!roleGroups[p.jabatan_struktural]) {
        roleGroups[p.jabatan_struktural] = [];
      }
      roleGroups[p.jabatan_struktural].push(p.nama);
    });

    const nodes = HIERARCHY.map((h) => ({
      id: h.id,
      type: 'org',
      data: { 
        role: h.role, 
        names: roleGroups[h.role] || [],
        assignable: !NON_ASSIGNABLE_ROLES.has(h.role),
      },
      position: { x: 0, y: 0 },
    }));

    const hierarchyEdges = HIERARCHY.filter(h => h.parent).map(h => ({
      id: `e-${h.parent}-${h.id}`,
      source: h.parent!,
      target: h.id,
      type: 'smoothstep',
      animated: false,
      style: { stroke: '#8da0ba', strokeWidth: 2 },
    }));

    const coordinationEdges = COORDINATION_LINES.map(c => ({
      id: `c-${c.source}-${c.target}`,
      source: c.source,
      target: c.target,
      type: 'smoothstep',
      animated: false,
      label: 'koordinasi',
      labelStyle: { fontSize: '10px', fill: '#94a3b8', fontWeight: 600 },
      style: { stroke: '#b9c6d8', strokeWidth: 2, strokeDasharray: '6,5' },
    }));

    return getLayoutedElements(nodes, [...hierarchyEdges, ...coordinationEdges]);
  }, [civitas]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync internal state when initialNodes/initialEdges change (e.g. after fetch)
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-50/70" style={{ minHeight: '800px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={1.5}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        defaultEdgeOptions={{
          style: { stroke: '#8da0ba', strokeWidth: 2 },
          type: 'smoothstep',
        }}
      >
        <Background color="#cfd7e3" gap={20} />
        <Controls />
      </ReactFlow>
    </div>
  );
};
