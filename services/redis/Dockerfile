FROM redis

COPY redis.conf /etc/redis/redis.conf
RUN chown redis:redis /etc/redis/redis.conf
CMD ["redis-server", "/etc/redis/redis.conf"]
