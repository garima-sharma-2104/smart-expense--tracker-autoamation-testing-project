package utils;

import org.testng.ITestListener;
import org.testng.ITestResult;

/** Prints a one-line outcome per test to the console in addition to the TestNG reports. */
public class TestListener implements ITestListener {
    @Override
    public void onTestStart(ITestResult result) {
        System.out.println("[START ] " + name(result));
    }

    @Override
    public void onTestSuccess(ITestResult result) {
        System.out.println("[PASS  ] " + name(result));
    }

    @Override
    public void onTestFailure(ITestResult result) {
        System.out.println("[FAIL  ] " + name(result) + " -> " + result.getThrowable());
    }

    @Override
    public void onTestSkipped(ITestResult result) {
        System.out.println("[SKIP  ] " + name(result));
    }

    private static String name(ITestResult r) {
        return r.getTestClass().getRealClass().getSimpleName() + "." + r.getMethod().getMethodName();
    }
}
