"use client";

import { useEffect, useRef, useState } from "react";

interface MermaidGraphProps {
  chart: string;
  className?: string;
}

export function MermaidGraph({ chart, className = "" }: MermaidGraphProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const renderChart = async () => {
      if (!ref.current || !chart) return;

      try {
        setIsLoading(true);
        setError(null);

        // Dynamic import to avoid SSR issues
        const mermaid = (await import("mermaid")).default;

        // Initialize mermaid
        mermaid.initialize({
          startOnLoad: false,
          theme: "default",
          themeVariables: {
            primaryColor: "#3b82f6",
            primaryTextColor: "#1e40af",
            primaryBorderColor: "#2563eb",
            lineColor: "#6b7280",
            background: "#ffffff",
            mainBkg: "#ffffff",
          },
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
          },
          securityLevel: "loose",
        });

        // Clear previous content
        if (ref.current) {
          ref.current.innerHTML = "";
        }

        // Generate unique ID
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Render the chart
        const { svg } = await mermaid.render(id, chart);
        
        if (mounted && ref.current) {
          ref.current.innerHTML = svg;
          
          // Make SVG responsive
          const svgElement = ref.current.querySelector("svg");
          if (svgElement) {
            svgElement.style.width = "100%";
            svgElement.style.height = "auto";
            svgElement.style.maxWidth = "100%";
          }
        }

        if (mounted) {
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Mermaid rendering error:", err);
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to render chart");
          setIsLoading(false);
        }
      }
    };

    renderChart();

    return () => {
      mounted = false;
    };
  }, [chart]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 min-h-[400px] ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <span className="mt-2 block text-muted-foreground">Loading graph...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center p-8 text-center min-h-[400px] ${className}`}>
        <div className="text-destructive">
          <p className="font-medium">Failed to render graph</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={ref} 
      className={`mermaid-container w-full ${className}`}
      style={{ 
        minHeight: "400px",
      }}
    />
  );
} 