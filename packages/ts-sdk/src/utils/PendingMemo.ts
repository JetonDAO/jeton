export class PendingMemo {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  memoizedMap = new Map<() => Promise<any>, Promise<any>>();

  memoize<T>(asyncFunction: () => Promise<T>) {
    if (this.memoizedMap.get(asyncFunction))
      return this.memoizedMap.get(asyncFunction) as Promise<T>;
    const promiseRes = asyncFunction().then((value) => {
      this.memoizedMap.delete(asyncFunction);
      return value;
    });
    this.memoizedMap.set(asyncFunction, promiseRes);
    return promiseRes;
  }
}

export const createPendingMemo = () => new PendingMemo();
