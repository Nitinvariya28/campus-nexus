# Gunicorn configuration optimized for 512 MB Cloud RAM
# 1 master worker with 4 threads ensures low memory footprint (~200 MB)
# while allowing 4 concurrent requests to prevent request queueing bottlenecks

workers = 1
threads = 4
worker_class = "gthread"

# Timeout settings
timeout = 120
keepalive = 5

# Memory protection: recycle worker every 500 requests to avoid fragmentation
max_requests = 500
max_requests_jitter = 50

loglevel = "info"
accesslog = "-"
errorlog = "-"
