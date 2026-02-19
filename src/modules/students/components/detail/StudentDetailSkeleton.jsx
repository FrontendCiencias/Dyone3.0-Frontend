import React from "react";

export default function StudentDetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-28 animate-pulse rounded-xl bg-gray-100" />
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <div className="h-40 animate-pulse rounded-xl bg-gray-100" />
          <div className="h-40 animate-pulse rounded-xl bg-gray-100" />
          <div className="h-40 animate-pulse rounded-xl bg-gray-100" />
        </div>
        <div className="space-y-4 lg:col-span-4">
          <div className="h-36 animate-pulse rounded-xl bg-gray-100" />
          <div className="h-36 animate-pulse rounded-xl bg-gray-100" />
        </div>
      </div>
    </div>
  );
}
