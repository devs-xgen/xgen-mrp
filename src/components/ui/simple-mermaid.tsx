"use client";

import { useEffect, useRef } from "react";

interface SimpleMermaidProps {
  chart: string;
}

export function SimpleMermaid({ chart }: SimpleMermaidProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderChart = async () => {
      if (!ref.current || !chart) {
        console.log("No ref or chart:", { hasRef: !!ref.current, hasChart: !!chart });
        return;
      }

      console.log("Starting to render chart:", chart.substring(0, 50) + "...");

      try {
        // Dynamic import
        const mermaid = (await import("mermaid")).default;
        console.log("Mermaid imported successfully");

        // Simple initialization
        mermaid.initialize({
          startOnLoad: false,
          theme: "default",
          securityLevel: "loose",
        });
        console.log("Mermaid initialized");

        // Clear and render
        ref.current.innerHTML = "";
        const chartId = `chart-${Date.now()}`;
        console.log("Rendering chart with ID:", chartId);
        
        const { svg } = await mermaid.render(chartId, chart);
        console.log("Chart rendered, inserting SVG");
        
        ref.current.innerHTML = svg;
        
        // Make SVG responsive and scrollable
        const svgElement = ref.current.querySelector("svg");
        if (svgElement) {
          svgElement.style.width = "100%";
          svgElement.style.height = "auto";
          svgElement.style.minWidth = "800px"; // Ensure minimum width for readability
          svgElement.style.maxWidth = "none"; // Allow expansion
        }
        
        console.log("Mermaid chart rendered successfully");
      } catch (error) {
        console.error("Mermaid error:", error);
        if (ref.current) {
          ref.current.innerHTML = `<div class="p-4 text-red-500">Error: ${error}</div>`;
        }
      }
    };

    renderChart();
  }, [chart]);

  return (
    <div 
      ref={ref} 
      className="w-full overflow-auto"
      style={{ 
        minHeight: "400px",
        maxHeight: "600px",
        backgroundColor: "#f9f9f9",
        borderRadius: "8px",
        padding: "16px",
        border: "1px solid #e5e7eb"
      }}
    />
  );
} 