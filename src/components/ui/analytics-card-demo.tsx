"use client"

import { AnalyticsCard, analyticsCardVariants } from "./analytics-card"

export function AnalyticsCardDemo() {
  return (
    <div className="space-y-8 p-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">AnalyticsCard Component Demo</h2>
        <p className="text-muted-foreground mb-6">
          Clean, minimal analytics cards with low opacity backgrounds and subtle borders.
        </p>
      </div>

      {/* Color Variants Grid */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Color Variants</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnalyticsCard
            title="Blue Variant"
            value="1,234"
            icon="ShoppingCart"
            subtitle="Primary metrics"
            {...analyticsCardVariants.blue}
          />
          <AnalyticsCard
            title="Green Variant"
            value="98%"
            icon="CheckCircle"
            subtitle="Success metrics"
            {...analyticsCardVariants.green}
          />
          <AnalyticsCard
            title="Amber Variant"
            value="₱125,000"
            icon="Package"
            subtitle="Revenue metrics"
            {...analyticsCardVariants.amber}
          />
          <AnalyticsCard
            title="Red Variant"
            value="24"
            icon="AlertTriangle"
            subtitle="Critical alerts"
            {...analyticsCardVariants.red}
          />
          <AnalyticsCard
            title="Purple Variant"
            value="567"
            icon="Users"
            subtitle="Special metrics"
            {...analyticsCardVariants.purple}
          />
          <AnalyticsCard
            title="Slate Variant"
            value="89.5%"
            icon="TrendingUp"
            subtitle="General information"
            {...analyticsCardVariants.slate}
          />
        </div>
      </div>

      {/* Responsive Examples */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Responsive Layout</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <AnalyticsCard
            title="Mobile First"
            value="456"
            icon="ShoppingCart"
            {...analyticsCardVariants.blue}
          />
          <AnalyticsCard
            title="Scales Up"
            value="78%"
            icon="CheckCircle"
            {...analyticsCardVariants.green}
          />
          <AnalyticsCard
            title="To Desktop"
            value="₱98,765"
            icon="Package"
            {...analyticsCardVariants.amber}
          />
          <AnalyticsCard
            title="Beautifully"
            value="12"
            icon="AlertTriangle"
            {...analyticsCardVariants.red}
          />
        </div>
      </div>

      {/* Interactive Example */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Interactive (Clickable)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          <AnalyticsCard
            title="Clickable Card"
            value="Click Me!"
            icon="TrendingUp"
            subtitle="Hover for effects"
            {...analyticsCardVariants.purple}
            onClick={() => alert("Analytics card clicked!")}
          />
          <AnalyticsCard
            title="With Subtitle"
            value="2,468"
            icon="Users"
            subtitle="Additional context info"
            {...analyticsCardVariants.slate}
            onClick={() => alert("Another click!")}
          />
        </div>
      </div>

      {/* Custom Styling Example */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Custom Styling</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          <AnalyticsCard
            title="Custom Colors"
            value="Custom"
            icon="Package"
            iconColor="text-pink-500"
            bgColor="bg-pink-50/80 dark:bg-pink-950/20"
            borderColor="border-pink-200/60 dark:border-pink-800/40"
            subtitle="Pink theme variant"
          />
          <AnalyticsCard
            title="No Icon"
            value="9,876"
            subtitle="Clean number display"
            {...analyticsCardVariants.blue}
          />
        </div>
      </div>
    </div>
  )
} 