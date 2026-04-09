import { Queue } from "bullmq";
import { QUEUES } from "./queueNames.js";
import { redisConnection } from "./connection.js";

let _queue;

export function discrepancyQueue() {
  if (!_queue) _queue = new Queue(QUEUES.discrepancy, redisConnection());
  return _queue;
}

