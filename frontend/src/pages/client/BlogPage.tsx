import { useState, useEffect } from "react";
import { Link } from "react-router";
import { useBlogStore } from "@/stores/useBlogStore";
import { useBlogCategoryStore } from "@/stores/useBlogCategoryStore";

const BlogPage = () => {
  const [selectedCategorySlug, setSelectedCategorySlug] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [displayedBlogs, setDisplayedBlogs] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const { loading, getList } = useBlogStore();
  const { blogCategory, fetchBlogCategories } = useBlogCategoryStore();

  const BLOGS_PER_LOAD = 7;

  useEffect(() => {
    fetchBlogCategories();
  }, [fetchBlogCategories]);

  useEffect(() => {
    const fetchInitialBlogs = async () => {
      setCurrentPage(1);
      setHasMore(true);

      const data = await getList("", selectedCategorySlug, 1, BLOGS_PER_LOAD);

      if (data && data.length > 0) {
        setDisplayedBlogs(data);
        setHasMore(data.length === BLOGS_PER_LOAD);
      } else {
        setDisplayedBlogs([]);
        setHasMore(false);
      }
    };

    fetchInitialBlogs();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [selectedCategorySlug, getList]);

  // Xử lý khi bấm nút XEM THÊM
  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const nextPage = currentPage + 1;

      // Lấy data trang tiếp theo
      const data = await getList(
        "",
        selectedCategorySlug,
        nextPage,
        BLOGS_PER_LOAD,
      );

      if (data && data.length > 0) {
        // NỐI MẢNG: Giữ bài cũ (...prev), thêm bài mới (...data)
        setDisplayedBlogs((prev) => [...prev, ...data]);
        setCurrentPage(nextPage);
        setHasMore(data.length === BLOGS_PER_LOAD);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error loading more blogs:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const featuredPost = displayedBlogs.find((post) => post.featured);
  const regularPosts = featuredPost
    ? displayedBlogs.filter((post) => post._id !== featuredPost._id)
    : displayedBlogs;

  return (
    <>
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-gradient-to-b from-red-50 to-white pt-20 pb-12 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 md:px-6 text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-4 tracking-tight leading-tight">
              Khám Phá <span className="text-[#b51c00]">Món Ngon</span>
            </h1>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Từ những góc quán nhỏ đến nhà hàng sang trọng, hãy để chúng tôi
              dẫn bạn đi tìm hương vị đích thực.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 mt-8">
          {/* Category Filter */}
          <div className="flex gap-3 mb-8 overflow-x-auto pb-4 snap-x scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden justify-start md:justify-center">
            <button
              onClick={() => setSelectedCategorySlug("")}
              className={`flex-none snap-start px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 active:scale-95 ${
                selectedCategorySlug === ""
                  ? "bg-[#b51c00] text-white shadow-md shadow-red-900/20"
                  : "bg-white text-gray-700 hover:bg-gray-100 hover:text-[#b51c00] border border-gray-200"
              }`}
            >
              Tất Cả Bài Viết
            </button>
            {blogCategory.map((category) => (
              <button
                key={category._id}
                onClick={() => setSelectedCategorySlug(category.slug)}
                className={`flex-none snap-start px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 active:scale-95 ${
                  selectedCategorySlug === category.slug
                    ? "bg-[#b51c00] text-white shadow-md shadow-red-900/20"
                    : "bg-white text-gray-700 hover:bg-gray-100 hover:text-[#b51c00] border border-gray-200"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Loading State - Chỉ hiện khi ở trang 1 */}
          {loading && currentPage === 1 && (
            <div className="space-y-10">
              {selectedCategorySlug === "" && (
                <div className="animate-pulse">
                  <div className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-lg">
                    <div className="w-full h-full bg-gray-200" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                      <div className="inline-block px-3 py-1.5 bg-gray-300 rounded-full w-28 h-6 mb-4" />
                      <div className="h-9 md:h-12 bg-gray-300 rounded-lg w-4/5 mb-4" />
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-gray-300 rounded-full" />
                        <div className="h-4 bg-gray-300 rounded w-40" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, idx) => (
                  <div
                    key={idx}
                    className="animate-pulse flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100"
                  >
                    <div className="aspect-[4/3] bg-gray-200" />
                    <div className="flex-1 p-5 space-y-3">
                      <div className="h-6 bg-gray-200 rounded w-11/12" />
                      <div className="h-4 bg-gray-200 rounded w-full" />
                      <div className="h-4 bg-gray-200 rounded w-4/5" />
                      <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gray-200 rounded-full" />
                          <div className="h-4 bg-gray-200 rounded w-28" />
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-20" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* List Bài Viết */}
          {(!loading || currentPage > 1) && displayedBlogs.length > 0 && (
            <div className="space-y-10">
              {featuredPost && selectedCategorySlug === "" && (
                <Link to={`/blog/${featuredPost.slug}`} className="block group">
                  <div className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-lg border border-gray-200">
                    <img
                      src={featuredPost.imageUrl || "/placeholder.png"}
                      alt={featuredPost.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white">
                      <span className="inline-block px-3 py-1.5 bg-[#b51c00] rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                        {featuredPost.blogCategoryId?.name || "Nổi Bật"}
                      </span>
                      <h2 className="text-2xl md:text-4xl font-extrabold mb-3 group-hover:text-red-200 transition-colors leading-tight">
                        {featuredPost.title}
                      </h2>
                      <div className="flex items-center gap-3 text-xs md:text-sm text-gray-300 font-medium">
                        <span className="material-symbols-outlined text-[16px]">
                          person
                        </span>
                        <span>
                          {featuredPost.authorId?.displayName || "Ban Biên Tập"}
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(
                            featuredPost.publishedAt,
                          ).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              {regularPosts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {regularPosts.map((post) => (
                    <Link
                      key={post._id}
                      to={`/blog/${post.slug}`}
                      className="group flex flex-col h-full bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-[#b51c00]/30"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                        <img
                          src={post.imageUrl || "/placeholder.png"}
                          alt={post.title}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute top-3 left-3 px-3 py-1 bg-white/95 backdrop-blur-sm rounded-full text-xs font-bold text-[#b51c00] shadow-sm">
                          {post.blogCategoryId?.name || "Bài Viết"}
                        </div>
                      </div>

                      <div className="flex flex-col flex-grow p-5">
                        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-[#b51c00] transition-colors line-clamp-2 leading-snug">
                          {post.title}
                        </h3>

                        <div className="mt-auto flex items-center justify-between text-xs text-gray-500 font-medium pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center text-[#b51c00]">
                              <span className="material-symbols-outlined text-[12px]">
                                person
                              </span>
                            </div>
                            <span className="truncate max-w-[120px]">
                              {post.authorId?.displayName}
                            </span>
                          </div>
                          <span className="text-gray-400">
                            {new Date(post.publishedAt).toLocaleDateString(
                              "vi-VN",
                            )}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Nút Xem Thêm */}
              {hasMore && (
                <div className="flex justify-center pt-6">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="px-8 py-3.5 bg-white border-2 border-gray-300 rounded-xl font-bold text-gray-700 hover:border-[#b51c00] hover:text-[#b51c00] hover:bg-red-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm active:scale-95"
                  >
                    {loadingMore ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-xl">
                          progress_activity
                        </span>
                        Đang tải...
                      </>
                    ) : (
                      <>
                        Xem thêm bài viết
                        <span className="material-symbols-outlined text-xl">
                          expand_more
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Dòng chữ báo hết bài */}
              {!hasMore && displayedBlogs.length > BLOGS_PER_LOAD && (
                <div className="text-center pt-6 border-t border-gray-200 mt-8">
                  <p className="text-sm text-gray-400 font-medium italic">
                    Đã hiển thị toàn bộ bài viết
                  </p>
                </div>
              )}
            </div>
          )}

          {!loading && displayedBlogs.length === 0 && (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <span className="material-symbols-outlined text-4xl text-gray-400">
                  article
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Chưa có bài viết nào
              </h3>
              <p className="text-gray-500 text-sm">
                Các chuyên gia ẩm thực đang chuẩn bị nội dung hấp dẫn cho danh
                mục này.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BlogPage;
