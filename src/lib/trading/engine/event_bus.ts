import EventEmitter from 'events';

export const eventBus = new EventEmitter();

// Example events: 'order.placed', 'market.update'