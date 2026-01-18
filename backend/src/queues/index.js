const Queue = require('bull');
const redis = require('redis');

const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
};

// Create queues
const webhookQueue = new Queue('webhooks', {
    redis: redisConfig,
    defaultJobOptions: {
        attempts: 5,
        backoff: {
            type: 'exponential',
            delay: 2000
        },
        removeOnComplete: true
    }
});

const paymentQueue = new Queue('payments', {
    redis: redisConfig,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000
        },
        removeOnComplete: true
    }
});

const refundQueue = new Queue('refunds', {
    redis: redisConfig,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000
        },
        removeOnComplete: true
    }
});

// Queue event listeners
webhookQueue.on('error', (err) => {
    console.error('Webhook queue error:', err);
});

paymentQueue.on('error', (err) => {
    console.error('Payment queue error:', err);
});

refundQueue.on('error', (err) => {
    console.error('Refund queue error:', err);
});

module.exports = {
    webhookQueue,
    paymentQueue,
    refundQueue,
    redisConfig
};
