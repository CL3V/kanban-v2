import React from "react";

interface SkeletonProps {
  className?: string;
  height?: string;
  width?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  height = "auto",
  width = "100%",
}) => {
  const style: React.CSSProperties = {
    height,
    width,
  };

  return (
    <div
      className={`animate-shimmer bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] rounded-md ${className}`}
      style={style}
    />
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({
  className = "",
}) => (
  <div
    className={`h-40 bg-white border border-gray-100 rounded-2xl animate-shimmer bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] ${className}`}
  />
);

export const SkeletonProfile: React.FC<{ className?: string }> = ({
  className = "",
}) => (
  <div
    className={`h-20 p-4 border-2 border-gray-200 rounded-xl bg-white animate-shimmer bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] ${className}`}
  />
);

export const SkeletonStats: React.FC<{ className?: string }> = ({
  className = "",
}) => (
  <div
    className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}
  >
    {Array.from({ length: 4 }).map((_, i) => (
      <div
        key={i}
        className="h-24 bg-gray-50 rounded-2xl animate-shimmer bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]"
      />
    ))}
  </div>
);

export const SkeletonHeader: React.FC<{ className?: string }> = ({
  className = "",
}) => (
  <div
    className={`h-8 rounded-md animate-shimmer bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] ${className}`}
  />
);

export const SkeletonButton: React.FC<{ className?: string }> = ({
  className = "",
}) => (
  <div
    className={`h-10 w-20 rounded-md animate-shimmer bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] ${className}`}
  />
);

export const SkeletonColumn: React.FC<{ className?: string }> = ({
  className = "",
}) => (
  <div className={`w-80 bg-gray-50 rounded-2xl p-6 ${className}`}>
    <div className="h-6 mb-6 rounded animate-shimmer bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]" />
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-28 rounded-xl animate-shimmer bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]"
        />
      ))}
    </div>
  </div>
);

export const SkeletonBoard: React.FC<{ className?: string }> = ({
  className = "",
}) => (
  <div className={`flex gap-8 overflow-x-auto p-8 ${className}`}>
    {Array.from({ length: 4 }).map((_, i) => (
      <SkeletonColumn key={i} />
    ))}
  </div>
);
