import { afterEach, describe, expect, it, vi } from "vitest";
import { retryAsyncLoad } from "./useFixtures";

const FIXTURES = { matches: [], teams: [] };

function deferred<T>() {
	const { promise, resolve, reject } = Promise.withResolvers<T>();
	return { promise, resolve, reject };
}
const flush = async () => {
	await Promise.resolve();
	await Promise.resolve();
};

describe("retryAsyncLoad", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("retries on transient failure until success", async () => {
		vi.useFakeTimers();
		const d1 = deferred<typeof FIXTURES>();
		const d2 = deferred<typeof FIXTURES>();
		const d3 = deferred<typeof FIXTURES>();
		const load = vi
			.fn<() => Promise<typeof FIXTURES>>()
			.mockReturnValueOnce(d1.promise)
			.mockReturnValueOnce(d2.promise)
			.mockReturnValueOnce(d3.promise);
		const onReady = vi.fn();
		const onError = vi.fn();

		const cancel = retryAsyncLoad(load, onReady, onError, 2, 100);

		expect(load).toHaveBeenCalledTimes(1);
		d1.reject(new TypeError("blip"));
		await flush();
		expect(onError).not.toHaveBeenCalled();
		expect(onReady).not.toHaveBeenCalled();

		vi.advanceTimersByTime(100);
		expect(load).toHaveBeenCalledTimes(2);
		d2.reject(new TypeError("blip"));
		await flush();

		vi.advanceTimersByTime(100);
		expect(load).toHaveBeenCalledTimes(3);
		d3.resolve(FIXTURES);
		await flush();

		expect(onReady).toHaveBeenCalledWith(FIXTURES);
		expect(onError).not.toHaveBeenCalled();

		cancel();
	});

	it("stops retrying after the cap", async () => {
		vi.useFakeTimers();
		const load = vi.fn(() => Promise.reject(new TypeError("down")));
		const onReady = vi.fn();
		const onError = vi.fn();

		const cancel = retryAsyncLoad(load, onReady, onError, 2, 100);
		await flush();

		for (let i = 0; i < 2; i++) {
			vi.advanceTimersByTime(100);
			await flush();
		}

		expect(load).toHaveBeenCalledTimes(3); // initial + 2 retries
		expect(onError).toHaveBeenCalledTimes(1);
		expect(onReady).not.toHaveBeenCalled();
		cancel();
	});

	it("cancel() stops pending retry timers", async () => {
		vi.useFakeTimers();
		const d1 = deferred<typeof FIXTURES>();
		const load = vi
			.fn<() => Promise<typeof FIXTURES>>()
			.mockReturnValueOnce(d1.promise);
		const onReady = vi.fn();
		const onError = vi.fn();

		const cancel = retryAsyncLoad(load, onReady, onError, 2, 100);
		d1.reject(new TypeError("blip"));
		await flush();

		cancel();
		vi.advanceTimersByTime(1000);

		expect(load).toHaveBeenCalledTimes(1);
		expect(onReady).not.toHaveBeenCalled();
		expect(onError).not.toHaveBeenCalled();
	});
});
