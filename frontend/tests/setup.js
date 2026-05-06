import '@testing-library/jest-dom';
import { vi, afterEach } from 'vitest';

// jsdom does not ship fetch — mock it globally
globalThis.fetch = vi.fn();

afterEach(() => {
  vi.clearAllMocks();
});
