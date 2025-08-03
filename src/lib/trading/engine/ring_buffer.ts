export class RingBuffer<T> {
  private buffer: Array<T | null>;
  private size: number;
  private writePos = 0;

  constructor(size: number) {
    this.size = size;
    this.buffer = Array(size).fill(null);
  }

  push(item: T) {
    this.buffer[this.writePos] = item;
    this.writePos = (this.writePos + 1) % this.size;
  }

  getAll(): T[] {
    return this.buffer.filter((v): v is T => v !== null);
  }
}