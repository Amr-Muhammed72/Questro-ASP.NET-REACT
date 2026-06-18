using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using Questro.Service.Abstractions.Cache;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace Questro.Service.Services.Cache
{
    public class CacheService : ICacheService
    {
        private readonly IDistributedCache _cache;
        private readonly ILogger<CacheService> _logger;

        public CacheService(IDistributedCache cache, ILogger<CacheService> logger)
        {
            _cache = cache;
            _logger = logger;
        }

        public async Task<T?> GetAsync<T>(string key)
        {
            try
            {
                var bytes = await _cache.GetAsync(key);
                if (bytes == null)
                {
                    _logger.LogDebug("Cache MISS: {Key}", key);
                    return default;
                }

                _logger.LogDebug("Cache HIT: {Key}", key);
                var json = Encoding.UTF8.GetString(bytes);
                return JsonSerializer.Deserialize<T>(json);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Cache GET failed: {Key} - {Error}", key, ex.Message);
                return default;
            }
        }

        public async Task SetAsync<T>(string key, T value, TimeSpan? ttl = null)
        {
            try
            {
                var json = JsonSerializer.Serialize(value);
                var bytes = Encoding.UTF8.GetBytes(json);

                var options = new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = ttl ?? TimeSpan.FromHours(24)
                };

                await _cache.SetAsync(key, bytes, options);
                _logger.LogDebug("Cache SET: {Key} TTL:{TTL}", key, ttl);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Cache SET failed: {Key} - {Error}", key, ex.Message);
            }
        }

        public async Task RemoveAsync(string key)
        {
            try
            {
                await _cache.RemoveAsync(key);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Cache REMOVE failed: {Key} - {Error}", key, ex.Message);
            }
        }
    }
}
