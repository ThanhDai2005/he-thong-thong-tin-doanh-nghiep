import NodeCache from "node-cache";
import logger from "../config/logger.js";

// Khởi tạo cache instance
const searchCache = new NodeCache({
  stdTTL: 600, // 10 phút
  checkperiod: 120, // Kiểm tra expired keys mỗi 2 phút
  useClones: false, // Tăng hiệu suất
  deleteOnExpire: true, // Tự động xóa key khi hết hạn
});

export const getCachedSearch = (cacheKey) => {
  try {
    const cachedData = searchCache.get(cacheKey);
    if (cachedData) {
      logger.info(`[CACHE HIT] ${cacheKey}`);
      return cachedData;
    }
    logger.info(`[CACHE MISS] ${cacheKey}`);
    return null;
  } catch (error) {
    logger.error("Lỗi khi lấy cache", error);
    return null;
  }
};

export const setCachedSearch = (cacheKey, data, ttl = 600) => {
  try {
    searchCache.set(cacheKey, data, ttl);
    logger.info(`[CACHE SET] ${cacheKey} (TTL: ${ttl}s)`);
  } catch (error) {
    logger.error("Lỗi khi lưu cache", error);
  }
};

export const invalidateSearchCache = () => {
  try {
    const keysCount = searchCache.keys().length;
    searchCache.flushAll();
    logger.info(`[CACHE INVALIDATE] Đã xóa ${keysCount} cache keys`);
  } catch (error) {
    logger.error("Lỗi khi invalidate cache", error);
  }
};

export const invalidateCacheByPattern = (pattern) => {
  try {
    const keys = searchCache.keys();
    const matchedKeys = keys.filter((key) => key.startsWith(pattern));
    matchedKeys.forEach((key) => searchCache.del(key));
    logger.info(
      `[CACHE INVALIDATE PATTERN] Đã xóa ${matchedKeys.length} keys với pattern "${pattern}"`,
    );
  } catch (error) {
    logger.error("Lỗi khi invalidate cache by pattern", error);
  }
};

export const getCacheStats = () => {
  return {
    keys: searchCache.keys().length,
    stats: searchCache.getStats(),
  };
};

export default searchCache;
