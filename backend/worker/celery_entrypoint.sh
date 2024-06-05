#!/bin/bash
# Enable associative array support
declare -A queue_workers
# Define the number of workers for each queue
queue_workers[test]=6
queue_workers[nibbler]=1
# Check if the CELERY_CONCURRENCY_LIMIT environment variable is set and not empty.
# This is used to limit the number of concurrent tasks that a Celery worker can execute,
# which can be useful to prevent resource exhaustion in certain scenarios, such as local development.
if [ ! -z "${CELERY_CONCURRENCY_LIMIT}" ]; then
    # If set, include the concurrency limit in the command
    CONCURRENCY_OPTION="-c ${CELERY_CONCURRENCY_LIMIT}"
else
    # If not set, leave the concurrency option empty so Celery uses its default behavior
    CONCURRENCY_OPTION=""
fi
for queue in "${!queue_workers[@]}"
do
    num_workers=${queue_workers[$queue]}
    for ((worker=1; worker<=num_workers; worker++))
    do
        celery -A worker.config worker -Q "$queue" -n "${queue}-worker${worker}-${HOSTNAME}" ${CONCURRENCY_OPTION} &
    done
done
wait
