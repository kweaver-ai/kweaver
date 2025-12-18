package com.aishu.doc.common;

import java.util.concurrent.Callable;

public class TaskUtil {

    public enum RetryMode {
        CONSTANT,
        LINEAR,
        EXPONENTIAL
    }

    /**
     * 
     * @param <T>
     * @param task          Callable
     * @param interval      millis
     * @param maxRetryCount
     * @param mode          RetryMode
     * @return
     * @throws Exception
     */
    public static <T> T runWithRetry(Callable<T> task, int interval, int maxRetryCount, RetryMode mode)
            throws Exception {
        int retryCount = 0;
        Exception lastException = null;

        while (retryCount < maxRetryCount) {
            try {
                return task.call();
            } catch (Exception e) {
                lastException = e;
                retryCount++;

                if (retryCount >= maxRetryCount) {
                    break;
                }

                int delay = getDelay(interval, retryCount, mode);

                Thread.sleep(delay);
            }
        }

        if (lastException != null) {
            throw lastException;
        }

        return null;
    }

    private static int getDelay(int interval, int retryCount, RetryMode mode) {
        if (mode == RetryMode.LINEAR) {
            return interval * retryCount;
        }

        if (mode == RetryMode.EXPONENTIAL) {
            return interval * (int) Math.pow(2, retryCount - 1);
        }

        return interval;
    }

}
