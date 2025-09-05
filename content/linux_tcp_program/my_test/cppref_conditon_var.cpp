#include <condition_variable>
#include <iostream>
#include <mutex>
#include <string>
#include <thread>
 
std::mutex m;
std::condition_variable cv;
std::string data;
bool ready = false;
bool processed = false;
 
void worker_thread()
{
    // wait until main() sends data
    std::unique_lock lk(m);
    // cv.wait(lk, []{ return ready; });

    while( !ready) {
        // <---- 在这里执行 cv.notify_one() ,wait会被唤醒吗?
        // cv.notify_one(); 一定不会在这里执行,如果正确的使用锁
        cv.wait(lk);
    }

    // after the wait, we own the lock
    std::cout << "Worker thread is processing data\n";
    data += " after processing";
 
    // send data back to main()
    processed = true;
    std::cout << "Worker thread signals data processing completed\n";
 
    // manual unlocking is done before notifying, to avoid waking up
    // the waiting thread only to block again (see notify_one for details)
    // lk.unlock();
    // cv.notify_one();
}
 
int main()
{
    std::thread worker(worker_thread);
 
    data = "Example data";
    // send data to the worker thread
    {
        std::lock_guard lk(m); 
        // 情况1.这里能获得锁, worker_thread 已经执行到 wait()
        // 情况2.这里能获得锁, 但worker_thread 正在 unique_lock lk 等待锁
        //      这时候,当work_thread 获得锁,ready 一定变成 true ,不会执行wait了
        // 情况3, 没有获得锁, 直到 worker_thread 执行到wait(),变成情况1
        // 只有这3种情况, 总结: 
        // 要么 直接 worker_thread 没有执行_wait, ready是true
        // 要么是 worker_thread 执行慢,先wait,然后等待notify_one,然后获得锁
        ready = true;
        std::cout << "main() signals data ready for processing\n";
    }
    cv.notify_one();
 
    // wait for the worker
    // {
    //     std::unique_lock lk(m);
    //     cv.wait(lk, []{ return processed; });
    // }
    // std::cout << "Back in main(), data = " << data << '\n';
 
    worker.join();
    return 0;
}