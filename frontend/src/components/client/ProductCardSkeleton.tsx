const ProductCardSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm flex flex-col animate-pulse border border-gray-100">
      {/* Image Container */}
      <div className="relative aspect-[4/3] bg-gray-200"></div>

      {/* Content */}
      <div className="p-3 flex flex-col flex-grow">
        {/* Title skeleton */}
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>

        {/* Footer: Price + Add Button */}
        <div className="mt-auto flex items-end justify-between">
          <div className="h-6 bg-gray-200 rounded w-1/3" />

          <div className="w-9 h-9 bg-gray-200 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;
